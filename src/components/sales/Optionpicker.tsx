import { Ionicons } from "@expo/vector-icons";
import { FlatList, Modal, Pressable, Text, View } from "react-native";

const RED = "#D52C3A";

type Option = { label: string; value: string };

type Props = {
  visible: boolean;
  title: string;
  options: Option[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

export default function OptionPicker({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable className="flex-1 bg-black/40" onPress={onClose} />
        <View className="max-h-[60%] rounded-t-3xl bg-white pb-8">
          <View className="flex-row items-center justify-between border-b border-[#EAEAEA] px-5 py-4">
            <Text className="text-base font-bold text-[#252525]">{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color="#777777" />
            </Pressable>
          </View>

          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => {
              const active = item.value === selected;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                  className="flex-row items-center justify-between px-5 py-4 active:bg-[#F5F5F5]"
                >
                  <Text
                    className={`text-[15px] capitalize ${
                      active ? "font-bold text-[#D52C3A]" : "text-[#252525]"
                    }`}
                  >
                    {item.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={20} color={RED} />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
