import { StoreProductService } from "@/services/post.service";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Change this path to your actual service file.


const RED = "#D52C3A";
const GREEN = "#16804A";

type ProductRecord = Record<string, unknown> & {
  id?: string;
  name?: string;
};

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function formatLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(formatValue).join(", ");
  }

  if (typeof value === "object") {
    // Handle Firestore Timestamp values if present.
    const timestamp = value as { toDate?: () => Date };

    if (typeof timestamp.toDate === "function") {
      try {
        return timestamp.toDate().toLocaleString();
      } catch {
        // Fall back to JSON below.
      }
    }

    try {
      return JSON.stringify(value, null, 2) ?? "—";
    } catch {
      return "[Unable to display this value]";
    }
  }

  return String(value);
}

export default function ResultScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    pid?: string | string[];
    name?: string | string[];
    sn?: string | string[];
  }>();

  const pid = getParam(params.pid);
  const scannedName = getParam(params.name);
  const serialNumber = getParam(params.sn);

  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadProduct() {
      setLoading(true);
      setError(null);
      setProduct(null);

      if (!pid) {
        setError(
          "The scanned QR code does not contain a product ID. Please scan a valid product QR code.",
        );
        setLoading(false);
        return;
      }

      try {
        // pid is selectedProduct.id from the QR code.
        const result = await StoreProductService.getStoreProduct(pid);

        if (!isActive) return;

        if (!result) {
          setError(
            `No product was found in the database for product ID: ${pid}`,
          );
          console.log(`No product was found in the database for product ID: ${pid}`);
          return;
        }

        setProduct(result as unknown as ProductRecord);
      } catch (err) {
        if (!isActive) return;

        setError(
          err instanceof Error
            ? `Unable to load product: ${err.message}`
            : "An unexpected error occurred while fetching the product.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadProduct();

    return () => {
      isActive = false;
    };
  }, [pid]);

  const registeredName = typeof product?.name === "string" ? product.name : "";

  const nameMismatch =
    Boolean(scannedName && registeredName) &&
    scannedName.trim() !== registeredName.trim();

  const productFields = product
    ? Object.entries(product).filter(
        ([key, value]) => key !== "id" && value !== undefined,
      )
    : [];

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      <StatusBar style="dark" />

      <View className="flex-row items-center border-b border-[#EAEAEA] bg-white px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5]"
          accessibilityLabel="Go back to scanner"
        >
          <Ionicons name="arrow-back" size={22} color="#252525" />
        </Pressable>

        <View className="flex-1">
          <Text className="text-lg font-bold text-[#252525]">
            Product Details
          </Text>
          <Text className="mt-0.5 text-xs text-[#777777]">QR scan result</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color={RED} />
          <Text className="mt-4 text-base font-semibold text-[#252525]">
            Loading product...
          </Text>
          <Text className="mt-2 text-center text-sm text-[#777777]">
            Fetching product information from the database.
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center px-5">
          <View className="items-center rounded-3xl border border-red-100 bg-white px-5 py-8">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <Ionicons name="alert-circle-outline" size={38} color={RED} />
            </View>

            <Text className="mt-4 text-xl font-bold text-[#252525]">
              Unable to Find Product
            </Text>

            <Text className="mt-3 text-center text-sm leading-6 text-[#777777]">
              {error}
            </Text>

            <Pressable
              onPress={() => router.back()}
              className="mt-6 h-12 w-full flex-row items-center justify-center rounded-xl bg-[#D52C3A] active:opacity-80"
            >
              <Ionicons name="scan-outline" size={20} color="white" />
              <Text className="ml-2 font-semibold text-white">
                Back to Scanner
              </Text>
            </Pressable>
          </View>
        </View>
      ) : product ? (
        <ScrollView
          contentContainerClassName="px-5 pb-8 pt-5"
          showsVerticalScrollIndicator={false}
        >
          {/* Product lookup status */}
          <View className="rounded-2xl border border-green-200 bg-white p-4">
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <Ionicons name="checkmark-circle" size={30} color={GREEN} />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-[#252525]">
                  Product Record Found
                </Text>
                <Text className="mt-1 text-sm text-[#16804A]">
                  Product ID matched a database record.
                </Text>
              </View>
            </View>
          </View>

          {/* Warn if the QR's name differs from the saved name */}
          {nameMismatch && (
            <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <View className="flex-row items-start">
                <Ionicons name="warning-outline" size={23} color="#B45309" />
                <View className="ml-3 flex-1">
                  <Text className="font-bold text-amber-800">
                    Product Name Mismatch
                  </Text>
                  <Text className="mt-2 text-sm leading-5 text-amber-800">
                    QR name: {scannedName}
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-amber-800">
                    Database name: {registeredName}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Scanned QR values */}
          <Text className="mb-3 mt-6 text-lg font-bold text-[#252525]">
            Scanned QR Information
          </Text>

          <View className="rounded-2xl border border-[#EAEAEA] bg-white p-4">
            <View className="border-b border-[#EEEEEE] pb-3">
              <Text className="text-xs font-medium uppercase tracking-wider text-[#888888]">
                Product ID
              </Text>
              <Text
                selectable
                className="mt-1 text-base font-semibold text-[#252525]"
              >
                {pid}
              </Text>
            </View>

            <View className="border-b border-[#EEEEEE] py-3">
              <Text className="text-xs font-medium uppercase tracking-wider text-[#888888]">
                QR Product Name
              </Text>
              <Text className="mt-1 text-base font-semibold text-[#252525]">
                {scannedName || "Not provided"}
              </Text>
            </View>

            <View className="pt-3">
              <Text className="text-xs font-medium uppercase tracking-wider text-[#888888]">
                Unit Serial Number
              </Text>
              <Text
                selectable
                className="mt-1 text-base font-semibold text-[#252525]"
              >
                {serialNumber || "Not provided in QR code"}
              </Text>
            </View>
          </View>

          {/* All fields returned from Firestore */}
          <View className="mb-3 mt-7 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-[#252525]">
              Registered Product Information
            </Text>
            <View className="rounded-full bg-[#D52C3A]/10 px-3 py-1">
              <Text className="text-xs font-semibold text-[#D52C3A]">
                {productFields.length} fields
              </Text>
            </View>
          </View>

          <View className="overflow-hidden rounded-2xl border border-[#EAEAEA] bg-white px-4">
            {productFields.length === 0 ? (
              <Text className="py-5 text-sm text-[#777777]">
                No additional product fields were found.
              </Text>
            ) : (
              productFields.map(([key, value], index) => (
                <View
                  key={key}
                  className={`py-4 ${
                    index < productFields.length - 1
                      ? "border-b border-[#EEEEEE]"
                      : ""
                  }`}
                >
                  <Text className="text-xs font-medium uppercase tracking-wider text-[#888888]">
                    {formatLabel(key)}
                  </Text>

                  <Text
                    selectable
                    className="mt-1 text-sm leading-6 text-[#252525]"
                  >
                    {formatValue(value)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <Pressable
            onPress={() => router.back()}
            className="mt-6 h-14 flex-row items-center justify-center rounded-xl bg-[#D52C3A] active:opacity-80"
          >
            <Ionicons name="scan-outline" size={22} color="white" />
            <Text className="ml-2 text-base font-semibold text-white">
              Scan Another Product
            </Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
