import { Timestamp } from "firebase/firestore";
export interface Product {
  description: string;
  id: string; // Changed from number to string
  name: string;
  brand: string;
  model?: string;
  basePrice: number;
  sellPrice: number;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
  // Removed old fields: quantity, price, category, sku, description, rating, features
}

export interface CartItem {
  description: string;
  id: string; // Changed from number to string
  name: string;
  brand: string;
  model?: string;
  basePrice: number;
  price: number; // Current price (can be edited)
  quantity: number;
  stock: number;
  image?: string;
}

export interface SaleData {
  saleId?: string; // optional, if API returns it
  orderId: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  products: {
    id: string;
    name: string;
    quantity: number;
    price?: number;
  }[];
  subtotal?: number;
  tax?: number;
  total: number;
  timestamp: string; // use string for raw API, convert to Date if needed
  // optional additional fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignUpFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  receiveUpdates: boolean;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
}

export interface OrderData {
  customer: CustomerFormData;
  products: Array<{
    // description: string;
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string; // Changed to required
  }>;
  total: number;
  orderDate: string;
  orderId: string;
}

// Full product interface for a Computer Store - UPDATED
export interface StoreProduct {
  channels: string;
  power: string;
  lastUpdated: string | undefined;
  // Required (basic info)
  id: string;
  name: string;
  brand: string;
  model?: string;
  basePrice: number;
  sellPrice: number;
  stock: number;
  image?: string;
  price: number; // Current price (can be edited)
  wholesellers: string[];
  addedDate: string;
  // Optional fields
  category?:
    | "Laptop"
    | "Desktop"
    | "Tablet"
    | "Smartphone"
    | "Monitor"
    | "Accessories"
    | "Components";
  warranty?: string;
  rating?: number;
  description?: string;
  sku?: string;
  releaseDate?: string;
  color?: string;
  weight?: string;
  dimensions?: string;

  // Optional (technical specs)
  processor?: string;
  ram?: string;
  storage?: string;
  graphics?: string;
  display?: string;
  operatingSystem?: string;
  battery?: string;
  camera?: string;
  connectivity?: string;
  ports?: string[];
  keyboard?: string;
  audio?: string;

  // Optional (monitor-specific)
  refreshRate?: string;
  resolution?: string;
  panelType?: string;
  size?: string;

  // Optional (accessories/components specific)
  compatibility?: string;
  capacity?: string;
  speed?: string;
  chipset?: string;
  interface?: string;
  features?: string[];

  // Media
  images?: string[];
  videoUrl?: string;

  // Admin fields
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  tags?: string[];
}

export interface ProductFormData {
  name: string;
  brand: string;
  model: string;
  basePrice: string; // keep as string while editing, convert on submit
  sellPrice: string; // keep as string while editing, convert on submit
  stock: string;
  category: string;
  warranty: string;
  rating: string;
  image: string;
  // Optional technical fields
  processor?: string;
  ram?: string;
  storage?: string;
  graphics?: string;
  display?: string;
  description?: string;
}

export type BankStatement = {
  id: string;
  type: "deposit" | "cashout" | "productBuy";
  amount: number;
  sourceOrDestination: string;
  person: string;
  relatedTo: string;
  note?: string;

  date: Timestamp;
  createdAt: Timestamp;
};

export interface ProductUnit {
  addedDate: string | number | Date;
  warranty?: Date | null;
  wholeseller?: string;
  id: string;
  productId: string;
  serialNumber: string;
  status: "in_stock" | "sold" | "returned" | "repair";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export interface TemperedGlass {
  id: string;

  name: string; // e.g. "Tempered Glass"

  brandModels: {
    brand: string;
    models: string[];
  }[];

  searchKeywords: string[]; // 🔥 for fast searching

  location?: {
    box?: string;
    note?: string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updatedAt?: any;
}
