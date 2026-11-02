import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { fmtDateTime, type DueReminder } from "../../components/unpaid/Duereminderservice";

const RED = "#D52C3A";

type Props = {
  visible: boolean;
  customerName: string;
  orderId: string;
  dueText: string;
  existing?: DueReminder;
  onClose: () => void;
  onSave: (date: Date, note: string) => void;
  onRemove: () => void;
};

const at10 = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(10, 0, 0, 0);
  return d;
};

const PRESETS: { label: string; get: () => Date }[] = [
  { label: "In 1 hour", get: () => new Date(Date.now() + 60 * 60 * 1000) },
  { label: "Tomorrow 10 AM", get: () => at10(1) },
  { label: "In 3 days", get: () => at10(3) },
  { label: "Next week", get: () => at10(7) },
  { label: "In 2 weeks", get: () => at10(14) },
];

export default function ReminderModal({
  visible,
  customerName,
  orderId,
  dueText,
  existing,
  onClose,
  onSave,
  onRemove,
}: Props) {
  const [date, setDate] = useState<Date>(at10(1));
  const [note, setNote] = useState("");
  const [showIosPicker, setShowIosPicker] = useState(false);

  // load existing values each time the sheet opens
  useEffect(() => {
    if (!visible) return;
    const prev = existing ? new Date(existing.remindAt) : null;
    setDate(prev && prev.getTime() > Date.now() ? prev : at10(1));
    setNote(existing?.note ?? "");
    setShowIosPicker(false);
  }, [visible, existing]);

  const openAndroid = (mode: "date" | "time") => {
    DateTimePickerAndroid.open({
      value: date,
      mode,
      minimumDate: mode === "date" ? new Date() : undefined,
      is24Hour: false,
      onChange: (event, picked) => {
        if (event.type !== "set" || !picked) return;
        const next = new Date(date);
        if (mode === "date") {
          next.setFullYear(
            picked.getFullYear(),
            picked.getMonth(),
            picked.getDate(),
          );
        } else {
          next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
        }
        setDate(next);
      },
    });
  };

  const handleSave = () => {
    if (date.getTime() <= Date.now() + 30 * 1000) {
      Alert.alert(
        "Pick a future time",
        "The reminder time must be in the future.",
      );
      return;
    }
    onSave(date, note.trim());
  };

  const confirmRemove = () => {
    Alert.alert(
      "Remove reminder?",
      "You will no longer be notified for this order.",
      [
        { text: "Keep", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: onRemove },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable className="flex-1 bg-black/40" onPress={onClose} />

        <View className="max-h-[88%] rounded-t-3xl bg-white">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-[#EAEAEA] px-5 py-4">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-bold text-[#252525]">
                {existing ? "Edit reminder" : "Set reminder"}
              </Text>
              <Text className="mt-0.5 text-xs text-[#777777]" numberOfLines={1}>
                {customerName} • {orderId} • Due {dueText}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#777777" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="px-5 pb-8 pt-4"
            keyboardShouldPersistTaps="handled"
          >
            {/* Quick presets */}
            <Text className="mb-2 text-sm font-medium text-[#555555]">
              Quick pick
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Pressable
                  key={p.label}
                  onPress={() => setDate(p.get())}
                  className="rounded-full border border-[#DDDDDD] bg-white px-4 py-2 active:bg-[#F5F5F5]"
                >
                  <Text className="text-sm text-[#555555]">{p.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Selected time */}
            <View className="mt-5 flex-row items-center rounded-2xl border border-[#D52C3A]/30 bg-[#D52C3A]/5 p-4">
              <Ionicons name="alarm-outline" size={26} color={RED} />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-[#777777]">
                  You will be reminded on
                </Text>
                <Text className="mt-0.5 text-base font-bold text-[#252525]">
                  {fmtDateTime(date)}
                </Text>
              </View>
            </View>

            {/* Custom date / time */}
            {Platform.OS === "android" ? (
              <View className="mt-3 flex-row gap-3">
                <Pressable
                  onPress={() => openAndroid("date")}
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-[#DDDDDD] py-3"
                >
                  <Ionicons name="calendar-outline" size={18} color="#555555" />
                  <Text className="ml-2 font-medium text-[#555555]">
                    Pick date
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => openAndroid("time")}
                  className="flex-1 flex-row items-center justify-center rounded-xl border border-[#DDDDDD] py-3"
                >
                  <Ionicons name="time-outline" size={18} color="#555555" />
                  <Text className="ml-2 font-medium text-[#555555]">
                    Pick time
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Pressable
                  onPress={() => setShowIosPicker((v) => !v)}
                  className="mt-3 flex-row items-center justify-center rounded-xl border border-[#DDDDDD] py-3"
                >
                  <Ionicons name="calendar-outline" size={18} color="#555555" />
                  <Text className="ml-2 font-medium text-[#555555]">
                    {showIosPicker ? "Hide picker" : "Pick date & time"}
                  </Text>
                </Pressable>
                {showIosPicker && (
                  <DateTimePicker
                    value={date}
                    mode="datetime"
                    display="inline"
                    minimumDate={new Date()}
                    onChange={(_, picked) => picked && setDate(picked)}
                  />
                )}
              </>
            )}

            {/* Note */}
            <Text className="mb-1.5 mt-5 text-sm font-medium text-[#555555]">
              Note (optional)
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Customer promised to pay after salary"
              placeholderTextColor="#999999"
              multiline
              maxLength={120}
              className="min-h-[72px] rounded-xl border border-[#DDDDDD] bg-white px-4 py-3 text-[15px] text-[#252525]"
              textAlignVertical="top"
            />

            {/* Actions */}
            <Pressable
              onPress={handleSave}
              className="mt-6 flex-row items-center justify-center rounded-xl bg-[#D52C3A] py-3.5 active:opacity-80"
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text className="ml-2 font-semibold text-white">
                {existing ? "Update reminder" : "Save reminder"}
              </Text>
            </Pressable>

            {existing && (
              <Pressable
                onPress={confirmRemove}
                className="mt-3 flex-row items-center justify-center rounded-xl border border-red-200 py-3.5"
              >
                <Ionicons name="trash-outline" size={18} color={RED} />
                <Text className="ml-2 font-semibold text-[#D52C3A]">
                  Remove reminder
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
