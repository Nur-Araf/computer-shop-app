import { NativeTabs } from "expo-router/native-tabs";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const colors = Colors.light;

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
