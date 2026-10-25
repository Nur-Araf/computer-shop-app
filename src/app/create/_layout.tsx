import { Redirect, Stack } from "expo-router";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { auth } from "@/lib/firebase";
import { UserService } from "@/services/user";

type AccessStatus = "loading" | "allowed" | "unauthenticated" | "denied";

const RED = "#D52C3A";

export default function CreateLayout() {
  const [status, setStatus] = useState<AccessStatus>("loading");

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user?.email) {
        if (active) setStatus("unauthenticated");
        return;
      }

      if (active) setStatus("loading");

      try {
        const profile = await UserService.getUserByEmail(user.email);

        const allowed = profile?.role === "admin" || profile?.role === "staff";

        if (active) {
          setStatus(allowed ? "allowed" : "denied");
        }
      } catch (error) {
        console.error("Failed to verify QR access:", error);

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
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
        }}
      >
        <ActivityIndicator size="large" color={RED} />
      </View>
    );
  }

  if (status === "unauthenticated") {
    return <Redirect href="/login" />;
  }

  if (status === "denied") {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: "#ffffff",
        }}
      >
        <Text
          style={{
            color: "#252525",
            fontSize: 20,
            fontWeight: "700",
          }}
        >
          Access denied
        </Text>

        <Text
          style={{
            color: "#777777",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          You do not have permission to access QR Management.
        </Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
