import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RED = "#D52C3A";

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned) return;

    setScanned(true);
    setScanError(null);

    let qrData: unknown;

    try {
      qrData = JSON.parse(result.data);
    } catch {
      setScanError(
        "This QR code does not contain valid product data. Please scan a product QR code.",
      );
      return;
    }

    if (
      typeof qrData !== "object" ||
      qrData === null ||
      Array.isArray(qrData)
    ) {
      setScanError("Invalid QR data. Please scan a valid product QR code.");
      return;
    }

    const data = qrData as Record<string, unknown>;

    const pid = typeof data.pid === "string" ? data.pid.trim() : "";
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const sn =
      typeof data.sn === "string" || typeof data.sn === "number"
        ? String(data.sn).trim()
        : "";

    if (!pid || !name) {
      setScanError("This QR code is missing the product ID or product name.");
      return;
    }

    // Pass the QR fields to the /result screen.
    router.push({
      pathname: "/result" as never,
      params: {
        pid,
        name,
        sn,
      },
    });
  }

  function handleRetry() {
    setScanned(false);
    setScanError(null);
    setCameraError(null);
  }

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F5F5F5]">
        <Text className="text-base text-[#777777]">
          Checking camera permission...
        </Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F5F5F5] px-6">
        <StatusBar style="dark" />

        <View className="h-20 w-20 items-center justify-center rounded-3xl bg-[#D52C3A]/10">
          <Ionicons name="camera-outline" size={42} color={RED} />
        </View>

        <Text className="mt-5 text-center text-2xl font-bold text-[#252525]">
          Camera Permission Required
        </Text>

        <Text className="mt-3 text-center text-base leading-6 text-[#777777]">
          Allow camera access to scan product QR codes and retrieve product
          information.
        </Text>

        <Pressable
          onPress={() => void requestPermission()}
          className="mt-6 h-14 w-full items-center justify-center rounded-xl bg-[#D52C3A] active:opacity-80"
        >
          <Text className="font-semibold text-white">Allow Camera Access</Text>
        </Pressable>

        {!permission.canAskAgain && (
          <Text className="mt-3 text-center text-sm text-[#777777]">
            Camera access was denied. Enable it in your device settings.
          </Text>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F5]">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerClassName="flex-grow px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm font-semibold tracking-wider text-[#D52C3A]">
          PRODUCT VERIFICATION
        </Text>

        <Text className="mt-2 text-3xl font-bold text-[#252525]">
          Scan Product
        </Text>

        <Text className="mt-2 text-base leading-6 text-[#777777]">
          Point your camera at the product QR code. We will retrieve its
          information from the database.
        </Text>

        <View className="mt-6 overflow-hidden rounded-3xl border border-[#EAEAEA] bg-white p-3">
          <View
            className="overflow-hidden rounded-2xl bg-[#171717]"
            style={{ height: 360 }}
          >
            {!cameraError ? (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                active={!scanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                onMountError={(event) => setCameraError(event.message)}
              >
                <View
                  pointerEvents="none"
                  className="flex-1 items-center justify-center"
                >
                  <View className="h-60 w-60 items-center justify-center rounded-3xl border-2 border-white/90">
                    <View className="h-2 w-2 rounded-full bg-[#D52C3A]" />
                  </View>

                  <Text className="mt-5 rounded-full bg-black/60 px-4 py-2 text-center text-sm font-medium text-white">
                    Align the QR code inside the frame
                  </Text>
                </View>
              </CameraView>
            ) : (
              <View className="flex-1 items-center justify-center px-5">
                <Ionicons
                  name="alert-circle-outline"
                  size={44}
                  color="#FF6B6B"
                />
                <Text className="mt-3 text-center font-semibold text-white">
                  Camera error
                </Text>
                <Text className="mt-2 text-center text-sm text-white/80">
                  {cameraError}
                </Text>
              </View>
            )}
          </View>

          {scanError && (
            <View className="mt-4 flex-row items-start rounded-xl border border-red-200 bg-red-50 p-3">
              <Ionicons name="alert-circle-outline" size={21} color={RED} />
              <Text className="ml-2 flex-1 text-sm leading-5 text-red-700">
                {scanError}
              </Text>
            </View>
          )}

          {(scanned || cameraError) && (
            <Pressable
              onPress={handleRetry}
              className="mt-4 h-12 flex-row items-center justify-center rounded-xl bg-[#D52C3A] active:opacity-80"
            >
              <Ionicons name="refresh-outline" size={20} color="white" />
              <Text className="ml-2 font-semibold text-white">
                {cameraError ? "Retry Camera" : "Scan Again"}
              </Text>
            </Pressable>
          )}

          {!scanned && !cameraError && (
            <View className="mt-4 flex-row items-center justify-center">
              <Ionicons name="scan-outline" size={20} color={RED} />
              <Text className="ml-2 text-sm text-[#777777]">
                Waiting for a QR code...
              </Text>
            </View>
          )}
        </View>

        <View className="mt-5 flex-row items-start rounded-2xl border border-[#EAEAEA] bg-white p-4">
          <Ionicons name="information-circle-outline" size={22} color={RED} />
          <Text className="ml-3 flex-1 text-sm leading-5 text-[#666666]">
            A valid product QR should contain a product ID and product name.
            Product information is loaded from Firestore after scanning.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
