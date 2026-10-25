// src/app/(tabs)/more.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "@/lib/firebase";

const RED = "#D52C3A";

type MenuItemProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function MenuItem({ title, description, icon, onPress }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl border border-[#EAEAEA] bg-white p-4 active:bg-[#FAFAFA]"
    >
      <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-[#D52C3A]/10">
        <Ionicons name={icon} size={24} color={RED} />
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-[#252525]">{title}</Text>
        <Text className="mt-1 text-sm text-[#777777]">{description}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#999999" />
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUserInfo() {
      try {
        const values = await AsyncStorage.multiGet(["role", "userName"]);

        if (active) {
          setRole(values[0][1]);
          setUserName(values[1][1]);
        }
      } catch (error) {
        console.error("Failed to load user information:", error);
      }
    }

    loadUserInfo();

    return () => {
      active = false;
    };
  }, []);

  function showComingSoon(feature: string) {
    Alert.alert(
      feature,
      `${feature} screen will be connected in a future update.`,
    );
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await signOut(auth);

      await AsyncStorage.multiRemove([
        "role",
        "userId",
        "userName",
        "userEmail",
        "firestoreUserId",
      ]);

      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);

      Alert.alert("Logout Failed", "Unable to sign out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm font-medium text-[#D52C3A]">WORKSPACE</Text>
        <Text className="mt-2 text-3xl font-bold text-[#252525]">More</Text>
        <Text className="mt-2 text-base text-[#777777]">
          Manage products, tools, and your account.
        </Text>

        <View className="mt-6 flex-row items-center rounded-2xl bg-[#D52C3A] p-5">
          <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <Ionicons name="person-outline" size={28} color="white" />
          </View>

          <View className="flex-1">
            <Text className="text-lg font-bold text-white">
              {userName || "Your Account"}
            </Text>
            <Text className="mt-1 text-sm capitalize text-white/80">
              {role || "User"}
            </Text>
          </View>

          <Ionicons name="shield-checkmark-outline" size={24} color="white" />
        </View>

        <Text className="mb-3 mt-7 text-lg font-bold text-[#252525]">
          Product Management
        </Text>

        <MenuItem
          title="Products"
          description="Browse and manage your products"
          icon="cube-outline"
          onPress={() => showComingSoon("Products")}
        />

        <MenuItem
          title="QR Code Management"
          description="Generate and manage product QR codes"
          icon="qr-code-outline"
          onPress={() => router.push("/create/qr-create")}
        />

        <MenuItem
          title="Inventory"
          description="Manage stock and product quantities"
          icon="file-tray-stacked-outline"
          onPress={() => showComingSoon("Inventory")}
        />

        <Text className="mb-3 mt-5 text-lg font-bold text-[#252525]">
          Business
        </Text>

        <MenuItem
          title="Reports"
          description="View sales and business reports"
          icon="bar-chart-outline"
          onPress={() => showComingSoon("Reports")}
        />

        <MenuItem
          title="Settings"
          description="Manage application preferences"
          icon="settings-outline"
          onPress={() => showComingSoon("Settings")}
        />

        <Text className="mb-3 mt-5 text-lg font-bold text-[#252525]">
          Account
        </Text>

        <Pressable
          onPress={handleLogout}
          disabled={loggingOut}
          className="flex-row items-center justify-center rounded-2xl border border-[#D52C3A]/20 bg-white p-4 active:bg-[#D52C3A]/5"
        >
          {loggingOut ? (
            <ActivityIndicator color={RED} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={22} color={RED} />
              <Text className="ml-2 font-semibold text-[#D52C3A]">Log Out</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
