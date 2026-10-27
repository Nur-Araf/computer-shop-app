import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import type { SelectedProduct } from "@/config/types/saleTypes";
import { formatCurrency } from "@/utils/format";

type Props = {
  items: SelectedProduct[];
  showBasePrice: boolean;
  onQuantityChange: (id: string, qty: number) => void;
  onPriceChange: (id: string, price: number) => void;
  onRemove: (id: string) => void;
  onOpenProducts: () => void;
};

const toNum = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

function CartRow({
  item,
  showBasePrice,
  onQuantityChange,
  onPriceChange,
  onRemove,
}: {
  item: SelectedProduct;
  showBasePrice: boolean;
  onQuantityChange: Props["onQuantityChange"];
  onPriceChange: Props["onPriceChange"];
  onRemove: Props["onRemove"];
}) {
  const [qtyText, setQtyText] = useState(String(item.quantity));
  const [priceText, setPriceText] = useState(String(item.sellPrice ?? ""));

  // keep local text in sync when the value changes from outside (stepper, clamping)
  useEffect(() => {
    if (toNum(qtyText) !== item.quantity) setQtyText(String(item.quantity));
  }, [item.quantity]);

  useEffect(() => {
    if (toNum(priceText) !== (item.sellPrice ?? 0)) {
      setPriceText(String(item.sellPrice ?? ""));
    }
  }, [item.sellPrice]);

  const qty = item.quantity || 0;
  const overStock = qty > item.stock;
  const lineTotal = qty * (item.sellPrice || 0);
  const belowBase = item.sellPrice < item.basePrice;

  return (
    <View className="rounded-2xl border border-[#EAEAEA] bg-white p-4">
      {/* Top: name + remove */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[15px] font-semibold text-[#252525]">
            {item.name}
          </Text>
          <Text className="mt-1 text-xs text-[#777777]">
            Base: {showBasePrice ? formatCurrency(item.basePrice) : "•••••"} •{" "}
            {item.stock} in stock
          </Text>
        </View>
        <Pressable
          onPress={() => onRemove(item.id)}
          hitSlop={10}
          className="rounded-lg p-2 active:bg-red-50"
        >
          <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Bottom: qty + price + total */}
      <View className="mt-3 flex-row items-end justify-between">
        {/* Qty */}
        <View>
          <Text className="mb-1 text-[11px] uppercase text-[#999999]">Qty</Text>
          <View className="flex-row items-center">
            <Pressable
              disabled={qty <= 1}
              onPress={() => onQuantityChange(item.id, qty - 1)}
              className={`h-9 w-9 items-center justify-center rounded-lg border border-[#DDDDDD] ${
                qty <= 1 ? "opacity-40" : ""
              }`}
            >
              <Ionicons name="remove" size={18} color="#555555" />
            </Pressable>
            <TextInput
              value={qtyText}
              keyboardType="number-pad"
              onChangeText={(t) => {
                if (t === "" || /^\d+$/.test(t)) {
                  setQtyText(t);
                  onQuantityChange(item.id, t === "" ? 0 : parseInt(t, 10));
                }
              }}
              onBlur={() => {
                if (qty < 1) onQuantityChange(item.id, 1);
              }}
              style={{
                paddingTop: 0,
                paddingBottom: 0,
                textAlignVertical: "center",
              }}
              className={`mx-1.5 h-9 w-14 rounded-lg border bg-white px-1 py-0 text-center text-sm leading-5 text-[#252525] ${
                overStock ? "border-red-500" : "border-[#DDDDDD]"
              }`}
            />
            <Pressable
              disabled={qty >= item.stock}
              onPress={() => onQuantityChange(item.id, qty + 1)}
              className={`h-9 w-9 items-center justify-center rounded-lg border border-[#DDDDDD] ${
                qty >= item.stock ? "opacity-40" : ""
              }`}
            >
              <Ionicons name="add" size={18} color="#555555" />
            </Pressable>
          </View>
        </View>

        {/* Price */}
        <View className="mx-3 flex-1">
          <Text className="mb-1 text-[11px] uppercase text-[#999999]">
            Price
          </Text>
          <TextInput
            value={priceText}
            keyboardType="decimal-pad"
            onChangeText={(t) => {
              if (t === "" || /^\d*\.?\d*$/.test(t)) {
                setPriceText(t);
                onPriceChange(item.id, toNum(t));
              }
            }}
            placeholder={formatCurrency(item.basePrice)}
            placeholderTextColor="#BBBBBB"
            style={{
              paddingTop: 0,
              paddingBottom: 0,
              textAlignVertical: "center",
            }}
            className={`h-9 rounded-lg border bg-white px-2 py-0 text-sm leading-5 text-[#252525] ${
              !item.sellPrice ? "border-red-400" : "border-[#DDDDDD]"
            }`}
          />
        </View>

        {/* Total */}
        <View className="items-end">
          <Text className="mb-1 text-[11px] uppercase text-[#999999]">
            Total
          </Text>
          <Text className="h-9 text-base font-bold leading-9 text-[#252525]">
            {formatCurrency(lineTotal)}
          </Text>
        </View>
      </View>

      {overStock && (
        <Text className="mt-2 text-xs font-medium text-red-600">
          Quantity is more than available stock ({item.stock})
        </Text>
      )}
      {!overStock && !item.sellPrice && (
        <Text className="mt-2 text-xs font-medium text-red-600">
          Price is 0. This item will be sold for free.
        </Text>
      )}
      {!overStock && !!item.sellPrice && belowBase && (
        <Text className="mt-2 text-xs font-medium text-amber-600">
          Price is below the base price.
        </Text>
      )}
    </View>
  );
}

export default function CartList({
  items,
  showBasePrice,
  onQuantityChange,
  onPriceChange,
  onRemove,
  onOpenProducts,
}: Props) {
  if (items.length === 0) {
    return (
      <Pressable
        onPress={onOpenProducts}
        className="items-center rounded-2xl border border-dashed border-[#D52C3A]/40 bg-white py-10"
      >
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#D52C3A]/10">
          <Ionicons name="cart-outline" size={30} color="#D52C3A" />
        </View>
        <Text className="mt-3 text-base font-semibold text-[#252525]">
          No products selected
        </Text>
        <Text className="mt-1 text-sm text-[#777777]">
          Tap here to add products
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="gap-3">
      {items.map((item) => (
        <CartRow
          key={item.id}
          item={item}
          showBasePrice={showBasePrice}
          onQuantityChange={onQuantityChange}
          onPriceChange={onPriceChange}
          onRemove={onRemove}
        />
      ))}
    </View>
  );
}
