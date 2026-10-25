// src/app/(tabs)/index.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getAuth, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadRole() {
      const savedRole = await AsyncStorage.getItem("role");
      setRole(savedRole);
    }

    loadRole();
  }, []);
  console.log(role);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      // Sign out of Firebase (safe even if not signed in)
      try {
        await signOut(getAuth());
      } catch {
        // ignore — proceed to clear local state anyway
      }

      // Clear all local storage (role, cached user, etc.)
      await AsyncStorage.clear();

      // Navigate back to login and reset the stack
      console.log("HOME SCREEN REDIRECT FIRED: /");
      router.replace("/");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <StatusBar style="dark" />

      <ScrollView contentContainerClassName="flex-grow px-6 py-10">
        <View className="rounded-3xl border border-[#e8e8e8] bg-white p-8 shadow-sm">
          {/* Brand accent */}
          <View className="mb-6 h-1.5 w-12 rounded-full bg-[#D52C3A]" />

          <Text className="text-sm font-semibold uppercase tracking-wider text-[#D52C3A]">
            Welcome
          </Text>

          <Text className="mt-3 text-3xl font-bold text-[#252525]">
            Hello there 👋
          </Text>

          <Text className="mt-3 text-base leading-6 text-[#8a8a8a]">
            Glad to see you back. You're all set — pick up where you left off
            and get things done.
          </Text>

          {/* Continue button */}
          <Pressable className="mt-8 h-[52px] items-center justify-center rounded-xl bg-[#D52C3A] active:bg-[#b0222f]">
            <Text className="text-[17px] font-semibold text-white">
              Continue
            </Text>
          </Pressable>

          {/* Logout button */}
          <Pressable
            onPress={handleLogout}
            disabled={loggingOut}
            className={`mt-3 h-[52px] flex-row items-center justify-center rounded-xl border border-[#D52C3A]/30 ${
              loggingOut ? "bg-[#D52C3A]/10" : "bg-white active:bg-[#D52C3A]/10"
            }`}
          >
            {loggingOut ? (
              <ActivityIndicator color="#D52C3A" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#D52C3A" />
                <Text className="ml-2 text-[16px] font-semibold text-[#D52C3A]">
                  Log out
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
