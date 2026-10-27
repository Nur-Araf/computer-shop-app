import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import type { InvoiceData } from "../../config/types/invoice";
import { formatCurrency } from "../../utils/format";
import { buildInvoiceHTML } from "../../utils/invoiceService";

type Props = {
  sale: InvoiceData | null;
  onNewSale: () => void;
};

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-sm text-[#555555]">{label}</Text>
      <Text className="ml-4 flex-1 text-right text-sm font-semibold text-[#252525]">
        {value}
      </Text>
    </View>
  );
}

export default function SaleSuccessModal({ sale, onNewSale }: Props) {
  const [busy, setBusy] = useState<"print" | "share" | null>(null);

  if (!sale) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = sale as any;
  const paid = s.paidAmount ?? sale.total;
  const due = s.dueAmount ?? 0;

  const print = async () => {
    try {
      setBusy("print");
      await Print.printAsync({ html: buildInvoiceHTML(sale) });
    } catch (e) {
      console.error("Print failed:", e);
      Alert.alert("Print failed", "Could not open the invoice for printing.");
    } finally {
      setBusy(null);
    }
  };

  const sharePdf = async () => {
    try {
      setBusy("share");
      const { uri } = await Print.printToFileAsync({
        html: buildInvoiceHTML(sale),
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
          dialogTitle: `Invoice ${sale.orderId}`,
        });
      } else {
        Alert.alert(
          "Sharing unavailable",
          "Sharing is not supported on this device.",
        );
      }
    } catch (e) {
      console.error("Share failed:", e);
      Alert.alert("Share failed", "Could not create the invoice PDF.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onNewSale}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[90%] rounded-t-3xl bg-white">
          <ScrollView contentContainerClassName="p-5 pb-8">
            <View className="items-center">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <Ionicons name="checkmark" size={30} color="#16A34A" />
              </View>
              <Text className="mt-3 text-xl font-bold text-green-600">
                Sale Completed Successfully!
              </Text>
            </View>

            <View className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
              <Text className="mb-2 font-semibold text-green-800">
                Sale Summary
              </Text>
              <Line label="Order ID" value={sale.orderId} />
              <Line label="Customer" value={sale.customerName} />
              <Line label="Phone" value={sale.phoneNumber} />
              <Line
                label="Total Amount"
                value={`${formatCurrency(sale.total)} BDT`}
              />
              <Line label="Paid Amount" value={`${formatCurrency(paid)} BDT`} />
              <Line label="Due Amount" value={`${formatCurrency(due)} BDT`} />
              <Line label="Payment Method" value={sale.paymentType} />
              <Line label="Date" value={new Date(sale.date).toLocaleString()} />

              {due > 0 && (
                <View className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-2">
                  <Text className="text-sm text-yellow-800">
                    <Text className="font-bold">Partial Payment. </Text>
                    {formatCurrency(due)} BDT will be collected later.
                  </Text>
                </View>
              )}
            </View>

            {/* <Pressable
              onPress={print}
              disabled={!!busy}
              className={`mt-5 flex-row items-center justify-center rounded-xl bg-green-600 py-3.5 ${
                busy ? "opacity-60" : ""
              }`}
            >
              {busy === "print" ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="print-outline" size={18} color="#FFFFFF" />
                  <Text className="ml-2 font-semibold text-white">
                    Print Invoice
                  </Text>
                </>
              )}
            </Pressable> */}

            {/* <Pressable
              onPress={sharePdf}
              disabled={!!busy}
              className={`mt-3 flex-row items-center justify-center rounded-xl border border-green-600 py-3.5 ${
                busy ? "opacity-60" : ""
              }`}
            >
              {busy === "share" ? (
                <ActivityIndicator color="#16A34A" />
              ) : (
                <>
                  <Ionicons name="share-outline" size={18} color="#16A34A" />
                  <Text className="ml-2 font-semibold text-green-600">
                    Share PDF
                  </Text>
                </>
              )}
            </Pressable> */}

            <Pressable
              onPress={onNewSale}
              className="mt-3 items-center rounded-xl bg-[#252525] py-3.5"
            >
              <Text className="font-semibold text-white">New Sale</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
