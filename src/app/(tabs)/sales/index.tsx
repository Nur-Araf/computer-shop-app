import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RED = "#D52C3A";

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-[#EAEAEA] bg-white p-4">
      <View className="mb-3 h-10 w-10 items-center justify-center rounded-xl bg-[#D52C3A]/10">
        <Ionicons name={icon} size={21} color={RED} />
      </View>
      <Text className="text-sm text-[#777777]">{title}</Text>
      <Text className="mt-1 text-xl font-bold text-[#252525]">{value}</Text>
    </View>
  );
}

export default function SalesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <Text className="text-sm font-medium text-[#D52C3A]">
            BUSINESS MANAGEMENT
          </Text>
          <Text className="mt-2 text-3xl font-bold text-[#252525]">Sales</Text>
          <Text className="mt-2 text-base text-[#777777]">
            Manage transactions and track your sales.
          </Text>
        </View>

        <View className="mb-4 flex-row gap-3">
          <SummaryCard
            title="Today's Sales"
            value="৳0.00"
            icon="cash-outline"
          />
          <SummaryCard title="Orders" value="0" icon="receipt-outline" />
        </View>

        <View className="mb-6 flex-row gap-3">
          <SummaryCard title="Pending" value="0" icon="time-outline" />
          <SummaryCard
            title="Completed"
            value="0"
            icon="checkmark-circle-outline"
          />
        </View>

        <Text className="mb-3 text-lg font-bold text-[#252525]">
          Quick Actions
        </Text>

        <Pressable
          onPress={() =>
            Alert.alert(
              "Create Sale",
              "The sales creation screen will be connected next.",
            )
          }
          className="mb-3 flex-row items-center rounded-2xl bg-[#D52C3A] p-4 active:opacity-80"
        >
          <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <Ionicons name="add-circle-outline" size={27} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-white">
              Create New Sale
            </Text>
            <Text className="mt-1 text-sm text-white/80">
              Start a new customer transaction
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color="white" />
        </Pressable>

        <Pressable
          onPress={() =>
            Alert.alert("Sales History", "Sales history will be added next.")
          }
          className="flex-row items-center rounded-2xl border border-[#EAEAEA] bg-white p-4 active:bg-[#FAFAFA]"
        >
          <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-[#F5F5F5]">
            <Ionicons name="document-text-outline" size={25} color={RED} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-[#252525]">
              Sales History
            </Text>
            <Text className="mt-1 text-sm text-[#777777]">
              View previous transactions
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color="#888888" />
        </Pressable>

        <View className="mt-6 rounded-2xl border border-dashed border-[#D8D8D8] bg-white p-6">
          <Ionicons
            name="receipt-outline"
            size={32}
            color="#999999"
            style={{ alignSelf: "center" }}
          />
          <Text className="mt-3 text-center font-semibold text-[#252525]">
            No sales to display yet
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-[#777777]">
            Once sales are connected to your database, your transactions and
            sales summaries will appear here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
