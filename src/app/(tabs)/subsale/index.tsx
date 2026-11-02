import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DueCard from "../../../components/unpaid/Duecard";
import ReminderModal from "../../../components/unpaid/Remindermodal";
import {
  ensureReminderPermission,
  fmtDateTime,
  loadReminders,
  pruneReminders,
  removeReminder,
  scheduleReminder,
  type ReminderMap,
} from "../../../components/unpaid/Duereminderservice";
import { SalesService, type SaleData } from "@/services/post.service";
import { formatCurrency } from "@/utils/format";

const RED = "#D52C3A";

type Filter = "all" | "reminder" | "overdue";
type Sort = "newest" | "oldest" | "highest";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// Remaining amount of a sale. Older records may not have `dueAmount`.
const getDue = (sale: SaleData): number => {
  const total = sale.total || 0;
  const paid = sale.paidAmount || 0;
  const due =
    typeof sale.dueAmount === "number" ? sale.dueAmount : total - paid;
  return Math.max(0, round2(due));
};

const isUnpaid = (sale: SaleData) => !!sale.id && getDue(sale) > 0.009;

const saleTime = (s: SaleData) => {
  const t = s.date ? new Date(s.date).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
};

export default function UnpaidScreen() {
  const [sales, setSales] = useState<SaleData[]>([]);
  const [reminders, setReminders] = useState<ReminderMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [reminderSale, setReminderSale] = useState<SaleData | null>(null);

  const [toast, setToast] = useState<{
    text: string;
    type: "ok" | "error";
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string, type: "ok" | "error" = "ok") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, type });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  // ---------- load ----------
  const load = useCallback(async (mode: "initial" | "refresh" | "silent") => {
    try {
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);

      const allSales = await SalesService.getSales();
      const due = allSales.filter(isUnpaid);

      // forget reminders of orders that are fully paid now
      const pruned = await pruneReminders(
        new Set(due.map((s) => s.id as string)),
      );

      setSales(due);
      setReminders(pruned);
      setError(null);
    } catch (err) {
      console.error("Error fetching sales:", err);
      if (mode !== "silent") setError("Failed to load due payments");
      // keep saved reminders visible even if the network failed
      setReminders(await loadReminders());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // load on first open and refresh whenever the tab is focused (new sales may exist)
  const firstLoad = useRef(true);
  useFocusEffect(
    useCallback(() => {
      void load(firstLoad.current ? "initial" : "silent");
      firstLoad.current = false;
    }, [load]),
  );

  // ---------- derived ----------
  const visibleSales = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = Date.now();

    let list = sales.filter((s) => {
      if (term) {
        const match =
          s.customerName?.toLowerCase().includes(term) ||
          s.phoneNumber?.includes(term) ||
          s.orderId?.toLowerCase().includes(term);
        if (!match) return false;
      }

      const r = s.id ? reminders[s.id] : undefined;
      if (filter === "reminder") return !!r;
      if (filter === "overdue")
        return !!r && new Date(r.remindAt).getTime() <= now;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "highest") return getDue(b) - getDue(a);
      if (sort === "oldest") return saleTime(a) - saleTime(b);
      return saleTime(b) - saleTime(a);
    });

    return list;
  }, [sales, reminders, search, filter, sort]);

  const totalDue = useMemo(
    () => round2(visibleSales.reduce((sum, s) => sum + getDue(s), 0)),
    [visibleSales],
  );
  const customerCount = useMemo(
    () =>
      new Set(visibleSales.map((s) => s.phoneNumber || s.customerName)).size,
    [visibleSales],
  );
  const reminderCount = useMemo(
    () => sales.filter((s) => s.id && reminders[s.id]).length,
    [sales, reminders],
  );

  // ---------- payment ----------
  const receivePayment = async (
    sale: SaleData,
    amount: number,
  ): Promise<boolean> => {
    if (!sale.id) return false;
    const saleId = sale.id;
    const value = round2(amount);

    if (!Number.isFinite(value) || value <= 0) {
      showToast("Please enter a valid payment amount", "error");
      return false;
    }

    setPayingId(saleId);
    try {
      // always work from the latest record, another device may have changed it
      const fresh = await SalesService.getSale(saleId);
      if (!fresh) {
        showToast("Sale not found", "error");
        return false;
      }

      const freshDue = getDue(fresh);
      if (value > freshDue + 0.001) {
        showToast(
          `Payment cannot exceed ৳${formatCurrency(freshDue)}`,
          "error",
        );
        setSales((prev) =>
          prev.map((s) =>
            s.id === saleId
              ? { ...s, paidAmount: fresh.paidAmount, dueAmount: freshDue }
              : s,
          ),
        );
        return false;
      }

      const newPaid = round2((fresh.paidAmount || 0) + value);
      const newDue = Math.max(0, round2(freshDue - value));
      const status: "paid" | "partial" | "unpaid" =
        newDue === 0 ? "paid" : newPaid === 0 ? "unpaid" : "partial";

      await SalesService.updateSale(saleId, {
        paidAmount: newPaid,
        dueAmount: newDue,
        paymentStatus: status,
      });

      if (newDue === 0) {
        // fully paid: remove from the list and cancel its reminder
        setSales((prev) => prev.filter((s) => s.id !== saleId));
        setReminders(await removeReminder(saleId));
        setExpandedId(null);
        showToast(`Fully paid! ৳${formatCurrency(value)} received`);
      } else {
        setSales((prev) =>
          prev.map((s) =>
            s.id === saleId
              ? {
                  ...s,
                  paidAmount: newPaid,
                  dueAmount: newDue,
                  paymentStatus: status,
                }
              : s,
          ),
        );
        showToast(
          `৳${formatCurrency(value)} received. ৳${formatCurrency(newDue)} left`,
        );
      }
      return true;
    } catch (err) {
      console.error("Error processing payment:", err);
      showToast("Failed to process payment", "error");
      return false;
    } finally {
      setPayingId(null);
    }
  };

  // ---------- reminders ----------
  const saveReminder = async (date: Date, note: string) => {
    const sale = reminderSale;
    if (!sale?.id) return;

    try {
      const allowed = await ensureReminderPermission();
      if (!allowed) {
        Alert.alert(
          "Notifications are off",
          "Allow notifications for this app in your phone settings to get payment reminders.",
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Open settings",
              onPress: () => void Linking.openSettings(),
            },
          ],
        );
        return;
      }

      const map = await scheduleReminder({
        saleId: sale.id,
        customerName: sale.customerName,
        orderId: sale.orderId,
        dueAmount: getDue(sale),
        remindAt: date,
        note,
      });
      setReminders(map);
      setReminderSale(null);
      showToast(`Reminder set for ${fmtDateTime(date)}`);
    } catch (err) {
      console.error("Reminder failed:", err);
      showToast("Could not set the reminder", "error");
    }
  };

  const deleteReminder = async () => {
    const sale = reminderSale;
    if (!sale?.id) return;
    try {
      setReminders(await removeReminder(sale.id));
      setReminderSale(null);
      showToast("Reminder removed");
    } catch {
      showToast("Could not remove the reminder", "error");
    }
  };

  // ---------- render ----------
  const FilterChip = ({
    value,
    label,
    count,
  }: {
    value: Filter;
    label: string;
    count?: number;
  }) => {
    const on = filter === value;
    return (
      <Pressable
        onPress={() => setFilter(value)}
        className={`mr-2 rounded-full border px-4 py-2 ${
          on ? "border-[#D52C3A] bg-[#D52C3A]" : "border-[#DDDDDD] bg-white"
        }`}
      >
        <Text
          className={`text-sm font-medium ${on ? "text-white" : "text-[#555555]"}`}
        >
          {label}
          {count !== undefined ? ` (${count})` : ""}
        </Text>
      </Pressable>
    );
  };

  const cycleSort = () =>
    setSort((s) =>
      s === "newest" ? "highest" : s === "highest" ? "oldest" : "newest",
    );

  const sortLabel =
    sort === "newest" ? "Newest" : sort === "oldest" ? "Oldest" : "Highest due";

  const header = (
    <View>
      <Text className="text-2xl font-bold text-[#252525]">Due Payments</Text>
      <Text className="mt-1 text-sm text-[#777777]">
        Pending payments from partial and unpaid sales
      </Text>

      {/* Search */}
      <View className="mt-4 flex-row items-center rounded-xl border border-[#EAEAEA] bg-white px-3">
        <Ionicons name="search" size={18} color="#999999" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, phone or order ID..."
          placeholderTextColor="#999999"
          className="ml-2 flex-1 py-3 text-[15px] text-[#252525]"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color="#BBBBBB" />
          </Pressable>
        )}
      </View>

      {/* Summary */}
      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-2xl border border-[#EAEAEA] bg-white p-3">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color="#777777" />
            <Text className="ml-1 text-xs text-[#777777]">Pending</Text>
          </View>
          <Text className="mt-1 text-xl font-bold text-[#252525]">
            {visibleSales.length}
          </Text>
        </View>
        <View className="flex-[1.6] rounded-2xl border border-red-100 bg-white p-3">
          <Text className="text-xs text-[#777777]">Total due</Text>
          <Text
            className="mt-1 text-xl font-bold text-red-600"
            numberOfLines={1}
          >
            ৳{formatCurrency(totalDue)}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl border border-[#EAEAEA] bg-white p-3">
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={16} color="#777777" />
            <Text className="ml-1 text-xs text-[#777777]">Customers</Text>
          </View>
          <Text className="mt-1 text-xl font-bold text-[#252525]">
            {customerCount}
          </Text>
        </View>
      </View>

      {/* Filters + sort */}
      <View className="mt-4 flex-row items-center">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
        >
          <FilterChip value="all" label="All" count={sales.length} />
          <FilterChip
            value="reminder"
            label="With reminder"
            count={reminderCount}
          />
          <FilterChip value="overdue" label="Reminder passed" />
        </ScrollView>
        <Pressable
          onPress={cycleSort}
          className="ml-2 flex-row items-center rounded-full border border-[#DDDDDD] bg-white px-3 py-2"
        >
          <Ionicons name="swap-vertical" size={14} color="#555555" />
          <Text className="ml-1 text-xs font-medium text-[#555555]">
            {sortLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-[#F5F5F5]"
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={RED} />
        <Text className="mt-3 text-[#777777]">Loading due payments...</Text>
      </SafeAreaView>
    );
  }

  if (error && sales.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-[#F5F5F5] px-8"
        edges={["top"]}
      >
        <Ionicons name="cloud-offline-outline" size={44} color="#BBBBBB" />
        <Text className="mt-3 text-center text-base text-red-500">{error}</Text>
        <Pressable
          onPress={() => void load("initial")}
          className="mt-4 rounded-xl bg-[#D52C3A] px-6 py-3"
        >
          <Text className="font-semibold text-white">Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const reminderForModal = reminderSale?.id
    ? reminders[reminderSale.id]
    : undefined;

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top"]}>
      <StatusBar style="dark" />

      <FlatList
        data={visibleSales}
        keyExtractor={(s) => s.id as string}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-10 pt-4"
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={<View className="mb-4">{header}</View>}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load("refresh")}
            tintColor={RED}
            colors={[RED]}
          />
        }
        ListEmptyComponent={
          <View className="items-center rounded-2xl border border-[#EAEAEA] bg-white px-6 py-12">
            <Ionicons name="checkmark-circle" size={52} color="#22C55E" />
            <Text className="mt-3 text-lg font-semibold text-[#252525]">
              {sales.length === 0
                ? "No pending payments"
                : "No matching orders"}
            </Text>
            <Text className="mt-1 text-center text-sm text-[#777777]">
              {sales.length === 0
                ? "All sales are fully paid. Great job!"
                : "Try a different search or filter."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const id = item.id as string;
          return (
            <DueCard
              sale={item}
              due={getDue(item)}
              reminder={reminders[id]}
              expanded={expandedId === id}
              paying={payingId === id}
              onToggle={() => setExpandedId((cur) => (cur === id ? null : id))}
              onPay={(amount) => receivePayment(item, amount)}
              onReminder={() => setReminderSale(item)}
            />
          );
        }}
      />

      {/* Toast */}
      {toast && (
        <View
          pointerEvents="none"
          className="absolute bottom-6 left-5 right-5 items-center"
        >
          <View
            className={`flex-row items-center rounded-full px-4 py-3 shadow-lg ${
              toast.type === "ok" ? "bg-[#252525]" : "bg-red-600"
            }`}
          >
            <Ionicons
              name={toast.type === "ok" ? "checkmark-circle" : "alert-circle"}
              size={18}
              color="#FFFFFF"
            />
            <Text className="ml-2 text-sm font-medium text-white">
              {toast.text}
            </Text>
          </View>
        </View>
      )}

      <ReminderModal
        visible={!!reminderSale}
        customerName={reminderSale?.customerName ?? ""}
        orderId={reminderSale?.orderId ?? ""}
        dueText={reminderSale ? `৳${formatCurrency(getDue(reminderSale))}` : ""}
        existing={reminderForModal}
        onClose={() => setReminderSale(null)}
        onSave={(date, note) => void saveReminder(date, note)}
        onRemove={() => void deleteReminder()}
      />
    </SafeAreaView>
  );
}
