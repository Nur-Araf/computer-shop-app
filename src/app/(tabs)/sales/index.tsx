import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


import type { InvoiceData } from "@/config/types/invoice";
import type {
  Customer,
  SelectedProduct,
  StoreProduct,
} from "@/config/types/saleTypes";
import type { ProductUnit } from "@/config/types/types";
import {
  CustomerService,
  InvoiceFirestoreService,
  ProductUnitService,
  SalesService,
  StoreProductService,
  TypeService,
  type SaleData,
} from "@/services/post.service";
import { saleCart, useSaleCart } from "../../../components/sales/Salecartstore";
import { formatCurrency } from "@/utils/format";
import { buildInvoiceHTML } from "@/utils/invoiceService";
import { digitsOnly } from "@/utils/phone";
import CustomerInputs from "@/components/sales/Customerinputs";
import CartList from "@/components/sales/Cartlist";
import FinalSummary from "@/components/sales/Finalsummary";
import ProductPickerModal from "@/components/sales/Productpickermodal";
import SaleSuccessModal from "@/components/sales/Salesuccessmodal";
import UnitSelectionModal from "@/components/sales/Unitselectionmodal";
import ConfirmSaleModal from "@/components/sales/Confirmsalemodal";

const RED = "#D52C3A";

// ---------- helpers ----------
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

const toNum = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

// Firestore Timestamp | Date | { seconds } -> ISO string | null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const warrantyToISO = (w: any): string | null => {
  if (!w) return null;
  if (w instanceof Date) return w.toISOString();
  if (typeof w.toDate === "function") return w.toDate().toISOString();
  if (typeof w.seconds === "number")
    return new Date(w.seconds * 1000).toISOString();
  return null;
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-3 mt-6 text-base font-bold text-[#252525]">
      {children}
    </Text>
  );
}

// ---------- screen ----------
export default function SalesScreen() {
  // data
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const router = useRouter();

  // cart (shared store, so the Scan tab can add products to it)
  const { selected, selectedUnitsMap } = useSaleCart();
  const setSelected = saleCart.setSelected;
  const setSelectedUnitsMap = saleCart.setSelectedUnitsMap;

  // form
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [discount, setDiscount] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [withDue, setWithDue] = useState(false);
  const [dueAmount, setDueAmount] = useState(0);
  const [showBasePrice, setShowBasePrice] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // ui
  const [showProducts, setShowProducts] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completedSale, setCompletedSale] = useState<InvoiceData | null>(null);

  // serial/unit selection
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [unitLoading, setUnitLoading] = useState(false);
  const [unitsMap, setUnitsMap] = useState<Record<string, ProductUnit[]>>({});

  // hard guard against double submit (state updates are async, a ref is not)
  const submittingRef = useRef(false);

  // ---------- load ----------
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [storeProducts, customerList, types] = await Promise.all([
        StoreProductService.getStoreProducts(),
        CustomerService.getCustomers(),
        TypeService.getTypes(),
      ]);
      setProducts(storeProducts);
      setCustomers(customerList);
      setCategories(
        types[0]?.categories ? ["all", ...types[0].categories] : ["all"],
      );
      setLoadError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setLoadError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- totals ----------
  const subtotal = useMemo(
    () =>
      round2(
        selected.reduce(
          (t, p) => t + (p.quantity || 0) * (p.sellPrice || 0),
          0,
        ),
      ),
    [selected],
  );
  const discountPercent = Math.min(100, toNum(discount));
  const discountAmount = round2(subtotal * (discountPercent / 100));
  const serviceChargeValue = toNum(serviceCharge);
  const total = round2(subtotal - discountAmount + serviceChargeValue);
  const hasZeroPrice = selected.some((p) => !p.sellPrice);

  // keep due within total when the cart changes
  useEffect(() => {
    if (withDue && dueAmount > total) setDueAmount(Math.max(0, total));
  }, [total, withDue, dueAmount]);

  const cartQty = useMemo(() => {
    const m: Record<string, number> = {};
    selected.forEach((p) => (m[p.id] = p.quantity));
    return m;
  }, [selected]);

  const isFormValid =
    customerName.trim() !== "" &&
    digitsOnly(phone).length >= 7 &&
    paymentType !== "" &&
    selected.length > 0 &&
    selected.every(
      (p) =>
        p.quantity > 0 &&
        p.quantity <= p.stock &&
        Number.isFinite(p.sellPrice) &&
        p.sellPrice >= 0,
    ) &&
    toNum(discount) <= 100 &&
    Number.isFinite(total) &&
    total >= 0;

  // ---------- cart actions ----------
  const dropUnitSelection = (id: string) =>
    setSelectedUnitsMap((m) => {
      if (!m[id]) return m;
      const { [id]: _removed, ...rest } = m;
      return rest;
    });

  const addProduct = (product: StoreProduct) => {
    if ((product.stock ?? 0) <= 0) return;
    setSelected((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // never exceed stock
        // keep already selected / scanned serials, the rest is auto-assigned at sale time
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const changeQuantity = (id: string, qty: number) => {
    const item = selected.find((p) => p.id === id);
    if (!item) return;

    const clamped = Math.max(0, Math.min(item.stock, Math.floor(qty)));
    if (clamped === item.quantity) return;

    // Quantity 0 is only a temporary state while typing: don't touch serials then.
    // Otherwise keep the first `clamped` serials (so scanned units survive).
    const trim = clamped >= 1;

    setSelected((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (!trim) return { ...p, quantity: clamped };
        const ids = (p.selectedUnitIds || []).slice(0, clamped);
        const serials = (p.serialNumbers || []).slice(0, clamped);
        return {
          ...p,
          quantity: clamped,
          selectedUnitIds: ids,
          serialNumbers: serials,
          warranty: ids.length ? p.warranty : null,
        };
      }),
    );

    if (trim) {
      setSelectedUnitsMap((m) =>
        m[id] ? { ...m, [id]: m[id].slice(0, clamped) } : m,
      );
    }
  };

  const changePrice = (id: string, price: number) => {
    const safe = Math.max(0, Math.min(10000000, price));
    setSelected((prev) =>
      prev.map((p) => (p.id === id ? { ...p, sellPrice: safe } : p)),
    );
  };

  const removeProduct = (id: string) => {
    setSelected((prev) => prev.filter((p) => p.id !== id));
    dropUnitSelection(id);
  };

  const selectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setPhone(c.phone);
  };

  // ---------- units dialog ----------
  const openUnitDialog = async () => {
    if (selected.length === 0) return;
    try {
      setShowUnitDialog(true);
      setUnitLoading(true);

      const map: Record<string, ProductUnit[]> = {};
      for (const product of selected) {
        const units = await ProductUnitService.getUnitsByProduct(product.id);
        const inStock = units.filter((u) => u.status === "in_stock");
        if (inStock.length > 0) map[product.id] = inStock;
      }
      setUnitsMap(map);
    } catch (err) {
      console.error("Failed to fetch units:", err);
      Alert.alert("Error", "Could not load serial numbers.");
      setShowUnitDialog(false);
    } finally {
      setUnitLoading(false);
    }
  };

  const confirmUnits = () => {
    setSelected((prev) =>
      prev.map((p) => {
        const units = selectedUnitsMap[p.id];
        if (!units?.length) return p;
        return {
          ...p,
          selectedUnitIds: units.map((u) => u.id),
          serialNumbers: units.map((u) => u.serialNumber),
          warranty: units[0]?.warranty || null,
        };
      }),
    );
    setShowUnitDialog(false);
  };

  const totalRequiredUnits = selected.reduce((s, p) => s + p.quantity, 0);
  const totalSelectedUnits = selected.reduce(
    (s, p) => s + (p.selectedUnitIds?.length || 0),
    0,
  );

  // ---------- reset ----------
  const clearCart = () => {
    setSelected([]);
    setSelectedUnitsMap({});
    setUnitsMap({});
    setCustomerName("");
    setPhone("");
    setPaymentType("");
    setSaleDate(new Date());
    setDiscount("");
    setServiceCharge("");
    setWithDue(false);
    setDueAmount(0);
    setShowErrors(false);
  };

  const confirmReset = () => {
    if (selected.length === 0 && !customerName && !phone) return clearCart();
    Alert.alert(
      "Reset form?",
      "This will clear the cart and customer details.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: clearCart },
      ],
    );
  };

  // ---------- submit ----------
  const onPressComplete = () => {
    setShowErrors(true);
    if (selected.length === 0) {
      Alert.alert(
        "No products",
        "Please add at least one product to complete the sale.",
      );
      return;
    }
    if (!isFormValid) {
      Alert.alert(
        "Check the form",
        "Fill in customer, phone and payment type, and make sure quantities do not exceed stock.",
      );
      return;
    }
    setShowConfirm(true);
  };

  const handleCompleteSale = async () => {
    if (submittingRef.current) return; // guard against double taps
    submittingRef.current = true;
    setSaving(true);

    const warnings: string[] = [];

    try {
      // 1) Fresh stock check (the list in memory may be stale)
      const freshStock: Record<string, number> = {};
      for (const item of selected) {
        const fresh = await StoreProductService.getStoreProduct(item.id);
        if (!fresh) throw new Error(`"${item.name}" no longer exists.`);
        if (fresh.stock < item.quantity) {
          throw new Error(
            `Not enough stock for "${item.name}". Available: ${fresh.stock}, requested: ${item.quantity}.`,
          );
        }
        freshStock[item.id] = fresh.stock;
      }

      // 2) Resolve units BEFORE building saleData (no state mutation)
      const resolved: SelectedProduct[] = [];
      for (const item of selected) {
        const units = await ProductUnitService.getUnitsByProduct(item.id);
        const inStock = units.filter((u) => u.status === "in_stock");

        let ids = (item.selectedUnitIds || []).slice(0, item.quantity);
        let serials = (item.serialNumbers || []).slice(0, ids.length);
        let warranty = ids.length ? (item.warranty ?? null) : null;

        // Scanned / picked serials must still be available (someone else may have sold them)
        const stale = ids.filter((id) => !inStock.some((u) => u.id === id));
        if (stale.length > 0) {
          throw new Error(
            `Some selected serials for "${item.name}" were already sold. Please re-select them.`,
          );
        }

        // Fewer serials than quantity (e.g. only one unit scanned): auto-fill the rest
        if (ids.length < item.quantity) {
          const extra = inStock
            .filter((u) => !ids.includes(u.id))
            .slice(0, item.quantity - ids.length);

          ids = [...ids, ...extra.map((u) => u.id)];
          serials = [...serials, ...extra.map((u) => u.serialNumber)];
          warranty = warranty ?? extra[0]?.warranty ?? null;
        }

        resolved.push({
          ...item,
          selectedUnitIds: ids,
          serialNumbers: serials,
          warranty,
        });
      }

      // 3) Build sale data
      const totalBaseAmount = round2(
        resolved.reduce((s, p) => s + p.quantity * p.basePrice, 0),
      );
      const profit = hasZeroPrice ? 0 : round2(total - totalBaseAmount);
      const actualDue = withDue ? Math.min(dueAmount, total) : 0;
      const paidAmount = round2(total - actualDue);

      // use the picked day + current time so UTC conversion cannot shift the day
      const dateWithTime = new Date(saleDate);
      const now = new Date();
      dateWithTime.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        0,
      );

      const saleData: SaleData = {
        customerName: customerName.trim(),
        phoneNumber: phone.trim(),
        paymentType,
        discount: discountPercent,
        serviceCharge: serviceChargeValue,
        products: resolved.map((p) => ({
          id: p.id,
          name: p.name,
          quantity: p.quantity,
          price: p.sellPrice,
          basePrice: p.basePrice,
          total: round2(p.quantity * p.sellPrice),
          serialNumbers: p.serialNumbers || [],
          warranty: warrantyToISO(p.warranty),
        })),
        subtotal,
        total,
        totalBaseAmount,
        profit,
        date: dateWithTime.toISOString(),
        orderId: `ORD-${Date.now()}`,
        paidAmount,
        dueAmount: actualDue,
        paymentStatus: actualDue > 0 ? "partial" : "paid",
      };

      // 4) Save the sale FIRST. If this fails nothing else has been touched.
      const savedSale: SaleData = await SalesService.addSale(saleData);

      // 5) Inventory (sale already exists, so failures here only warn)
      try {
        for (const item of resolved) {
          if (item.selectedUnitIds?.length) {
            await ProductUnitService.markUnitsAsSold(item.selectedUnitIds);
          }
          await StoreProductService.updateStoreProduct(item.id, {
            stock: Math.max(0, freshStock[item.id] - item.quantity),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn("Inventory update failed:", err);
        warnings.push(
          "Stock/serials may not be fully updated. Please check inventory.",
        );
      }

      // 6) Customer (match by digits so 01712-345678 == 01712345678)
      try {
        const totalQty = resolved.reduce((s, p) => s + p.quantity, 0);
        const existing = customers.find(
          (c) => digitsOnly(c.phone) === digitsOnly(phone),
        );
        if (existing) {
          await CustomerService.addPurchase(existing.id, totalQty, paidAmount);
        } else {
          await CustomerService.addCustomer(
            customerName.trim(),
            phone.trim(),
            "",
            "",
            paidAmount,
            totalQty,
          );
        }
      } catch (err) {
        console.warn("Customer update failed:", err);
        warnings.push("Customer record may not be updated.");
      }

      // 7) Invoice HTML (non-critical)
      // try {
      //   await InvoiceFirestoreService.saveInvoice(
      //     savedSale,
      //     buildInvoiceHTML(savedSale),
      //   );
      // } catch (err) {
      //   console.warn("Invoice save failed:", err);
      //   warnings.push("Invoice could not be stored.");
      // }

      // 8) Success: show invoice modal AND clear the cart right away
      setShowConfirm(false);
      setCompletedSale(savedSale as unknown as InvoiceData);
      clearCart();

      if (warnings.length) {
        Alert.alert("Sale saved with warnings", warnings.join("\n"));
      }

      // refresh lists in the background
      const [updatedProducts, updatedCustomers] = await Promise.all([
        StoreProductService.getStoreProducts(),
        CustomerService.getCustomers(),
      ]);
      setProducts(updatedProducts);
      setCustomers(updatedCustomers);
    } catch (err) {
      console.error("Sale failed:", err);
      setShowConfirm(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Alert.alert("Sale failed", (err as any)?.message || "Please try again.");
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  // ---------- render ----------
  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F5F5F5]">
        <ActivityIndicator size="large" color={RED} />
        <Text className="mt-3 text-[#777777]">Loading products...</Text>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F5F5F5] px-8">
        <Text className="text-center text-base text-red-500">{loadError}</Text>
        <Pressable
          onPress={load}
          className="mt-4 rounded-xl bg-[#D52C3A] px-6 py-3"
        >
          <Text className="font-semibold text-white">Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-[#252525]">New Sale</Text>

          {selected.length > 0 && (
            <View className="flex-row items-center gap-4">
              <Pressable onPress={openUnitDialog} hitSlop={8}>
                <Ionicons name="barcode-outline" size={26} color="#2563EB" />
                <View className="absolute -right-3 -top-2 rounded-full bg-red-500 px-1.5 py-0.5">
                  <Text className="text-[10px] font-bold text-white">
                    {totalSelectedUnits}/{totalRequiredUnits}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setShowBasePrice((v) => !v)}
                hitSlop={8}
              >
                <Ionicons
                  name={showBasePrice ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color="#16A34A"
                />
              </Pressable>

              <Pressable
                onPress={confirmReset}
                className="rounded-lg border border-[#DDDDDD] bg-white px-3 py-1.5"
              >
                <Text className="text-xs font-medium text-[#555555]">
                  Reset
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Customer */}
        <SectionTitle>Customer</SectionTitle>
        <CustomerInputs
          name={customerName}
          phone={phone}
          paymentType={paymentType}
          onNameChange={setCustomerName}
          onPhoneChange={setPhone}
          onPaymentChange={setPaymentType}
          customers={customers}
          onSelectCustomer={selectCustomer}
          showErrors={showErrors}
        />

        {/* Products */}
        <View className="mb-3 mt-6 flex-row items-center justify-between">
          <Text className="text-base font-bold text-[#252525]">
            Products{selected.length > 0 ? ` (${selected.length})` : ""}
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.navigate("/scan" as never)}
              className="flex-row items-center rounded-full border border-[#D52C3A] bg-white px-4 py-2"
            >
              <Ionicons name="qr-code-outline" size={16} color={RED} />
              <Text className="ml-1 text-sm font-semibold text-[#D52C3A]">
                Scan
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowProducts(true)}
              className="flex-row items-center rounded-full bg-[#D52C3A] px-4 py-2"
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text className="ml-1 text-sm font-semibold text-white">
                Add products
              </Text>
            </Pressable>
          </View>
        </View>

        <CartList
          items={selected}
          showBasePrice={showBasePrice}
          onQuantityChange={changeQuantity}
          onPriceChange={changePrice}
          onRemove={removeProduct}
          onOpenProducts={() => setShowProducts(true)}
        />

        {selected.length > 0 && (
          <>
            {/* Date, discount, service charge */}
            <SectionTitle>Date & Charges</SectionTitle>
            <View className="gap-4">
              <View>
                <Text className="mb-1.5 text-sm font-medium text-[#555555]">
                  Sale Date
                </Text>
                <Pressable
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center rounded-xl border border-[#DDDDDD] bg-white px-4 py-3"
                >
                  <Ionicons name="calendar-outline" size={18} color="#777777" />
                  <Text className="ml-2 text-[15px] font-bold text-[#252525]">
                    {formatDate(saleDate)}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={saleDate}
                    mode="date"
                    maximumDate={new Date()}
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={(_, date) => {
                      if (Platform.OS !== "ios") setShowDatePicker(false);
                      if (date) setSaleDate(date);
                    }}
                  />
                )}
                {Platform.OS === "ios" && showDatePicker && (
                  <Pressable
                    onPress={() => setShowDatePicker(false)}
                    className="mt-2 items-end"
                  >
                    <Text className="font-semibold text-[#D52C3A]">Done</Text>
                  </Pressable>
                )}
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-1.5 text-sm font-medium text-[#555555]">
                    Discount (%)
                  </Text>
                  <TextInput
                    value={discount}
                    onChangeText={(t) => {
                      if (t === "" || /^\d*\.?\d*$/.test(t)) setDiscount(t);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 5"
                    placeholderTextColor="#999999"
                    className={`rounded-xl border bg-white px-4 py-3 text-[15px] text-[#252525] ${
                      toNum(discount) > 100
                        ? "border-red-500"
                        : "border-[#DDDDDD]"
                    }`}
                  />
                  {toNum(discount) > 100 && (
                    <Text className="mt-1 text-xs text-red-500">Max 100%</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="mb-1.5 text-sm font-medium text-[#555555]">
                    Service Charge (BDT)
                  </Text>
                  <TextInput
                    value={serviceCharge}
                    onChangeText={(t) => {
                      if (t === "" || /^\d*\.?\d*$/.test(t))
                        setServiceCharge(t);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 1000"
                    placeholderTextColor="#999999"
                    className="rounded-xl border border-[#DDDDDD] bg-white px-4 py-3 text-[15px] text-[#252525]"
                  />
                </View>
              </View>
            </View>

            {/* Summary */}
            <SectionTitle>Summary</SectionTitle>
            <FinalSummary
              subtotal={subtotal}
              discountPercent={discountPercent}
              discountAmount={discountAmount}
              serviceCharge={serviceChargeValue}
              total={total}
              withDue={withDue}
              onToggleDue={(v) => {
                setWithDue(v);
                setDueAmount(v ? Math.ceil(total / 2) : 0);
              }}
              dueAmount={dueAmount}
              onDueChange={setDueAmount}
            />

            {hasZeroPrice && (
              <View className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <Text className="text-sm text-yellow-800">
                  Some items have a price of 0. Profit will be recorded as 0 for
                  this sale.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Sticky bottom bar */}
      {selected.length > 0 && (
        <View className="flex-row items-center justify-between border-t border-[#EAEAEA] bg-white px-5 py-3">
          <View>
            <Text className="text-xs text-[#777777]">
              {withDue ? "Total" : "Amount due"}
            </Text>
            <Text className="text-lg font-bold text-[#252525]">
              {formatCurrency(total)} BDT
            </Text>
          </View>
          <Pressable
            onPress={onPressComplete}
            disabled={saving || !isFormValid}
            className={`flex-row items-center rounded-xl px-6 py-3.5 ${
              saving || !isFormValid ? "bg-gray-400" : "bg-[#D52C3A]"
            }`}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
            )}
            <Text className="ml-2 font-semibold text-white">
              {saving ? "Processing..." : "Complete Sale"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Modals */}
      <ProductPickerModal
        visible={showProducts}
        onClose={() => setShowProducts(false)}
        products={products}
        categories={categories}
        cartQty={cartQty}
        onAdd={addProduct}
      />

      <UnitSelectionModal
        visible={showUnitDialog}
        products={selected}
        unitsMap={unitsMap}
        selectedUnitsMap={selectedUnitsMap}
        setSelectedUnitsMap={setSelectedUnitsMap}
        onClose={() => setShowUnitDialog(false)}
        onConfirm={confirmUnits}
        loading={unitLoading}
      />

      <ConfirmSaleModal
        visible={showConfirm}
        customerName={customerName}
        totalAmount={total}
        saleDate={saleDate}
        withDue={withDue}
        dueAmount={dueAmount}
        loading={saving}
        formatCurrency={formatCurrency}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleCompleteSale}
      />

      <SaleSuccessModal
        sale={completedSale}
        onNewSale={() => setCompletedSale(null)}
      />
    </SafeAreaView>
  );
}
