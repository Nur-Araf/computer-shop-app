import { Ionicons } from "@expo/vector-icons";
import { Switch, Text, TextInput, View } from "react-native";

import { formatCurrency } from "../../utils/format";

type Props = {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  serviceCharge: number;
  total: number;
  withDue: boolean;
  onToggleDue: (value: boolean) => void;
  dueAmount: number;
  onDueChange: (value: number) => void;
};

function Row({
  label,
  value,
  valueClass = "text-[#252525]",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-sm text-[#555555]">{label}</Text>
      <Text className={`text-sm font-semibold ${valueClass}`}>{value}</Text>
    </View>
  );
}

export default function FinalSummary({
  subtotal,
  discountPercent,
  discountAmount,
  serviceCharge,
  total,
  withDue,
  onToggleDue,
  dueAmount,
  onDueChange,
}: Props) {
  const paidNow = withDue ? total - dueAmount : total;
  const actualDue = withDue ? dueAmount : 0;

  return (
    <View className="gap-4">
      {/* Due payment */}
      <View className="rounded-2xl border border-[#EAEAEA] bg-white p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center pr-3">
            <Ionicons name="card-outline" size={20} color="#555555" />
            <Text className="ml-2 text-sm font-medium text-[#252525]">
              Partial Payment / Due
            </Text>
          </View>
          <Switch
            value={withDue}
            onValueChange={onToggleDue}
            trackColor={{ true: "#D52C3A" }}
          />
        </View>

        {withDue && (
          <View className="mt-3">
            <Text className="mb-1.5 text-sm text-[#555555]">
              Due amount (BDT)
            </Text>
            <TextInput
              value={dueAmount === 0 ? "" : String(dueAmount)}
              keyboardType="decimal-pad"
              placeholder="Enter due amount"
              placeholderTextColor="#999999"
              onChangeText={(t) => {
                if (t === "") return onDueChange(0);
                if (!/^\d*\.?\d*$/.test(t)) return;
                const n = parseFloat(t);
                if (Number.isFinite(n))
                  onDueChange(Math.max(0, Math.min(n, total)));
              }}
              className="rounded-xl border border-[#DDDDDD] bg-white px-4 py-3 text-[15px] text-[#252525]"
            />
            <View className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <Row
                label="Final Amount"
                value={`${formatCurrency(total)} BDT`}
              />
              <Row
                label="Paid Now"
                value={`${formatCurrency(paidNow)} BDT`}
                valueClass="text-green-600"
              />
              <Row
                label="Due"
                value={`${formatCurrency(actualDue)} BDT`}
                valueClass="text-red-600"
              />
            </View>
          </View>
        )}
      </View>

      {/* Breakdown */}
      <View className="rounded-2xl border-2 border-red-300 bg-red-50 p-4">
        <Row label="Product Total" value={`${formatCurrency(subtotal)} BDT`} />
        {serviceCharge > 0 && (
          <Row
            label="Service Charge"
            value={`+${formatCurrency(serviceCharge)} BDT`}
            valueClass="text-green-700"
          />
        )}
        {discountPercent > 0 && (
          <Row
            label={`Discount (${discountPercent}%)`}
            value={`−${formatCurrency(discountAmount)} BDT`}
            valueClass="text-red-600"
          />
        )}
        <View className="mt-2 flex-row items-center justify-between border-t border-red-300 pt-3">
          <Text className="text-sm font-bold uppercase tracking-wider text-red-800">
            {withDue ? "Total Amount" : "Amount Due"}
          </Text>
          <Text className="text-2xl font-bold text-red-800">
            {formatCurrency(total)} BDT
          </Text>
        </View>
      </View>
    </View>
  );
}
