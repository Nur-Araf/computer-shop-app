import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { SelectedProduct } from "@/config/types/saleTypes";
import type { ProductUnit } from "@/config/types/types";

type UnitsMap = Record<string, ProductUnit[]>;

type Props = {
  visible: boolean;
  products: SelectedProduct[];
  unitsMap: UnitsMap;
  selectedUnitsMap: UnitsMap;
  setSelectedUnitsMap: (map: UnitsMap) => void;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

// Firestore Timestamp | Date | { seconds } -> Date | null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toDate = (w: any): Date | null => {
  if (!w) return null;
  if (w instanceof Date) return w;
  if (typeof w.toDate === "function") return w.toDate();
  if (typeof w.seconds === "number") return new Date(w.seconds * 1000);
  return null;
};

function WarrantyText({ warranty }: { warranty: unknown }) {
  const expiry = toDate(warranty);
  if (!expiry) return null;
  const days = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
  return (
    <Text className="mt-1 text-xs text-[#777777]">
      {days > 0
        ? `Warranty: ${expiry.toLocaleDateString()} (${days} days left)`
        : `Expired: ${expiry.toLocaleDateString()}`}
    </Text>
  );
}

export default function UnitSelectionModal({
  visible,
  products,
  unitsMap,
  selectedUnitsMap,
  setSelectedUnitsMap,
  onClose,
  onConfirm,
  loading,
}: Props) {
  // Only products that actually have in-stock units need a selection step.
  const list = useMemo(
    () => products.filter((p) => (unitsMap[p.id] || []).length > 0),
    [products, unitsMap],
  );

  const [index, setIndex] = useState(0);

  // Open on the first product whose selection is incomplete
  useEffect(() => {
    if (!visible || loading) return;
    const i = list.findIndex(
      (p) => (selectedUnitsMap[p.id]?.length || 0) !== p.quantity,
    );
    setIndex(i < 0 ? 0 : i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, loading]);

  const allValid = list.every(
    (p) => (selectedUnitsMap[p.id]?.length || 0) === p.quantity,
  );

  const current = list[Math.min(index, Math.max(list.length - 1, 0))];

  const toggle = (unit: ProductUnit) => {
    if (!current) return;
    const selected = selectedUnitsMap[current.id] || [];
    const exists = selected.some((u) => u.id === unit.id);

    let next: ProductUnit[];
    if (exists) {
      next = selected.filter((u) => u.id !== unit.id);
    } else {
      if (selected.length >= current.quantity) return;
      next = [...selected, unit];
    }
    setSelectedUnitsMap({ ...selectedUnitsMap, [current.id]: next });
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View className="items-center py-16">
          <ActivityIndicator color="#2563EB" />
          <Text className="mt-2 text-sm text-[#777777]">Loading units...</Text>
        </View>
      );
    }

    if (!current) {
      return (
        <View className="items-center py-12">
          <Ionicons
            name="information-circle-outline"
            size={32}
            color="#999999"
          />
          <Text className="mt-2 px-6 text-center text-sm text-[#777777]">
            None of the selected products have tracked serial numbers. You can
            complete the sale directly.
          </Text>
          <Pressable
            onPress={onClose}
            className="mt-5 rounded-xl bg-[#D52C3A] px-6 py-3"
          >
            <Text className="font-semibold text-white">Close</Text>
          </Pressable>
        </View>
      );
    }

    const units = unitsMap[current.id] || [];
    const selected = selectedUnitsMap[current.id] || [];
    const isLast = index >= list.length - 1;
    const stepDone = selected.length === current.quantity;

    return (
      <>
        <View className="mb-4">
          <Text className="pr-8 text-xl font-bold text-[#252525]">
            {current.name}
          </Text>
          <View className="mt-1 flex-row items-center justify-between">
            <Text className="text-sm text-[#777777]">
              Product {index + 1} of {list.length}
            </Text>
            <Text
              className={`text-sm font-semibold ${
                stepDone ? "text-green-600" : "text-blue-600"
              }`}
            >
              Selected: {selected.length} / {current.quantity}
            </Text>
          </View>
        </View>

        <View className="mb-5 h-1.5 w-full rounded-full bg-[#F0F0F0]">
          <View
            className="h-1.5 rounded-full bg-blue-600"
            style={{ width: `${((index + 1) / list.length) * 100}%` }}
          />
        </View>

        <ScrollView style={{ maxHeight: 320 }} className="mb-5">
          <View className="gap-2">
            {units.map((unit) => {
              const on = selected.some((u) => u.id === unit.id);
              return (
                <Pressable
                  key={unit.id}
                  onPress={() => toggle(unit)}
                  className={`rounded-xl border-2 p-4 ${
                    on
                      ? "border-blue-500 bg-blue-50"
                      : "border-[#F0F0F0] bg-white"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-[#444444]">
                      SN: {unit.serialNumber}
                    </Text>
                    {on && (
                      <View className="h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                        <View className="h-2 w-2 rounded-full bg-white" />
                      </View>
                    )}
                  </View>
                  <WarrantyText warranty={unit.warranty} />
                  {!!unit.wholeseller && (
                    <Text className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#999999]">
                      Source: {unit.wholeseller}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="flex-row gap-3">
          <Pressable
            disabled={index === 0}
            onPress={() => setIndex((i) => Math.max(i - 1, 0))}
            className={`flex-1 items-center rounded-xl border border-[#E5E5E5] py-3 ${
              index === 0 ? "opacity-30" : ""
            }`}
          >
            <Text className="font-medium text-[#555555]">Previous</Text>
          </Pressable>

          {isLast ? (
            <Pressable
              disabled={!allValid}
              onPress={onConfirm}
              className={`flex-[2] items-center rounded-xl bg-green-600 py-3 ${
                !allValid ? "opacity-50" : ""
              }`}
            >
              <Text className="font-bold text-white">
                Confirm All Selections
              </Text>
            </Pressable>
          ) : (
            <Pressable
              disabled={!stepDone}
              onPress={() => setIndex((i) => Math.min(i + 1, list.length - 1))}
              className={`flex-[2] items-center rounded-xl bg-blue-600 py-3 ${
                !stepDone ? "opacity-50" : ""
              }`}
            >
              <Text className="font-bold text-white">Next Product</Text>
            </Pressable>
          )}
        </View>
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-4">
        <View className="w-full max-w-lg rounded-2xl bg-white p-5">
          <Pressable
            onPress={onClose}
            hitSlop={10}
            className="absolute right-4 top-4 z-10 p-1"
          >
            <Ionicons name="close" size={22} color="#9CA3AF" />
          </Pressable>
          {renderBody()}
        </View>
      </View>
    </Modal>
  );
}
