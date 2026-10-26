import type { SelectedProduct } from "@/config/types/saleTypes";
import type { ProductUnit } from "@/config/types/types";
import {
  ProductUnitService,
  StoreProductService,
} from "@/services/post.service";
import { saleCart } from "../../components/sales/Salecartstore";

export type ScanAddResult =
  | { ok: true; productName: string; serial?: string; quantity: number }
  | { ok: false; message: string };

const fail = (message: string): ScanAddResult => ({ ok: false, message });

/**
 * Adds a scanned product to the sale cart.
 *
 * - Always reads FRESH product data (stock can change after the list was loaded).
 * - If the QR has a serial number (`sn`), that exact unit is selected for the sale.
 *   The unit must exist, be in stock and not already be in the cart.
 * - If the QR has no serial, the product is added with quantity +1 and a unit is
 *   auto-assigned when the sale is completed.
 */
export async function addScannedProductToSale(input: {
  pid: string;
  sn?: string;
}): Promise<ScanAddResult> {
  const pid = input.pid.trim();
  const sn = (input.sn || "").trim();

  const product = await StoreProductService.getStoreProduct(pid);
  if (!product) return fail(`No product found for ID: ${pid}`);

  const stock = product.stock ?? 0;
  if (stock <= 0) return fail(`"${product.name}" is out of stock.`);

  const existing = saleCart.get().selected.find((p) => p.id === pid);
  if (existing && existing.quantity >= stock) {
    return fail(
      `Only ${stock} of "${product.name}" in stock. Already in the sale.`,
    );
  }

  // Resolve the exact unit when the QR contains a serial number
  let unit: ProductUnit | undefined;
  if (sn) {
    const units = await ProductUnitService.getUnitsByProduct(pid);
    unit = units.find((u) => String(u.serialNumber).trim() === sn);

    if (!unit) return fail(`Serial ${sn} was not found for "${product.name}".`);
    if (unit.status !== "in_stock") {
      return fail(`Serial ${sn} is not available (status: ${unit.status}).`);
    }
    if (existing?.selectedUnitIds?.includes(unit.id)) {
      return fail(`Serial ${sn} is already in this sale.`);
    }
  }

  // Re-read the cart inside the updater: it may have changed while we awaited
  let newQuantity = 1;

  saleCart.setSelected((prev) => {
    const current = prev.find((p) => p.id === pid);

    if (current) {
      newQuantity = current.quantity + 1;
      return prev.map((p) =>
        p.id !== pid
          ? p
          : ({
              ...p,
              quantity: p.quantity + 1,
              selectedUnitIds: unit
                ? [...(p.selectedUnitIds || []), unit.id]
                : p.selectedUnitIds || [],
              serialNumbers: unit
                ? [...(p.serialNumbers || []), unit.serialNumber]
                : p.serialNumbers || [],
              warranty: p.warranty ?? unit?.warranty ?? null,
            } as SelectedProduct),
      );
    }

    newQuantity = 1;
    return [
      ...prev,
      {
        ...product,
        quantity: 1,
        selectedUnitIds: unit ? [unit.id] : [],
        serialNumbers: unit ? [unit.serialNumber] : [],
        warranty: unit?.warranty ?? null,
      } as SelectedProduct,
    ];
  });

  // Keep the serial picker dialog in sync with what was scanned
  if (unit) {
    const scannedUnit = unit;
    saleCart.setSelectedUnitsMap((m) => ({
      ...m,
      [pid]: [...(m[pid] || []), scannedUnit],
    }));
  }

  return {
    ok: true,
    productName: product.name,
    serial: unit ? String(unit.serialNumber) : undefined,
    quantity: newQuantity,
  };
}
