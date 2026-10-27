import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { auth } from "@/lib/firebase";
import { UserService } from "@/services/user";

type AccessStatus = "loading" | "allowed" | "denied";

const RED = "#D52C3A";
const INACTIVE = "#9a9a9a";
const BORDER = "#e8e8e8";
const BG = "#ffffff";

export default function TabsLayout() {
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
        if (active) setStatus(authorized ? "allowed" : "denied");
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
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={RED} />
      </View>
    );
  }

  if (status === "denied") {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: RED,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: BG,
          borderTopColor: BORDER,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      {/* <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      /> */}
      <Tabs.Screen
        name="sales"
        options={{
          title: "Sales",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "cart" : "cart-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "qr-code" : "qr-code-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused ? "ellipsis-horizontal" : "ellipsis-horizontal-outline"
              }
              size={24}
              color={color}
            />
          ),
        }}
      /> */}
      <Tabs.Screen
        name="subsale"
        options={{
          title: "Sub Sale",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "pricetag" : "pricetag-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
