import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import type { Customer } from "../../config/types/saleTypes";
import { digitsOnly } from "@/utils/phone";

export const PAYMENT_TYPES = [
  "Cash",
  "Card",
  "Mobile Banking",
  "Bank Transfer",
];

type Props = {
  name: string;
  phone: string;
  paymentType: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onPaymentChange: (v: string) => void;
  customers: Customer[];
  onSelectCustomer: (c: Customer) => void;
  showErrors: boolean;
};

export default function CustomerInputs({
  name,
  phone,
  paymentType,
  onNameChange,
  onPhoneChange,
  onPaymentChange,
  customers,
  onSelectCustomer,
  showErrors,
}: Props) {
  const [active, setActive] = useState<"name" | "phone" | null>(null);

  const customersWithDigits = useMemo(
    () => customers.map((c) => ({ ...c, digits: digitsOnly(c.phone) })),
    [customers],
  );

  const suggestions = useMemo(() => {
    if (!active) return [];

    const phoneQuery = digitsOnly(phone.trim());
    const nameQuery = name.trim().toLowerCase();

    let found: Customer[] = [];

    if (active === "phone" && phoneQuery) {
      found = customersWithDigits.filter((c) => c.digits.includes(phoneQuery));
      if (found.length === 0 && phoneQuery.length >= 3) {
        const tail = phoneQuery.slice(-7);
        found = customersWithDigits.filter((c) => c.digits.endsWith(tail));
      }
    } else if (active === "name" && nameQuery.length >= 2) {
      found = customers.filter((c) => c.name.toLowerCase().includes(nameQuery));
    }

    return found.slice(0, 5);
  }, [active, phone, name, customers, customersWithDigits]);

  const select = (c: Customer) => {
    onSelectCustomer(c);
    setActive(null);
  };

  const Suggestions = () =>
    suggestions.length > 0 ? (
      <View className="mt-1 overflow-hidden rounded-xl border border-[#EAEAEA] bg-white">
        {suggestions.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => select(c)}
            className="flex-row items-center border-b border-[#F0F0F0] px-3 py-2.5 active:bg-[#F5F5F5]"
          >
            <Ionicons name="person-circle-outline" size={22} color="#2563EB" />
            <View className="ml-2">
              <Text className="text-sm font-medium text-[#252525]">
                {c.name}
              </Text>
              <Text className="text-xs text-[#777777]">{c.phone}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    ) : null;

  const nameError = showErrors && !name.trim();
  const phoneError = showErrors && digitsOnly(phone).length < 7;
  const paymentError = showErrors && !paymentType;

  return (
    <View className="gap-4">
      {/* Name */}
      <View>
        <Text className="mb-1.5 text-sm font-medium text-[#555555]">
          Customer Name *
        </Text>
        <TextInput
          value={name}
          onChangeText={onNameChange}
          onFocus={() => setActive("name")}
          onBlur={() =>
            setTimeout(() => setActive((a) => (a === "name" ? null : a)), 200)
          }
          placeholder="Enter customer name"
          placeholderTextColor="#999999"
          className={`rounded-xl border bg-white px-4 py-3 text-[15px] text-[#252525] ${
            nameError ? "border-red-500" : "border-[#DDDDDD]"
          }`}
        />
        {nameError && (
          <Text className="mt-1 text-xs text-red-500">
            Customer name is required
          </Text>
        )}
        {active === "name" && <Suggestions />}
      </View>

      {/* Phone */}
      <View>
        <Text className="mb-1.5 text-sm font-medium text-[#555555]">
          Phone Number *
        </Text>
        <TextInput
          value={phone}
          onChangeText={onPhoneChange}
          onFocus={() => setActive("phone")}
          onBlur={() =>
            setTimeout(() => setActive((a) => (a === "phone" ? null : a)), 200)
          }
          keyboardType="phone-pad"
          placeholder="Enter phone number"
          placeholderTextColor="#999999"
          className={`rounded-xl border bg-white px-4 py-3 text-[15px] text-[#252525] ${
            phoneError ? "border-red-500" : "border-[#DDDDDD]"
          }`}
        />
        {phoneError && (
          <Text className="mt-1 text-xs text-red-500">
            Enter a valid phone number
          </Text>
        )}
        {active === "phone" && <Suggestions />}
      </View>

      {/* Payment type */}
      <View>
        <Text className="mb-1.5 text-sm font-medium text-[#555555]">
          Payment Type *
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {PAYMENT_TYPES.map((t) => {
            const on = paymentType === t;
            return (
              <Pressable
                key={t}
                onPress={() => onPaymentChange(t)}
                className={`rounded-full border px-4 py-2.5 ${
                  on
                    ? "border-[#D52C3A] bg-[#D52C3A]"
                    : "border-[#DDDDDD] bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${on ? "text-white" : "text-[#555555]"}`}
                >
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {paymentError && (
          <Text className="mt-1 text-xs text-red-500">
            Payment type is required
          </Text>
        )}
      </View>
    </View>
  );
}
