import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { Colors } from "@/constants/theme";
import { auth } from "@/lib/firebase";
import { UserService } from "@/services/user";

type AccessStatus = "loading" | "allowed" | "denied";

export default function TabsLayout() {
  const colors = Colors.light;
  const [status, setStatus] = useState<AccessStatus>("loading");

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user?.email) {
        if (active) setStatus("denied");
        return;
      }

      if (active) setStatus("loading");

      try {
        const firestoreUser = await UserService.getUserByEmail(user.email);

        const authorized =
          firestoreUser?.role === "admin" || firestoreUser?.role === "staff";

        if (active) {
          setStatus(authorized ? "allowed" : "denied");
        }
      } catch (error) {
        console.error("Failed to verify user access:", error);

        if (active) setStatus("denied");
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (status === "loading") {
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

  if (status === "denied") {
    return <Redirect href="/login" />;
  }

  return (
    <NativeTabs
      backgroundColor={colors.tabBar}
      indicatorColor={colors.secondary}
      labelStyle={{
        selected: { color: colors.primary },
        default: { color: colors.mutedForeground },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="safari" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="house">
        <NativeTabs.Trigger.Label>House</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="building.2" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
