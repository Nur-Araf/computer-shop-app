import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { StoreProduct } from "@/config/types/saleTypes";
import OptionPicker from "./Optionpicker";

const RED = "#D52C3A";

type Sort = "none" | "low-high" | "high-low";
type PickerKey = "sort" | "category" | "seller" | "brand" | null;

type Props = {
  visible: boolean;
  onClose: () => void;
  products: StoreProduct[];
  categories: string[];
  /** productId -> quantity currently in the cart */
  cartQty: Record<string, number>;
  onAdd: (product: StoreProduct) => void;
};

const SORT_OPTIONS = [
  { label: "Default", value: "none" },
  { label: "Price: Low to High", value: "low-high" },
  { label: "Price: High to Low", value: "high-low" },
];

function FilterPill({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 flex-row items-center rounded-full border px-3 py-2 ${
        active
          ? "border-[#D52C3A] bg-[#D52C3A]/10"
          : "border-[#EAEAEA] bg-white"
      }`}
    >
      <Ionicons name={icon} size={14} color={active ? RED : "#777777"} />
      <Text
        className={`ml-1.5 text-xs font-medium capitalize ${
          active ? "text-[#D52C3A]" : "text-[#555555]"
        }`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProductPickerModal({
  visible,
  onClose,
  products,
  categories,
  cartQty,
  onAdd,
}: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("none");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [seller, setSeller] = useState("all");
  const [picker, setPicker] = useState<PickerKey>(null);

  const brands = useMemo(
    () => [
      "all",
      ...Array.from(new Set(products.map((p) => p.brand).filter(Boolean))),
    ],
    [products],
  );

  const sellers = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(products.flatMap((p) => p.wholesellers || []).filter(Boolean)),
      ),
    ],
    [products],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.model?.toLowerCase().includes(q);

      const matchesCategory =
        category === "all" ||
        p.category?.toLowerCase() === category.toLowerCase();

      const matchesBrand =
        brand === "all" || p.brand?.toLowerCase() === brand.toLowerCase();

      // FIX: web code compared a string field, but options come from the array `wholesellers`
      const matchesSeller =
        seller === "all" ||
        (p.wholesellers || []).some(
          (w: string) => w.toLowerCase() === seller.toLowerCase(),
        );

      return matchesSearch && matchesCategory && matchesBrand && matchesSeller;
    });

    if (sort === "low-high")
      result = [...result].sort((a, b) => a.sellPrice - b.sellPrice);
    if (sort === "high-low")
      result = [...result].sort((a, b) => b.sellPrice - a.sellPrice);

    return result;
  }, [products, search, sort, category, brand, seller]);

  const hasFilters =
    sort !== "none" ||
    category !== "all" ||
    brand !== "all" ||
    seller !== "all";

  const clearFilters = () => {
    setSort("none");
    setCategory("all");
    setBrand("all");
    setSeller("all");
  };

  const toOptions = (list: string[], allLabel: string) =>
    list.map((v) => ({ value: v, label: v === "all" ? allLabel : v }));

  const cartCount = Object.values(cartQty).reduce((a, b) => a + b, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-[#F5F5F5]" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
          <Text className="text-xl font-bold text-[#252525]">Add Products</Text>
          <Pressable
            onPress={onClose}
            className="rounded-full bg-[#D52C3A] px-4 py-2"
          >
            <Text className="text-sm font-semibold text-white">
              Done{cartCount > 0 ? ` (${cartCount})` : ""}
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View className="mx-5 flex-row items-center rounded-xl border border-[#EAEAEA] bg-white px-3">
          <Ionicons name="search" size={18} color="#999999" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by product, brand, model..."
            placeholderTextColor="#999999"
            className="ml-2 flex-1 py-3 text-[15px] text-[#252525]"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color="#BBBBBB" />
            </Pressable>
          )}
        </View>

        {/* Filters */}
        <View className="mt-3 flex-row items-center">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            data={[0]}
            keyExtractor={() => "filters"}
            renderItem={() => (
              <View className="flex-row">
                <FilterPill
                  icon="swap-vertical"
                  label={
                    sort === "none"
                      ? "Sort"
                      : sort === "low-high"
                        ? "Price ↑"
                        : "Price ↓"
                  }
                  active={sort !== "none"}
                  onPress={() => setPicker("sort")}
                />
                <FilterPill
                  icon="pricetag-outline"
                  label={category === "all" ? "Category" : category}
                  active={category !== "all"}
                  onPress={() => setPicker("category")}
                />
                <FilterPill
                  icon="storefront-outline"
                  label={seller === "all" ? "Wholesaler" : seller}
                  active={seller !== "all"}
                  onPress={() => setPicker("seller")}
                />
                <FilterPill
                  icon="ribbon-outline"
                  label={brand === "all" ? "Brand" : brand}
                  active={brand !== "all"}
                  onPress={() => setPicker("brand")}
                />
                {hasFilters && (
                  <Pressable
                    onPress={clearFilters}
                    className="mr-2 flex-row items-center rounded-full border border-[#EAEAEA] bg-white px-3 py-2"
                  >
                    <Ionicons name="close" size={14} color="#777777" />
                    <Text className="ml-1 text-xs text-[#555555]">Clear</Text>
                  </Pressable>
                )}
              </View>
            )}
          />
        </View>

        {/* Product list */}
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-5 pb-8 pt-4"
          ItemSeparatorComponent={() => <View className="h-3" />}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="search-outline" size={36} color="#BBBBBB" />
              <Text className="mt-2 text-sm text-[#777777]">
                No products found
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const out = (item.stock ?? 0) <= 0;
            const inCart = cartQty[item.id] || 0;
            const maxed = inCart >= (item.stock ?? 0);

            return (
              <Pressable
                disabled={out || maxed}
                onPress={() => onAdd(item)}
                className={`flex-row items-center rounded-2xl border p-3 ${
                  out
                    ? "border-[#EAEAEA] bg-[#FAFAFA] opacity-60"
                    : inCart > 0
                      ? "border-[#D52C3A]/40 bg-[#D52C3A]/5"
                      : "border-[#EAEAEA] bg-white"
                }`}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    className="h-14 w-14 rounded-lg bg-[#F0F0F0]"
                  />
                ) : (
                  <View className="h-14 w-14 items-center justify-center rounded-lg bg-[#F0F0F0]">
                    <Ionicons name="cube-outline" size={22} color="#AAAAAA" />
                  </View>
                )}

                <View className="ml-3 flex-1">
                  <Text
                    className="text-[15px] font-semibold text-[#252525]"
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <View className="mt-1 flex-row items-center">
                    {!!item.model && (
                      <Text className="mr-2 rounded bg-[#EEEEEE] px-1.5 py-0.5 text-[11px] text-[#333333]">
                        {item.model}
                      </Text>
                    )}
                    <Text className="text-xs text-[#777777]">
                      In stock: {item.stock}
                    </Text>
                  </View>
                  <Text className="mt-1 text-sm font-bold text-green-600">
                    BDT {Number(item.sellPrice).toFixed(2)}
                  </Text>
                </View>

                {out ? (
                  <Text className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                    Out of stock
                  </Text>
                ) : inCart > 0 ? (
                  <View className="h-7 min-w-[28px] items-center justify-center rounded-full bg-[#D52C3A] px-2">
                    <Text className="text-xs font-bold text-white">
                      {inCart}
                    </Text>
                  </View>
                ) : (
                  <Ionicons name="add-circle" size={28} color={RED} />
                )}
              </Pressable>
            );
          }}
        />

        {/* Pickers (rendered inside this modal so they stack correctly on iOS) */}
        <OptionPicker
          visible={picker === "sort"}
          title="Sort by price"
          options={SORT_OPTIONS}
          selected={sort}
          onSelect={(v) => setSort(v as Sort)}
          onClose={() => setPicker(null)}
        />
        <OptionPicker
          visible={picker === "category"}
          title="Category"
          options={toOptions(categories, "All Categories")}
          selected={category}
          onSelect={setCategory}
          onClose={() => setPicker(null)}
        />
        <OptionPicker
          visible={picker === "seller"}
          title="Wholesaler"
          options={toOptions(sellers, "All Wholesalers")}
          selected={seller}
          onSelect={setSeller}
          onClose={() => setPicker(null)}
        />
        <OptionPicker
          visible={picker === "brand"}
          title="Brand"
          options={toOptions(brands, "All Brands")}
          selected={brand}
          onSelect={setBrand}
          onClose={() => setPicker(null)}
        />
      </SafeAreaView>
    </Modal>
  );
}
