// src/app/_layout.tsx
import { Stack, useRouter, useSegments } from "expo-router";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Toast from "react-native-toast-message";

import { Colors } from "@/constants/theme";
import { auth } from "@/lib/firebase";
import "../global.css";

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const router = useRouter();
  const segments = useSegments();
  const colors = Colors.light;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (checkingAuth) return;

    const onLoginScreen = segments[0] === "login";

    if (!user && !onLoginScreen) {
      router.replace("/login");
      return;
    }

    if (user && onLoginScreen) {
      router.replace("/(tabs)");
    }
  }, [user, checkingAuth, segments, router]);

  console.log("AUTH GUARD CHECK", {
    user: user?.uid ?? null,
    checkingAuth,
    segments,
  });

  if (checkingAuth) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="create" />
        <Stack.Screen name="result" />
      </Stack>
      <Toast />
    </>
  );
}
