import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import type { SaleData } from "@/services/post.service";
import {
  fmtDateTime,
  type DueReminder,
} from "../../components/unpaid/Duereminderservice";
import { formatCurrency } from "@/utils/format";

const RED = "#D52C3A";

type Props = {
  sale: SaleData;
  due: number;
  reminder?: DueReminder;
  expanded: boolean;
  paying: boolean;
  onToggle: () => void;
  onPay: (amount: number) => Promise<boolean>;
  onReminder: () => void;
};

export default function DueCard({
  sale,
  due,
  reminder,
  expanded,
  paying,
  onToggle,
  onPay,
  onReminder,
}: Props) {
  const [amountText, setAmountText] = useState("");

  const total = sale.total || 0;
  const paid = sale.paidAmount || 0;
  const pct = total > 0 ? Math.min(100, Math.max(0, (paid / total) * 100)) : 0;

  const remindDate = reminder ? new Date(reminder.remindAt) : null;
  const reminderOverdue = !!remindDate && remindDate.getTime() <= Date.now();

  const amount = parseFloat(amountText);
  const amountValid =
    Number.isFinite(amount) && amount > 0 && amount <= due + 0.001;

  const submit = async (value: number) => {
    const ok = await onPay(value);
    if (ok) setAmountText("");
  };

  const confirmFull = () => {
    Alert.alert(
      "Receive full due amount?",
      `${sale.customerName} will be marked as paid for ৳${formatCurrency(due)}.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Receive", onPress: () => void submit(due) },
      ],
    );
  };

  const call = () => {
    if (!sale.phoneNumber) return;
    void Linking.openURL(`tel:${sale.phoneNumber}`);
  };

  return (
    <View className="rounded-2xl border border-[#EAEAEA] bg-white p-4">
      {/* Top: customer + status */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-bold text-[#252525]">
            {sale.customerName}
          </Text>
          <Text className="mt-0.5 text-xs text-[#777777]">
            {sale.phoneNumber} • {sale.orderId}
          </Text>
          <Text className="mt-0.5 text-xs text-[#999999]">
            {sale.date
              ? new Date(sale.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "N/A"}
          </Text>
        </View>

        <View className="items-end">
          <View
            className={`rounded-full px-3 py-1 ${
              sale.paymentStatus === "partial" ? "bg-yellow-100" : "bg-red-100"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                sale.paymentStatus === "partial"
                  ? "text-yellow-800"
                  : "text-red-800"
              }`}
            >
              {sale.paymentStatus === "partial" ? "Partial" : "Unpaid"}
            </Text>
          </View>
        </View>
      </View>

      {/* Amounts */}
      <View className="mt-4 flex-row">
        <View className="flex-1">
          <Text className="text-xs text-[#777777]">Total</Text>
          <Text className="mt-0.5 text-sm font-semibold text-[#252525]">
            ৳{formatCurrency(total)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-[#777777]">Paid</Text>
          <Text className="mt-0.5 text-sm font-semibold text-green-600">
            ৳{formatCurrency(paid)}
          </Text>
        </View>
        <View className="flex-1 items-end">
          <Text className="text-xs text-[#777777]">Due</Text>
          <Text className="mt-0.5 text-lg font-bold text-red-600">
            ৳{formatCurrency(due)}
          </Text>
        </View>
      </View>

      <View className="mt-3 h-2 w-full rounded-full bg-[#EEEEEE]">
        <View
          className="h-2 rounded-full bg-green-500"
          style={{ width: `${pct}%` }}
        />
      </View>

      {/* Reminder row */}
      <Pressable
        onPress={onReminder}
        className={`mt-4 flex-row items-center rounded-xl border px-3 py-2.5 ${
          reminder
            ? reminderOverdue
              ? "border-red-200 bg-red-50"
              : "border-[#D52C3A]/25 bg-[#D52C3A]/5"
            : "border-dashed border-[#CCCCCC] bg-[#FAFAFA]"
        }`}
      >
        <Ionicons
          name={reminder ? "alarm" : "alarm-outline"}
          size={20}
          color={reminder ? RED : "#888888"}
        />
        <View className="ml-2 flex-1">
          {reminder && remindDate ? (
            <>
              <Text
                className={`text-sm font-semibold ${
                  reminderOverdue ? "text-red-700" : "text-[#252525]"
                }`}
              >
                {reminderOverdue ? "Reminder time passed" : "Reminder"} •{" "}
                {fmtDateTime(remindDate)}
              </Text>
              {!!reminder.note && (
                <Text
                  className="mt-0.5 text-xs text-[#777777]"
                  numberOfLines={1}
                >
                  {reminder.note}
                </Text>
              )}
            </>
          ) : (
            <Text className="text-sm text-[#777777]">
              Set a payment reminder
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color="#AAAAAA" />
      </Pressable>

      {/* Actions */}
      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={onToggle}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-3 ${
            expanded ? "bg-[#F0F0F0]" : "bg-green-600"
          }`}
        >
          <Ionicons
            name={expanded ? "chevron-up" : "cash-outline"}
            size={18}
            color={expanded ? "#555555" : "#FFFFFF"}
          />
          <Text
            className={`ml-2 font-semibold ${expanded ? "text-[#555555]" : "text-white"}`}
          >
            {expanded ? "Close" : "Receive payment"}
          </Text>
        </Pressable>

        {!!sale.phoneNumber && (
          <Pressable
            onPress={call}
            className="h-12 w-12 items-center justify-center rounded-xl border border-[#DDDDDD]"
            accessibilityLabel="Call customer"
          >
            <Ionicons name="call-outline" size={20} color="#2563EB" />
          </Pressable>
        )}
      </View>

      {/* Payment panel */}
      {expanded && (
        <View className="mt-3 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-3">
          <Text className="mb-1.5 text-sm font-medium text-[#555555]">
            Amount received
          </Text>
          <View className="flex-row items-center rounded-xl border border-[#DDDDDD] bg-white px-3">
            <Text className="text-base text-[#777777]">৳</Text>
            <TextInput
              value={amountText}
              onChangeText={(t) => {
                if (t === "" || /^\d*\.?\d*$/.test(t)) setAmountText(t);
              }}
              keyboardType="decimal-pad"
              placeholder={`Max ${formatCurrency(due)}`}
              placeholderTextColor="#AAAAAA"
              editable={!paying}
              className="ml-2 flex-1 py-3 text-[15px] text-[#252525]"
            />
          </View>

          {amountText !== "" && amount > due + 0.001 && (
            <Text className="mt-1 text-xs text-red-500">
              Cannot exceed the due amount (৳{formatCurrency(due)})
            </Text>
          )}

          <View className="mt-2 flex-row gap-2">
            <Pressable
              onPress={() =>
                setAmountText(String(Math.round((due / 2) * 100) / 100))
              }
              className="rounded-full border border-[#DDDDDD] bg-white px-3 py-1.5"
            >
              <Text className="text-xs text-[#555555]">Half</Text>
            </Pressable>
            <Pressable
              onPress={() => setAmountText(String(due))}
              className="rounded-full border border-[#DDDDDD] bg-white px-3 py-1.5"
            >
              <Text className="text-xs text-[#555555]">Full due</Text>
            </Pressable>
          </View>

          <Pressable
            disabled={!amountValid || paying}
            onPress={() => void submit(amount)}
            className={`mt-3 items-center rounded-xl bg-[#D52C3A] py-3 ${
              !amountValid || paying ? "opacity-50" : ""
            }`}
          >
            {paying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="font-semibold text-white">
                Add payment{amountValid ? ` ৳${formatCurrency(amount)}` : ""}
              </Text>
            )}
          </Pressable>

          <Pressable
            disabled={paying}
            onPress={confirmFull}
            className="mt-2 items-center rounded-xl border border-blue-200 bg-blue-50 py-3"
          >
            <Text className="text-sm font-medium text-blue-700">
              Receive full due (৳{formatCurrency(due)})
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
