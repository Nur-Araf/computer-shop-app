import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  customerName: string;
  totalAmount: number;
  saleDate: Date;
  withDue: boolean;
  dueAmount: number;
  loading?: boolean;
  formatCurrency: (n: number) => string;
  onCancel: () => void;
  onConfirm: () => void;
};

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function ConfirmSaleModal({
  visible,
  customerName,
  totalAmount,
  saleDate,
  withDue,
  dueAmount,
  loading,
  formatCurrency,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-5">
        <View className="w-full max-w-md overflow-hidden rounded-2xl bg-white">
          <View className="border-b border-[#EAEAEA] px-5 py-4">
            <Text className="text-xl font-bold text-[#252525]">
              Confirm Sale
            </Text>
            <Text className="mt-1 text-sm text-[#777777]">
              Please review the sale details carefully
            </Text>
          </View>

          <View className="gap-3 p-5">
            <View className="gap-2 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-4">
              <Text className="text-sm text-[#555555]">
                <Text className="font-semibold">Customer: </Text>
                {customerName}
              </Text>
              <Text className="text-sm text-[#555555]">
                <Text className="font-semibold">Total Amount: </Text>
                <Text className="font-bold text-green-600">
                  {formatCurrency(totalAmount)} BDT
                </Text>
              </Text>
              <View className="mt-1 flex-row items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <Ionicons name="calendar-outline" size={16} color="#2563EB" />
                <Text className="ml-2 text-sm font-medium text-blue-700">
                  Sale Date: {formatDate(saleDate)}
                </Text>
              </View>
            </View>

            {withDue && dueAmount > 0 && (
              <View className="flex-row items-start rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <Ionicons name="warning-outline" size={16} color="#CA8A04" />
                <Text className="ml-2 flex-1 text-sm text-yellow-800">
                  Partial payment detected.{"\n"}
                  <Text className="font-bold">Due: </Text>
                  {formatCurrency(dueAmount)} BDT
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row justify-end gap-3 border-t border-[#EAEAEA] bg-[#FAFAFA] px-5 py-4">
            <Pressable
              onPress={onCancel}
              disabled={loading}
              className="rounded-xl border border-[#DDDDDD] px-4 py-2.5"
            >
              <Text className="font-medium text-[#555555]">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              className={`min-w-[120px] items-center rounded-xl bg-green-600 px-4 py-2.5 ${
                loading ? "opacity-60" : ""
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-semibold text-white">Confirm Sale</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
