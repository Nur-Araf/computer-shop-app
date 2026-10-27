// src/components/sales/addScannedProductToSale.ts

import type { SelectedProduct } from "@/config/types/saleTypes";
import { StoreProductService } from "@/services/post.service";
import { saleCart } from "../../components/sales/Salecartstore";

export type ScanAddResult =
  | {
      ok: true;
      productName: string;
      serial?: string;
      quantity: number;
    }
  | {
      ok: false;
      message: string;
    };

const fail = (message: string): ScanAddResult => ({
  ok: false,
  message,
});

export async function addScannedProductToSale(input: {
  pid: string;
  sn?: string;
}): Promise<ScanAddResult> {
  const pid = input.pid.trim();
  const sn = input.sn?.trim() || undefined;

  if (!pid) {
    return fail("The scanned QR code does not contain a product ID.");
  }

  // Find the product directly by its Firestore document ID.
  const product = await StoreProductService.getStoreProduct(pid);

  if (!product) {
    return fail(`Product not found for ID: ${pid}`);
  }

  const stock = Number(product.stock ?? 0);

  if (stock <= 0) {
    return fail(`"${product.name}" is out of stock.`);
  }

  const existing = saleCart.get().selected.find((p) => p.id === pid);

  if (existing && existing.quantity >= stock) {
    return fail(
      `Only ${stock} of "${product.name}" are in stock. Already in the sale.`,
    );
  }

  let newQuantity = 1;

  saleCart.setSelected((prev) => {
    const current = prev.find((p) => p.id === pid);

    if (current) {
      newQuantity = current.quantity + 1;

      return prev.map((p) =>
        p.id === pid
          ? ({
              ...p,
              quantity: p.quantity + 1,
            } as SelectedProduct)
          : p,
      );
    }

    newQuantity = 1;

    return [
      ...prev,
      {
        ...product,
        quantity: 1,
        selectedUnitIds: [],
        serialNumbers: [],
        warranty: null,
      } as SelectedProduct,
    ];
  });

  return {
    ok: true,
    productName: product.name,
    serial: sn,
    quantity: newQuantity,
  };
}
