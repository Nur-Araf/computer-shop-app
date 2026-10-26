// src/app/(tabs)/scan.tsx
import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { addScannedProductToSale } from "../../components/sales/Addscannedproducttosale";
import { useSaleCart } from "../../components/sales/Salecartstore";

const RED = "#D52C3A";

// Ignore the same QR for this long after it was read (the phone is still pointing at it)
const SAME_CODE_COOLDOWN_MS = 3000;
// How long the success message stays before the scanner is ready again
const RESUME_DELAY_MS = 1200;

type AddedInfo = { pid: string; name: string; serial?: string };

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const { selected } = useSaleCart();

  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [autoAdd, setAutoAdd] = useState(true);
  const [adding, setAdding] = useState(false);
  const [lastAdded, setLastAdded] = useState<AddedInfo | null>(null);

  // Refs are updated synchronously, so two camera callbacks can never both pass the lock
  const lockRef = useRef(false);
  const lastRawRef = useRef<{ data: string; at: number } | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cartCount = selected.reduce((sum, p) => sum + p.quantity, 0);
  const liveQty = lastAdded
    ? (selected.find((p) => p.id === lastAdded.pid)?.quantity ?? 0)
    : 0;

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  // Tabs stay mounted, so old scan state survives. Start fresh every time this tab opens.
  useFocusEffect(
    useCallback(() => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      lockRef.current = false;
      lastRawRef.current = null;
      setScanned(false);
      setScanError(null);
      setLastAdded(null);
      setAdding(false);
    }, []),
  );

  // If the product we just added is no longer in the cart (sale completed, cleared
  // or deleted), drop the old message and allow the same QR to be scanned again.
  useEffect(() => {
    if (!lastAdded) return;
    if (selected.some((p) => p.id === lastAdded.pid)) return;

    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    lockRef.current = false;
    lastRawRef.current = null;
    setScanned(false);
    setLastAdded(null);
  }, [selected, lastAdded]);

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (lockRef.current) return;

    const now = Date.now();
    const last = lastRawRef.current;
    if (
      last &&
      last.data === result.data &&
      now - last.at < SAME_CODE_COOLDOWN_MS
    ) {
      return;
    }

    lockRef.current = true;
    lastRawRef.current = { data: result.data, at: now };

    setScanned(true);
    setScanError(null);
    setLastAdded(null);

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

    // Old behaviour: just show the product details
    if (!autoAdd) {
      router.push({
        pathname: "/result" as never,
        params: { pid, name, sn },
      });
      return;
    }

    // New behaviour: add the product (and the exact serial) to the sale
    setAdding(true);
    try {
      const res = await addScannedProductToSale({ pid, sn });

      if (res.ok) {
        setLastAdded({
          pid,
          name: res.productName,
          serial: res.serial,
        });

        // get ready for the next product automatically
        resumeTimer.current = setTimeout(() => {
          lockRef.current = false;
          setScanned(false);
        }, RESUME_DELAY_MS);
      } else {
        setScanError(res.message);
      }
    } catch (err) {
      setScanError(
        err instanceof Error
          ? `Could not add product: ${err.message}`
          : "Could not add this product to the sale.",
      );
    } finally {
      setAdding(false);
    }
  }

  function handleRetry() {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    lockRef.current = false;
    lastRawRef.current = null;
    setScanned(false);
    setScanError(null);
    setCameraError(null);
    setLastAdded(null);
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

  // In auto-add mode the preview keeps running so the next scan is instant.
  const cameraActive = autoAdd ? !scanError : !scanned;
  const showRetry = !!cameraError || (scanned && !adding && !lastAdded);

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
          Point your camera at the product QR code.{" "}
          {autoAdd
            ? "The product is added to the current sale automatically."
            : "We will retrieve its information from the database."}
        </Text>

        {/* Mode toggle + cart summary */}
        <View className="mt-5 rounded-2xl border border-[#EAEAEA] bg-white p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-[#252525]">
                Add scanned products to sale
              </Text>
              <Text className="mt-0.5 text-xs text-[#777777]">
                Turn off to only view product details
              </Text>
            </View>
            <Switch
              value={autoAdd}
              onValueChange={setAutoAdd}
              trackColor={{ true: RED }}
            />
          </View>

          {autoAdd && cartCount > 0 && (
            <View className="mt-3 flex-row items-center justify-between border-t border-[#F0F0F0] pt-3">
              <View className="flex-row items-center">
                <Ionicons name="cart-outline" size={18} color={RED} />
                <Text className="ml-2 text-sm text-[#555555]">
                  {cartCount} item{cartCount === 1 ? "" : "s"} in sale
                </Text>
              </View>
              <Pressable
                onPress={() => router.navigate("/sales" as never)}
                className="rounded-full bg-[#D52C3A] px-4 py-2 active:opacity-80"
              >
                <Text className="text-sm font-semibold text-white">
                  View Sale
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <View className="mt-5 overflow-hidden rounded-3xl border border-[#EAEAEA] bg-white p-3">
          <View
            className="overflow-hidden rounded-2xl bg-[#171717]"
            style={{ height: 360 }}
          >
            {!cameraError ? (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                active={cameraActive}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={handleBarcodeScanned}
                onMountError={(event) => setCameraError(event.message)}
              >
                <View
                  pointerEvents="none"
                  className="flex-1 items-center justify-center"
                >
                  <View
                    className={`h-60 w-60 items-center justify-center rounded-3xl border-2 ${
                      lastAdded ? "border-green-400" : "border-white/90"
                    }`}
                  >
                    {lastAdded ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={56}
                        color="#4ADE80"
                      />
                    ) : (
                      <View className="h-2 w-2 rounded-full bg-[#D52C3A]" />
                    )}
                  </View>

                  <Text className="mt-5 rounded-full bg-black/60 px-4 py-2 text-center text-sm font-medium text-white">
                    {lastAdded
                      ? "Added! Ready for the next product"
                      : "Align the QR code inside the frame"}
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

          {adding && (
            <View className="mt-4 flex-row items-center justify-center rounded-xl border border-[#EAEAEA] bg-[#FAFAFA] p-3">
              <ActivityIndicator color={RED} />
              <Text className="ml-3 text-sm text-[#555555]">
                Adding product to sale...
              </Text>
            </View>
          )}

          {lastAdded && (
            <View className="mt-4 flex-row items-start rounded-xl border border-green-200 bg-green-50 p-3">
              <Ionicons name="checkmark-circle" size={21} color="#16804A" />
              <View className="ml-2 flex-1">
                <Text className="text-sm font-semibold text-green-800">
                  Added to sale: {lastAdded.name}
                </Text>
                <Text className="mt-0.5 text-xs text-green-700">
                  {lastAdded.serial ? `Serial: ${lastAdded.serial} • ` : ""}
                  Quantity in sale: {liveQty}
                </Text>
              </View>
            </View>
          )}

          {scanError && (
            <View className="mt-4 flex-row items-start rounded-xl border border-red-200 bg-red-50 p-3">
              <Ionicons name="alert-circle-outline" size={21} color={RED} />
              <Text className="ml-2 flex-1 text-sm leading-5 text-red-700">
                {scanError}
              </Text>
            </View>
          )}

          {showRetry && (
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

          {!scanned && !cameraError && !adding && (
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
            A valid product QR should contain a product ID and product name. If
            it also has a serial number, that exact unit is selected for the
            sale.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
