import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RED = "#D52C3A";

export default function ScanScreen() {
  const router = useRouter();

  function handleStartScan() {
    Alert.alert(
      "QR Scanner",
      "The camera scanner will be integrated in the next step.",
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerClassName="flex-grow px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm font-medium text-[#D52C3A]">
          PRODUCT VERIFICATION
        </Text>
        <Text className="mt-2 text-3xl font-bold text-[#252525]">
          Scan Product
        </Text>
        <Text className="mt-2 text-base leading-6 text-[#777777]">
          Scan a product's unique QR code to retrieve its details and verify its
          authenticity.
        </Text>

        <View className="mt-8 items-center rounded-3xl border border-[#EAEAEA] bg-white px-5 py-8">
          <View className="h-48 w-48 items-center justify-center rounded-3xl border-2 border-dashed border-[#D52C3A]/40 bg-[#D52C3A]/5">
            <Ionicons name="scan-outline" size={100} color={RED} />
          </View>

          <Text className="mt-6 text-xl font-bold text-[#252525]">
            Ready to scan?
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-[#777777]">
            Position the product QR code inside the camera frame to identify the
            product.
          </Text>

          <Pressable
            onPress={handleStartScan}
            className="mt-6 h-14 w-full flex-row items-center justify-center rounded-xl bg-[#D52C3A] active:opacity-80"
          >
            <Ionicons name="camera-outline" size={22} color="white" />
            <Text className="ml-2 text-base font-semibold text-white">
              Open Scanner
            </Text>
          </Pressable>
        </View>

        <Text className="mb-3 mt-7 text-lg font-bold text-[#252525]">
          What you can do
        </Text>

        <View className="gap-3">
          <View className="flex-row items-center rounded-2xl border border-[#EAEAEA] bg-white p-4">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#D52C3A]/10">
              <Ionicons name="shield-checkmark-outline" size={23} color={RED} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-[#252525]">
                Verify Authenticity
              </Text>
              <Text className="mt-1 text-sm text-[#777777]">
                Check whether a product's QR identifier is registered.
              </Text>
            </View>
          </View>

          <View className="flex-row items-center rounded-2xl border border-[#EAEAEA] bg-white p-4">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#D52C3A]/10">
              <Ionicons name="cube-outline" size={23} color={RED} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-[#252525]">
                View Product Details
              </Text>
              <Text className="mt-1 text-sm text-[#777777]">
                Retrieve product information from your database.
              </Text>
            </View>
          </View>

          <View className="flex-row items-center rounded-2xl border border-[#EAEAEA] bg-white p-4">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-[#D52C3A]/10">
              <Ionicons name="time-outline" size={23} color={RED} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-[#252525]">Scan History</Text>
              <Text className="mt-1 text-sm text-[#777777]">
                Add a history of previous scans in a future update.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
