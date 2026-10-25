// src/components/auth/login.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthService } from "@/services/auth";
import { UserService } from "@/services/user";
import Toast from "react-native-toast-message";

const logo = require("@/assets/images/logo.png");

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (loading) return;

    try {
      setLoading(true);

      // 1. Authenticate with Firebase.
      const user = await AuthService.login(email, password);

      // 2. Retrieve the user record from Firestore.
      const firestoreUser = await UserService.getUserByEmail(
        user.email ?? email.trim(),
      );

      if (!firestoreUser) {
        await AuthService.logout();

        Toast.show({
          type: "error",
          text1: "User Not Found",
          text2: "Your account is not registered in this system.",
        });

        return;
      }

      // 3. Verify the user's role.
      if (firestoreUser.role !== "admin" && firestoreUser.role !== "staff") {
        await AuthService.logout();

        Toast.show({
          type: "error",
          text1: "Access Denied",
          text2: "You don't have permission to access this system.",
        });

        return;
      }

      // 4. Store user information locally.
      await AsyncStorage.multiSet([
        ["role", firestoreUser.role],
        ["userId", user.uid],
        ["userName", firestoreUser.name ?? ""],
        ["userEmail", user.email ?? email.trim()],
        ["firestoreUserId", firestoreUser.id],
      ]);

      // 5. Navigate to the dashboard.
      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: `Welcome, ${firestoreUser.name || user.email || "User"}!`,
      });

      router.replace("/(tabs)");
    } catch (error: unknown) {
      console.error("Login failed:", error);

      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2:
          error instanceof Error
            ? error.message
            : "Please check your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  }
  const canSubmit = !loading && !!email.trim() && password.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 20,
            paddingVertical: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card */}
          <View className="rounded-3xl border border-[#e8e8e8] bg-white px-6 pb-8 pt-8 shadow-sm">
            {/* Logo */}
            <View className="items-center">
              <Image
                source={logo}
                resizeMode="contain"
                className="h-64 w-64 -mt-24 -mb-20"
              />
            </View>

            {/* Heading */}
            <Text className="mt-6 text-center text-[24px] font-bold text-[#252525]">
              Welcome Back
            </Text>
            <Text className="mb-6 mt-1.5 text-center text-sm text-[#8a8a8a]">
              Sign in to your TechStore account
            </Text>

            {/* Email field */}
            <View className="mb-3.5 h-[52px] flex-row items-center rounded-xl border border-[#e8e8e8] bg-white px-3">
              <Ionicons name="mail-outline" size={20} color="#343434" />
              <TextInput
                className="ml-2.5 flex-1 text-[15px] text-[#252525]"
                placeholder="Email Address"
                placeholderTextColor="#8a8a8a"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password field */}
            <View className="mb-6 h-[52px] flex-row items-center rounded-xl border border-[#e8e8e8] bg-white px-3">
              <Ionicons name="lock-closed-outline" size={20} color="#343434" />
              <TextInput
                className="ml-2.5 flex-1 text-[15px] text-[#252525]"
                placeholder="Password"
                placeholderTextColor="#8a8a8a"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={10}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#8a8a8a"
                />
              </Pressable>
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleLogin}
              disabled={!canSubmit}
              className={`h-[52px] items-center justify-center rounded-xl ${
                canSubmit
                  ? "bg-[#7C3AED] active:bg-[#6D28D9]"
                  : "bg-[#7C3AED]/40"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-[17px] font-semibold text-white">
                  Sign In
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
