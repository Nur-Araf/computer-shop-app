import AsyncStorage from "@react-native-async-storage/async-storage";
import type * as NotificationsType from "expo-notifications";
import { Platform } from "react-native";

const STORAGE_KEY = "due_reminders_v1";
const CHANNEL_ID = "due-reminders";

type NotificationsModule = typeof NotificationsType;
let cached: NotificationsModule | null | undefined;

// Loads expo-notifications only when needed. Returns null in Expo Go
// (or anywhere the native module is missing) instead of crashing.
function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  try {
    const mod = require("expo-notifications") as NotificationsModule;
    mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    cached = mod;
  } catch (err) {
    console.warn("Notifications unavailable in this build:", err);
    cached = null;
  }
  return cached;
}

export const remindersSupported = () => getNotifications() !== null;

export type DueReminder = {
  saleId: string;
  notificationId: string;
  remindAt: string;
  note: string;
  customerName: string;
  orderId: string;
};
export type ReminderMap = Record<string, DueReminder>;

export const fmtDateTime = (d: Date) =>
  d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

export async function loadReminders(): Promise<ReminderMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReminderMap) : {};
  } catch {
    return {};
  }
}

async function saveReminders(map: ReminderMap) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

async function cancel(notificationId: string) {
  const N = getNotifications();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(notificationId).catch(() => {});
}

export async function ensureReminderPermission(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;

  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Payment reminders",
      importance: N.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#D52C3A",
    });
  }
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await N.requestPermissionsAsync()).granted;
}

export async function scheduleReminder(input: {
  saleId: string;
  customerName: string;
  orderId: string;
  dueAmount: number;
  remindAt: Date;
  note: string;
}): Promise<ReminderMap> {
  const N = getNotifications();
  if (!N) throw new Error("Notifications not available in this build");

  const map = await loadReminders();
  const old = map[input.saleId];
  if (old) await cancel(old.notificationId);

  const notificationId = await N.scheduleNotificationAsync({
    content: {
      title: `Payment due: ${input.customerName}`,
      body: `${input.note ? `${input.note} • ` : ""}৳${input.dueAmount} due • Order ${input.orderId}`,
      data: { saleId: input.saleId, orderId: input.orderId },
      sound: true,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DATE,
      date: input.remindAt,
      channelId: CHANNEL_ID,
    },
  });

  map[input.saleId] = {
    saleId: input.saleId,
    notificationId,
    remindAt: input.remindAt.toISOString(),
    note: input.note,
    customerName: input.customerName,
    orderId: input.orderId,
  };
  await saveReminders(map);
  return map;
}

export async function removeReminder(saleId: string): Promise<ReminderMap> {
  const map = await loadReminders();
  const old = map[saleId];
  if (old) {
    await cancel(old.notificationId);
    delete map[saleId];
    await saveReminders(map);
  }
  return map;
}

export async function pruneReminders(
  activeSaleIds: Set<string>,
): Promise<ReminderMap> {
  const map = await loadReminders();
  let changed = false;
  for (const saleId of Object.keys(map)) {
    if (!activeSaleIds.has(saleId)) {
      await cancel(map[saleId].notificationId);
      delete map[saleId];
      changed = true;
    }
  }
  if (changed) await saveReminders(map);
  return map;
}
