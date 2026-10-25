// src/app/(tabs)/create/qr-create/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RED = "#D52C3A";

export default function QRManagementScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm font-medium text-[#D52C3A]">
          PRODUCT MANAGEMENT
        </Text>

        <Text className="mt-2 text-3xl font-bold text-[#252525]">QR Codes</Text>

        <Text className="mt-2 text-base leading-6 text-[#777777]">
          Generate, view, and manage unique QR codes for your products.
        </Text>

        <View className="mt-7 items-center rounded-3xl border border-[#EAEAEA] bg-white px-5 py-8">
          <View className="h-24 w-24 items-center justify-center rounded-3xl bg-[#D52C3A]/10">
            <Ionicons name="qr-code-outline" size={58} color={RED} />
          </View>

          <Text className="mt-5 text-xl font-bold text-[#252525]">
            QR Code Management
          </Text>

          <Text className="mt-2 text-center text-sm leading-5 text-[#777777]">
            Assign unique QR codes to products and make them easy to identify
            and verify.
          </Text>

          <Pressable
            onPress={() =>
              Alert.alert(
                "Generate QR Codes",
                "Product selection and QR generation will be added next.",
              )
            }
            className="mt-6 h-14 w-full flex-row items-center justify-center rounded-xl bg-[#D52C3A] active:opacity-80"
          >
            <Ionicons name="add-circle-outline" size={22} color="white" />
            <Text className="ml-2 text-base font-semibold text-white">
              Generate QR Codes
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              Alert.alert(
                "Generated QR Codes",
                "Your generated QR code list will appear here once connected.",
              )
            }
            className="mt-3 h-14 w-full flex-row items-center justify-center rounded-xl border border-[#D52C3A]/30 bg-white active:bg-[#D52C3A]/5"
          >
            <Ionicons name="grid-outline" size={21} color={RED} />
            <Text className="ml-2 text-base font-semibold text-[#D52C3A]">
              View Generated QR Codes
            </Text>
          </Pressable>
        </View>

        <Text className="mb-3 mt-7 text-lg font-bold text-[#252525]">
          How it works
        </Text>

        {[
          {
            icon: "cube-outline" as const,
            title: "Select Products",
            description: "Choose products from your existing database.",
          },
          {
            icon: "qr-code-outline" as const,
            title: "Generate Unique Codes",
            description: "Create a unique identifier for each product or unit.",
          },
          {
            icon: "print-outline" as const,
            title: "Print and Use",
            description: "Print QR labels and scan them with your mobile app.",
          },
        ].map((item, index) => (
          <View
            key={item.title}
            className="mb-3 flex-row items-center rounded-2xl border border-[#EAEAEA] bg-white p-4"
          >
            <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-[#D52C3A]/10">
              <Ionicons name={item.icon} size={24} color={RED} />
            </View>

            <View className="flex-1">
              <Text className="font-semibold text-[#252525]">
                {index + 1}. {item.title}
              </Text>
              <Text className="mt-1 text-sm leading-5 text-[#777777]">
                {item.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
