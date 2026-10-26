// src/app/(tabs)/create/qr-create/index.tsx
import { StoreProduct } from "@/config/types/types";
import { StoreProductService, TypeService } from "@/services/post.service";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
interface TypeData {
  categories: string[];
}

const RED = "#D52C3A";

type State = {
  products: StoreProduct[];
  categories: string[];
  loading: boolean;
  error: string | null;
};

export default function QRManagementScreen() {
  const [state, setState] = useState<State>({
    products: [],
    categories: ["all"],
    loading: true,
    error: null,
  });
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData(isRefresh = false) {
    if (!isRefresh) {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }
    try {
      const [products, types]: [StoreProduct[], TypeData[]] = await Promise.all(
        [StoreProductService.getStoreProducts(), TypeService.getTypes()],
      );

      const categories = types[0]?.categories
        ? ["all", ...types[0].categories]
        : ["all"];

      setState({ products, categories, loading: false, error: null });
    } catch (error) {
      console.error("Error fetching data:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load data. Please try again.",
      }));
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        (p as any).sku?.toLowerCase?.().includes(q) ||
        (p as any).model?.toLowerCase?.().includes(q);

      const matchesCategory =
        activeCategory === "all" || p.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [state.products, search, activeCategory]);

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={RED}
          />
        }
      >
        {/* Header */}
        <Text className="text-sm font-medium text-[#D52C3A]">
          PRODUCT MANAGEMENT
        </Text>
        <Text className="mt-2 text-3xl font-bold text-[#252525]">QR Codes</Text>
        <Text className="mt-2 text-base leading-6 text-[#777777]">
          Search your products and generate a unique QR code for each item.
        </Text>

        {/* Search */}
        <View className="mt-6 h-12 flex-row items-center rounded-xl border border-[#EAEAEA] bg-white px-3">
          <Ionicons name="search-outline" size={20} color="#777777" />
          <TextInput
            className="ml-2 flex-1 text-base text-[#252525]"
            placeholder="Search by name, SKU, or category..."
            placeholderTextColor="#999999"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color="#999999" />
            </Pressable>
          )}
        </View>

        {/* Category chips */}
        {state.categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="mt-4 gap-2 pr-2"
          >
            {state.categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  className={`rounded-full border px-4 py-2 ${
                    active
                      ? "border-[#D52C3A] bg-[#D52C3A]"
                      : "border-[#EAEAEA] bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium capitalize ${
                      active ? "text-white" : "text-[#252525]"
                    }`}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Loading */}
        {state.loading && (
          <View className="mt-10 items-center justify-center py-10">
            <ActivityIndicator size="large" color={RED} />
            <Text className="mt-3 text-sm text-[#777777]">
              Loading products...
            </Text>
          </View>
        )}

        {/* Error */}
        {!state.loading && state.error && (
          <View className="mt-6 items-center rounded-2xl border border-[#EAEAEA] bg-white p-6">
            <Ionicons name="alert-circle-outline" size={40} color={RED} />
            <Text className="mt-3 text-center text-base text-[#252525]">
              {state.error}
            </Text>
            <Pressable
              onPress={() => fetchData()}
              className="mt-4 rounded-xl bg-[#D52C3A] px-5 py-3 active:bg-[#b0222f]"
            >
              <Text className="font-semibold text-white">Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Empty */}
        {!state.loading && !state.error && filteredProducts.length === 0 && (
          <View className="mt-6 items-center rounded-2xl border border-[#EAEAEA] bg-white p-8">
            <Ionicons name="cube-outline" size={40} color="#999999" />
            <Text className="mt-3 text-center text-base font-medium text-[#252525]">
              No products found
            </Text>
            <Text className="mt-1 text-center text-sm text-[#777777]">
              {search
                ? "Try a different search term or category."
                : "Add products in your inventory to see them here."}
            </Text>
          </View>
        )}

        {/* Table */}
        {!state.loading && !state.error && filteredProducts.length > 0 && (
          <View className="mt-5">
            {/* Header row */}
            <View className="flex-row items-center rounded-t-2xl bg-[#252525] px-4 py-3">
              <Text className="flex-[2] text-xs font-semibold uppercase text-white">
                Product
              </Text>
              <Text className="flex-1 text-center text-xs font-semibold uppercase text-white">
                Category
              </Text>
              <Text className="w-16 text-center text-xs font-semibold uppercase text-white">
                QR
              </Text>
            </View>

            {/* Data rows */}
            <View className="overflow-hidden rounded-b-2xl border border-t-0 border-[#EAEAEA] bg-white">
              {filteredProducts.map((product, index) => {
                const sku =
                  (product as any).sku ?? (product as any).model ?? null;

                return (
                  <Pressable
                    key={product.id ?? String(index)}
                    onPress={() =>
                      Alert.alert(
                        "Generate QR",
                        `Create a QR code for "${product.name ?? "Unnamed"}"?`,
                      )
                    }
                    className={`flex-row items-center px-4 py-3.5 active:bg-[#D52C3A]/5 ${
                      index !== filteredProducts.length - 1
                        ? "border-b border-[#F0F0F0]"
                        : ""
                    }`}
                  >
                    <View className="flex-[2] pr-2">
                      <Text
                        className="text-sm font-semibold text-[#252525]"
                        numberOfLines={1}
                      >
                        {product.name ?? "Unnamed"}
                      </Text>
                      {sku ? (
                        <Text
                          className="mt-0.5 text-xs text-[#777777]"
                          numberOfLines={1}
                        >
                          {sku}
                        </Text>
                      ) : null}
                    </View>

                    <Text
                      className="flex-1 text-center text-xs capitalize text-[#777777]"
                      numberOfLines={1}
                    >
                      {product.category ?? "—"}
                    </Text>

                    <View className="w-16 items-center">
                      <View className="h-9 w-9 items-center justify-center rounded-lg bg-[#D52C3A]/10">
                        <Ionicons
                          name="qr-code-outline"
                          size={18}
                          color={RED}
                        />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Text className="mt-3 text-center text-xs text-[#999999]">
              Showing {filteredProducts.length} of {state.products.length}{" "}
              products
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
