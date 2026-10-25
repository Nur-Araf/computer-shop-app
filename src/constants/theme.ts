// src/constants/theme.ts
import { Platform } from "react-native";

export const Colors = {
  light: {
    // --foreground: oklch(0.145 0 0)  → near-black
    text: "#252525",
    // --background: oklch(1 0 0)  → pure white
    background: "#ffffff",
    // --card: oklch(1 0 0)
    card: "#ffffff",
    // --primary: oklch(0.205 0 0)
    primary: "#343434",
    // --primary-foreground: oklch(0.985 0 0)
    primaryForeground: "#fafafa",
    // --secondary: oklch(0.97 0 0)
    secondary: "#f5f5f5",
    // --muted: oklch(0.97 0 0)
    muted: "#f5f5f5",
    // --muted-foreground: oklch(0.556 0 0)
    mutedForeground: "#8a8a8a",
    // --border: oklch(0.922 0 0)
    border: "#e8e8e8",
    // --sidebar: oklch(0.985 0 0) (used for tabBar)
    tabBar: "#fafafa",
    // --destructive: oklch(0.577 0.245 27.325)
    destructive: "#e5484d",
    // --ring: oklch(0.708 0 0)
    ring: "#b3b3b3",
  },
  dark: {
    // --foreground: oklch(0.985 0 0)
    text: "#fafafa",
    // --background: oklch(0.145 0 0)
    background: "#252525",
    // --card: oklch(0.205 0 0)
    card: "#343434",
    // --primary: oklch(0.922 0 0)
    primary: "#ebebeb",
    // --primary-foreground: oklch(0.205 0 0)
    primaryForeground: "#343434",
    // --secondary: oklch(0.269 0 0)
    secondary: "#444444",
    // --muted: oklch(0.269 0 0)
    muted: "#444444",
    // --muted-foreground: oklch(0.708 0 0)
    mutedForeground: "#b3b3b3",
    // --border: oklch(1 0 0 / 10%)
    border: "rgba(255, 255, 255, 0.1)",
    // --sidebar: oklch(0.205 0 0)
    tabBar: "#343434",
    // --destructive: oklch(0.704 0.191 22.216)
    destructive: "#f2555a",
    // --ring: oklch(0.556 0 0)
    ring: "#8a8a8a",
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset =
  Platform.select({
    ios: 50,
    android: 80,
  }) ?? 0;

export const MaxContentWidth = 800;
