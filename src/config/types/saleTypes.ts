//saleTypes.ts
import type { Customer } from "../../services/post.service";

export interface StoreProduct {
  id: string;
  name: string;
  stock: number;
  basePrice: number;
  sellPrice: number;
  brand: string;
  model?: string;
  wholeSeller?: string;
  category?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SelectedProduct extends StoreProduct {
  serialNumbers?: string[];
  selectedUnitIds?: string[];
  warranty?: Date | null;
  wholeseller?: string | null;
  quantity: number;
}

export interface SaleForm {
  customerName: string;
  phoneNumber: string;
  paymentType: string;
  discount: string;
  serviceCharge: string;
  saleDate?: Date;
}

export type { Customer };
