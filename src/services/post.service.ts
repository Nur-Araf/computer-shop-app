import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
  writeBatch,
  limit,
  increment,
} from "firebase/firestore";
import type {
  BankStatement,
  ProductUnit,
  StoreProduct,
  TemperedGlass,
} from "../config/types/types";
import { Timestamp } from "firebase/firestore";

// ---------------------
// PRODUCTS SERVICE
// ---------------------
const COLLECTION_NAME = "products";

export const StoreProductService = {
  async getStoreProducts(): Promise<StoreProduct[]> {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as StoreProduct,
    );
  },

  async getStoreProduct(id: string): Promise<StoreProduct | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as StoreProduct;
    }
    return null;
  },

  async addStoreProduct(
    storeProduct: Omit<StoreProduct, "id">,
  ): Promise<StoreProduct> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), storeProduct);
    return { id: docRef.id, ...storeProduct };
  },

  async updateStoreProduct(
    id: string,
    storeProductData: Partial<StoreProduct>,
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, storeProductData);
  },

  async deleteStoreProduct(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  },

  async getStoreProductsByCategory(category: string): Promise<StoreProduct[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("category", "==", category),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as StoreProduct,
    );
  },

  async getStoreProductsByBrand(brand: string): Promise<StoreProduct[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("brand", "==", brand),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as StoreProduct,
    );
  },

  async getStoreProductsByWholeseller(
    wholeseller: string,
  ): Promise<StoreProduct[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("wholesellers", "array-contains", wholeseller),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as StoreProduct,
    );
  },
};

// ---------------------
// USER SERVICE
// ---------------------

interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
}

const USER_COLLECTION_NAME = "users";

export const UserService = {
  // Fetch all users
  async getUsers(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, USER_COLLECTION_NAME));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User);
  },

  // Fetch a single user by ID
  async getUser(id: string): Promise<User | null> {
    const docRef = doc(db, USER_COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  },

  // Add a new user
  async addUser(user: Omit<User, "id">): Promise<User> {
    const docRef = await addDoc(collection(db, USER_COLLECTION_NAME), user);
    return { id: docRef.id, ...user };
  },

  // Update an existing user
  async updateUser(id: string, userData: Partial<User>): Promise<void> {
    const docRef = doc(db, USER_COLLECTION_NAME, id);
    await updateDoc(docRef, userData);
  },

  // Delete a user
  async deleteUser(id: string): Promise<void> {
    await deleteDoc(doc(db, USER_COLLECTION_NAME, id));
  },

  // Example: Query users by email (assuming 'email' is a field on the User document)
  async getUserByEmail(email: string): Promise<User | null> {
    const q = query(
      collection(db, USER_COLLECTION_NAME),
      where("email", "==", email),
    );
    const snapshot = await getDocs(q);

    // An email should typically be unique, so we return the first match or null
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    }
    return null;
  },

  async getUserByRole(role: string): Promise<User[]> {
    const q = query(
      collection(db, USER_COLLECTION_NAME),
      where("role", "==", role),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User);
  },
};

// ---------------------
// SALES SERVICE
// ---------------------
// New interface for sale
interface SaleProduct {
  serialNumbers?: string[];
  warranty?: string;
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  basePrice: number;
}

export interface SaleData {
  id?: string;
  customerName: string;
  paymentType: string;
  discount: number;
  serviceCharge: number;
  products: SaleProduct[];
  subtotal: number;
  total: number;
  date: string;
  orderId: string;
  phoneNumber: string;
  paidAmount?: number; // Add this
  dueAmount?: number; // Add this
  totalBaseAmount: number;
  profit: number;

  paymentStatus?: "paid" | "partial" | "unpaid";
}

const SALES_COLLECTION = "sales";

export const SalesService = {
  async getSales(): Promise<SaleData[]> {
    const snapshot = await getDocs(collection(db, SALES_COLLECTION));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as SaleData,
    );
  },

  async getSale(id: string): Promise<SaleData | null> {
    const docRef = doc(db, SALES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as SaleData;
    }
    return null;
  },

  async getSalesByOrderId(orderId: string): Promise<SaleData[]> {
    const q = query(
      collection(db, SALES_COLLECTION),
      where("orderId", "==", orderId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as SaleData,
    );
  },

  async addSale(sale: Omit<SaleData, "id">): Promise<SaleData> {
    const shouldUseServerTime = !sale.date;

    const docRef = await addDoc(collection(db, SALES_COLLECTION), {
      ...sale,
      date: shouldUseServerTime ? serverTimestamp() : sale.date,
    });

    if (!shouldUseServerTime) {
      return { id: docRef.id, ...sale };
    }

    // Only if server time was used → convert to ISO
    const snap = await getDoc(docRef);
    const data = snap.data();

    let isoDate = "";

    if (data?.date instanceof Timestamp) {
      isoDate = data.date.toDate().toISOString();
      await updateDoc(docRef, { date: isoDate });
    }

    return { id: docRef.id, ...sale, date: isoDate };
  },
  async updateSale(id: string, saleData: Partial<SaleData>): Promise<void> {
    const docRef = doc(db, SALES_COLLECTION, id);
    await updateDoc(docRef, saleData);
  },

  async deleteSale(id: string): Promise<void> {
    await deleteDoc(doc(db, SALES_COLLECTION, id));
  },

  async searchSales(searchTerm: string): Promise<SaleData[]> {
    const allSales = await this.getSales();

    return allSales.filter(
      (sale) =>
        sale.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.products.some((product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );
  },
};

// ---------------------
// TYPES SERVICE (Brands & Categories)
// ---------------------
const TYPES_COLLECTION = "types";

interface TypeData {
  id?: string;
  brands: string[];
  categories: string[];
}

export const TypeService = {
  async getTypes(): Promise<TypeData[]> {
    const snapshot = await getDocs(collection(db, TYPES_COLLECTION));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as TypeData,
    );
  },

  async getType(id: string): Promise<TypeData | null> {
    const docRef = doc(db, TYPES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as TypeData;
    }
    return null;
  },

  async addType(typeData: Omit<TypeData, "id">): Promise<TypeData> {
    const docRef = await addDoc(collection(db, TYPES_COLLECTION), typeData);
    return { id: docRef.id, ...typeData };
  },

  async updateType(id: string, data: Partial<TypeData>): Promise<void> {
    const docRef = doc(db, TYPES_COLLECTION, id);
    await updateDoc(docRef, data);
  },

  async deleteType(id: string): Promise<void> {
    await deleteDoc(doc(db, TYPES_COLLECTION, id));
  },
};

// ---------------------
// SERVICE INTERFACE
// ---------------------
export interface Service {
  createdAt: string;
  id?: string;
  serviceName: string;
  customer: string;
  phoneNumber: string;
  technician: string;
  price: string;
  status: "pending" | "in_progress" | "completed";
}

// ---------------------
// SERVICES COLLECTION
// ---------------------
const SERVICE_NAME = "services";

export const ServiceManagementService = {
  // Get all services
  async getAllServices(): Promise<Service[]> {
    const snapshot = await getDocs(collection(db, SERVICE_NAME));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Service,
    );
  },

  // Get a single service by ID
  async getService(id: string): Promise<Service | null> {
    const docRef = doc(db, SERVICE_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Service;
    }
    return null;
  },

  // Add a new service
  async addService(service: Omit<Service, "id">): Promise<Service> {
    const docRef = await addDoc(collection(db, SERVICE_NAME), service);
    return { id: docRef.id, ...service };
  },

  // Update service
  async updateService(
    id: string,
    serviceData: Partial<Service>,
  ): Promise<void> {
    const docRef = doc(db, SERVICE_NAME, id);
    await updateDoc(docRef, serviceData);
  },

  // Delete service
  async deleteService(id: string): Promise<void> {
    await deleteDoc(doc(db, SERVICE_NAME, id));
  },

  // Get services by status
  async getServicesByStatus(status: Service["status"]): Promise<Service[]> {
    const q = query(
      collection(db, SERVICE_NAME),
      where("status", "==", status),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Service,
    );
  },

  // Get services by technician
  async getServicesByTechnician(technician: string): Promise<Service[]> {
    const q = query(
      collection(db, SERVICE_NAME),
      where("technician", "==", technician),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Service,
    );
  },

  // Get services by phone number
  async getServicesByPhoneNumber(phoneNumber: string): Promise<Service[]> {
    const q = query(
      collection(db, SERVICE_NAME),
      where("phoneNumber", "==", phoneNumber),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Service,
    );
  },
};

export interface RefundProduct {
  customRefundAmount: string | number | readonly string[] | undefined;
  maxCustomRefund: string | number | undefined;
  customRefundEnabled: any;
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  originalQuantity: number; // Original quantity from sale
}

export interface RefundData {
  id?: string;
  saleId: string;
  orderId: string;
  customerName: string;
  originalTotal: number;
  refundAmount: number;
  products: RefundProduct[];
  reason: string;
  date: string;
  refundId: string;
}

const REFUNDS_COLLECTION = "refunds";

export const RefundService = {
  async getRefunds(): Promise<RefundData[]> {
    const snapshot = await getDocs(collection(db, REFUNDS_COLLECTION));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as RefundData,
    );
  },

  async getRefund(id: string): Promise<RefundData | null> {
    const docRef = doc(db, REFUNDS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as RefundData;
    }
    return null;
  },

  async addRefund(refund: Omit<RefundData, "id">): Promise<RefundData> {
    const docRef = await addDoc(collection(db, REFUNDS_COLLECTION), refund);
    return { id: docRef.id, ...refund };
  },

  async getRefundsBySaleId(saleId: string): Promise<RefundData[]> {
    const q = query(
      collection(db, REFUNDS_COLLECTION),
      where("saleId", "==", saleId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as RefundData,
    );
  },
};

const EXPENSE_COLLECTION_NAME = "expenses";

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string; // ISO string (e.g. "2025-10-14")
  description?: string;
}

export const ExpenseService = {
  // Get all expenses
  async getExpenses(): Promise<Expense[]> {
    const snapshot = await getDocs(collection(db, EXPENSE_COLLECTION_NAME));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Expense,
    );
  },

  // Get single expense by ID
  async getExpense(id: string): Promise<Expense | null> {
    const docRef = doc(db, EXPENSE_COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Expense;
    }
    return null;
  },

  // Add new expense
  async addExpense(expense: Omit<Expense, "id">): Promise<Expense> {
    const docRef = await addDoc(
      collection(db, EXPENSE_COLLECTION_NAME),
      expense,
    );
    return { id: docRef.id, ...expense };
  },

  // Update expense
  async updateExpense(
    id: string,
    expenseData: Partial<Expense>,
  ): Promise<void> {
    const docRef = doc(db, EXPENSE_COLLECTION_NAME, id);
    await updateDoc(docRef, expenseData);
  },

  // Delete expense
  async deleteExpense(id: string): Promise<void> {
    await deleteDoc(doc(db, EXPENSE_COLLECTION_NAME, id));
  },
};

export interface Investor {
  id: string;
  name: string;
  totalAmount: number;
  investments?: { amount: number; date: string }[];
}

const INVESTMENT_COLLECTION_NAME = "invest";

export const InvestService = {
  async getInvestors(): Promise<Investor[]> {
    const snapshot = await getDocs(collection(db, INVESTMENT_COLLECTION_NAME));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Investor,
    );
  },

  async getInvestor(id: string): Promise<Investor | null> {
    const docRef = doc(db, INVESTMENT_COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Investor;
    }
    return null;
  },

  async addInvestor(name: string, amount: number): Promise<Investor> {
    const newInvestor = {
      name,
      totalAmount: amount,
      investments: [{ amount, date: new Date().toISOString() }],
    };
    const docRef = await addDoc(
      collection(db, INVESTMENT_COLLECTION_NAME),
      newInvestor,
    );
    return { id: docRef.id, ...newInvestor };
  },

  async addInvestment(id: string, amount: number): Promise<void> {
    const docRef = doc(db, INVESTMENT_COLLECTION_NAME, id);
    const investor = await InvestService.getInvestor(id);
    if (!investor) return;

    const updatedInvestments = [
      ...(investor.investments || []),
      { amount, date: new Date().toISOString() },
    ];
    const newTotal = investor.totalAmount + amount;

    await updateDoc(docRef, {
      investments: updatedInvestments,
      totalAmount: newTotal,
    });
  },

  async deleteInvestor(id: string): Promise<void> {
    await deleteDoc(doc(db, INVESTMENT_COLLECTION_NAME, id));
  },
};

// ----------------------
// Customer Interface
// ----------------------
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string; // ← New field added
  purchases: number;
  services: number;
  total: number;
}

const CUSTOMER_COLLECTION_NAME = "customers";

export const CustomerService = {
  async getCustomers(): Promise<Customer[]> {
    const snapshot = await getDocs(collection(db, CUSTOMER_COLLECTION_NAME));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Customer,
    );
  },

  async getCustomer(id: string): Promise<Customer | null> {
    const docRef = doc(db, CUSTOMER_COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Customer;
    }
    return null;
  },

  async addCustomer(
    name: string,
    phone: string,
    email: string,
    address: string = "", // ← Added address parameter with default empty string
    totalSpent = 0,
    totalQuantity = 0,
  ): Promise<Customer> {
    const newCustomer: Omit<Customer, "id"> = {
      name,
      phone,
      email,
      address, // ← Include address
      total: totalSpent, // total money spent
      purchases: totalQuantity, // total quantity bought
      services: 0, // default 0
    };

    const docRef = await addDoc(
      collection(db, CUSTOMER_COLLECTION_NAME),
      newCustomer,
    );

    return { id: docRef.id, ...newCustomer };
  },

  async addPurchase(
    id: string,
    quantity: number,
    amount: number,
  ): Promise<void> {
    const docRef = doc(db, CUSTOMER_COLLECTION_NAME, id);
    const customer = await CustomerService.getCustomer(id);
    if (!customer) return;

    const updatedPurchases = (customer.purchases || 0) + quantity;
    const updatedTotal = (customer.total || 0) + amount;

    await updateDoc(docRef, {
      purchases: updatedPurchases,
      total: updatedTotal,
    });
  },

  async addService(id: string, amount: number): Promise<void> {
    const docRef = doc(db, CUSTOMER_COLLECTION_NAME, id);
    const customer = await CustomerService.getCustomer(id);
    if (!customer) return;

    const updatedServices = customer.services + 1;
    const updatedTotal = customer.total + amount;

    await updateDoc(docRef, {
      services: updatedServices,
      total: updatedTotal,
    });
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
    const docRef = doc(db, CUSTOMER_COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  async deleteCustomer(id: string): Promise<void> {
    await deleteDoc(doc(db, CUSTOMER_COLLECTION_NAME, id));
  },

  // Add method to get services by customer phone number
  async getServicesByPhoneNumber(phoneNumber: string): Promise<Service[]> {
    const q = query(
      collection(db, SERVICE_NAME),
      where("phoneNumber", "==", phoneNumber),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Service,
    );
  },

  // Add method to get services by customer ID
  async getServicesByCustomerId(customerId: string): Promise<Service[]> {
    const q = query(
      collection(db, SERVICE_NAME),
      where("customerId", "==", customerId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Service,
    );
  },
};

// ---------------------
// INVOICE SERVICE
// ---------------------

const INVOICES_COLLECTION = "invoices";

export interface StoredInvoice {
  id?: string;
  saleId: string; // Reference to sale document
  orderId: string;
  html: string; // Full HTML string
  pdfUrl?: string; // Optional: if you upload PDF to storage later
  generatedAt: string; // ISO timestamp
}

export const InvoiceFirestoreService = {
  async saveInvoice(sale: SaleData, html: string): Promise<StoredInvoice> {
    if (!sale.id) throw new Error("sale.id is missing");

    const payload: Omit<StoredInvoice, "id"> = {
      saleId: sale.id,
      orderId: sale.orderId,
      html,
      generatedAt: new Date().toISOString(),
    };

    const ref = await addDoc(collection(db, INVOICES_COLLECTION), payload);
    return { id: ref.id, ...payload };
  },

  async getInvoiceBySaleId(saleId: string): Promise<StoredInvoice | null> {
    const q = query(
      collection(db, INVOICES_COLLECTION),
      where("saleId", "==", saleId),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as StoredInvoice;
  },

  async getInvoiceByOrderId(orderId: string): Promise<StoredInvoice | null> {
    const q = query(
      collection(db, INVOICES_COLLECTION),
      where("orderId", "==", orderId),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as StoredInvoice;
  },

  async getAllInvoices(): Promise<StoredInvoice[]> {
    const snapshot = await getDocs(collection(db, INVOICES_COLLECTION));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as StoredInvoice,
    );
  },
};

// ---------------------
// SETTINGS SERVICE
// ---------------------

const SETTINGS_COLLECTION = "settings";

export interface SettingData {
  id?: string;
  logo: string; // URL of logo
  name: string;
  phone: string;
  address: string;
  email: string;
  fbPage: string; // Facebook page link
}

export const SettingsService = {
  // Get all settings (usually only 1 entry)
  async getSettings(): Promise<SettingData[]> {
    const snapshot = await getDocs(collection(db, SETTINGS_COLLECTION));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as SettingData,
    );
  },

  // Get single settings document by ID
  async getSetting(id: string): Promise<SettingData | null> {
    const docRef = doc(db, SETTINGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as SettingData;
    }
    return null;
  },

  // Add settings (only once for most stores)
  async addSetting(setting: Omit<SettingData, "id">): Promise<SettingData> {
    const docRef = await addDoc(collection(db, SETTINGS_COLLECTION), setting);
    return { id: docRef.id, ...setting };
  },

  // Update settings
  async updateSetting(
    id: string,
    settingsData: Partial<SettingData>,
  ): Promise<void> {
    const docRef = doc(db, SETTINGS_COLLECTION, id);
    await updateDoc(docRef, settingsData);
  },

  // Delete settings (not recommended unless replacing)
  async deleteSetting(id: string): Promise<void> {
    await deleteDoc(doc(db, SETTINGS_COLLECTION, id));
  },
};

export interface PreOrder {
  id: string;
  customerName: string;
  customerNumber: string;
  orderItem: string;
  price: number;
  preTakenPrice: number;
  note?: string;
  status?: string;
  createdAt?: string;
}

// ---------------------
// PRE-ORDER SERVICE
// ---------------------
const PRE_ORDERS_COLLECTION = "preOrders";

export const PreOrderService = {
  async getPreOrders(): Promise<PreOrder[]> {
    const snapshot = await getDocs(collection(db, PRE_ORDERS_COLLECTION));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as PreOrder,
    );
  },

  async getPreOrder(id: string): Promise<PreOrder | null> {
    const docRef = doc(db, PRE_ORDERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as PreOrder;
    }
    return null;
  },

  async addPreOrder(preOrder: Omit<PreOrder, "id">): Promise<PreOrder> {
    const docRef = await addDoc(collection(db, PRE_ORDERS_COLLECTION), {
      ...preOrder,
      createdAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...preOrder };
  },

  async updatePreOrder(
    id: string,
    preOrderData: Partial<PreOrder>,
  ): Promise<void> {
    const docRef = doc(db, PRE_ORDERS_COLLECTION, id);
    await updateDoc(docRef, preOrderData);
  },

  async deletePreOrder(id: string): Promise<void> {
    await deleteDoc(doc(db, PRE_ORDERS_COLLECTION, id));
  },
};

// ---------------------
// PRODUCT COST TRACKING (Simple Version)
// ---------------------

export interface ProductCost {
  id?: string; // Firestore document ID (auto-generated)
  productName: string; // Name of the product
  productId?: string; // Optional: link to your existing product (from "products" collection)
  costPrice: number; // Price paid per unit
  quantity: number; // How many were bought
  totalCost?: number; // Optional: costPrice * quantity (we'll calculate on add)
  supplier: string; // Supplier name
  purchaseDate: Date; // Simple JavaScript Date (Firestore handles conversion)
  notes?: string; // Optional extra notes
}

const COST_COLLECTION_NAME = "productCosts";

export const ProductCostService = {
  // Get all purchase records (no sorting to keep it simple)
  async getAllProductCosts(): Promise<ProductCost[]> {
    const snapshot = await getDocs(collection(db, COST_COLLECTION_NAME));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as ProductCost,
    );
  },

  // Get one record by ID
  async getProductCost(id: string): Promise<ProductCost | null> {
    const docRef = doc(db, COST_COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ProductCost;
    }
    return null;
  },

  // Add a new purchase record
  async addProductCost(
    costData: Omit<ProductCost, "id">,
  ): Promise<ProductCost> {
    // Auto-calculate total cost
    const dataToSave = {
      ...costData,
      totalCost: costData.costPrice * costData.quantity,
    };

    const docRef = await addDoc(
      collection(db, COST_COLLECTION_NAME),
      dataToSave,
    );
    return { id: docRef.id, ...dataToSave };
  },

  // Update a record
  async updateProductCost(
    id: string,
    costData: Partial<ProductCost>,
  ): Promise<void> {
    const docRef = doc(db, COST_COLLECTION_NAME, id);

    // If price or quantity changes, recalculate totalCost
    const updatedData = { ...costData };
    if (costData.costPrice !== undefined || costData.quantity !== undefined) {
      const current = await this.getProductCost(id);
      if (current) {
        const newPrice = costData.costPrice ?? current.costPrice;
        const newQty = costData.quantity ?? current.quantity;
        updatedData.totalCost = newPrice * newQty;
      }
    }

    await updateDoc(docRef, updatedData);
  },

  // Delete a record
  async deleteProductCost(id: string): Promise<void> {
    await deleteDoc(doc(db, COST_COLLECTION_NAME, id));
  },

  // Filter by supplier
  async getProductCostsBySupplier(supplier: string): Promise<ProductCost[]> {
    const q = query(
      collection(db, COST_COLLECTION_NAME),
      where("supplier", "==", supplier),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as ProductCost,
    );
  },

  // Simple search by product name (exact match only - keeps it simple)
  async getProductCostsByProductName(
    productName: string,
  ): Promise<ProductCost[]> {
    const q = query(
      collection(db, COST_COLLECTION_NAME),
      where("productName", "==", productName),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as ProductCost,
    );
  },
};

export interface AskedProduct {
  id?: string;
  productName: string;
  description: string;
  status: "pending" | "ordered" | "received" | "cancelled";
  dateRequested: Date | Timestamp | string;
  dateResolved?: Date | Timestamp | string | null;
  notes?: string;
  requestedBy?: string;
  // priority field REMOVED completely
}

const ASKED_COLLECTION_NAME = "askedFor";

export const AskedProductService = {
  async getAskedProducts(): Promise<AskedProduct[]> {
    const snapshot = await getDocs(collection(db, ASKED_COLLECTION_NAME));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as AskedProduct,
    );
  },

  async getAskedProduct(id: string): Promise<AskedProduct | null> {
    const docRef = doc(db, ASKED_COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AskedProduct;
    }
    return null;
  },

  async addAskedProduct(
    askedProduct: Omit<AskedProduct, "id">,
  ): Promise<AskedProduct> {
    const docRef = await addDoc(
      collection(db, ASKED_COLLECTION_NAME),
      askedProduct,
    );
    return { id: docRef.id, ...askedProduct };
  },

  async updateAskedProduct(
    id: string,
    askedProductData: Partial<AskedProduct>,
  ): Promise<void> {
    const docRef = doc(db, ASKED_COLLECTION_NAME, id);
    await updateDoc(docRef, askedProductData);
  },

  async deleteAskedProduct(id: string): Promise<void> {
    await deleteDoc(doc(db, ASKED_COLLECTION_NAME, id));
  },
};

export type MarketingType = "person" | "shop";

export interface MarketingEntry {
  id?: string;

  type: MarketingType; // person | shop

  name: string;
  address?: string;
  phone?: string;

  // Person-specific
  interestedProduct?: string;

  // Shop-specific
  products?: string[]; // multiple products
  productSource?: string; // where they buy from (distributor / brand / local market)

  notes?: string;

  collectedBy?: string; // marketing staff name / uid
  createdAt: Date | Timestamp | string;
}

const MARKETING_COLLECTION = "marketing";

export const MarketingService = {
  async getAll(): Promise<MarketingEntry[]> {
    const snapshot = await getDocs(collection(db, MARKETING_COLLECTION));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as MarketingEntry,
    );
  },

  async getById(id: string): Promise<MarketingEntry | null> {
    const ref = doc(db, MARKETING_COLLECTION, id);
    const snap = await getDoc(ref);
    return snap.exists()
      ? ({ id: snap.id, ...snap.data() } as MarketingEntry)
      : null;
  },

  async create(data: Omit<MarketingEntry, "id">) {
    // Remove fields that are undefined (Firestore doesn't allow them)
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );

    const ref = await addDoc(collection(db, MARKETING_COLLECTION), {
      ...cleanData,
      createdAt: Timestamp.now(),
    });

    return { id: ref.id, ...cleanData };
  },

  async update(id: string, data: Partial<MarketingEntry>) {
    await updateDoc(doc(db, MARKETING_COLLECTION, id), data);
  },

  async remove(id: string) {
    await deleteDoc(doc(db, MARKETING_COLLECTION, id));
  },
};

const BANK_STATEMENT_COLLECTION = "bankStatements";

export const BankStatementService = {
  // ---------------------
  // GET ALL STATEMENTS
  // ---------------------
  async getStatements(): Promise<BankStatement[]> {
    const snapshot = await getDocs(collection(db, BANK_STATEMENT_COLLECTION));
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as BankStatement,
    );
  },

  // ---------------------
  // GET SINGLE STATEMENT
  // ---------------------
  async getStatement(id: string): Promise<BankStatement | null> {
    const docRef = doc(db, BANK_STATEMENT_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BankStatement;
    }
    return null;
  },

  // ---------------------
  // ADD DEPOSIT
  // ---------------------
  async addDeposit(data: {
    amount: number;
    source: string;
    person: string;
    relatedTo: string;
    date: Date; // 👈 new
    note?: string;
  }): Promise<BankStatement> {
    const newStatement = {
      type: "deposit",
      amount: data.amount,
      sourceOrDestination: data.source,
      person: data.person,
      relatedTo: data.relatedTo,
      note: data.note || "",
      date: Timestamp.fromDate(data.date), // 🔥 added
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, BANK_STATEMENT_COLLECTION),
      newStatement,
    );

    return { id: docRef.id, ...newStatement } as BankStatement;
  },

  // ---------------------
  // ADD CASH OUT
  // ---------------------
  async addCashOut(data: {
    amount: number;
    destination: string;
    person: string;
    relatedTo: string;
    date: Date; // 👈 new
    note?: string;
  }): Promise<BankStatement> {
    const newStatement = {
      type: "cashout",
      amount: data.amount,
      sourceOrDestination: data.destination,
      person: data.person,
      relatedTo: data.relatedTo,
      note: data.note || "",
      date: Timestamp.fromDate(data.date), // 🔥 added
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, BANK_STATEMENT_COLLECTION),
      newStatement,
    );

    return { id: docRef.id, ...newStatement } as BankStatement;
  },

  // ---------------------
  // ADD PRODUCT BUY
  // ---------------------
  async addProductBuy(data: {
    amount: number;
    supplier: string;
    person: string; // who handled purchase
    relatedTo: string; // product name / invoice no
    date: Date;
    note?: string;
  }): Promise<BankStatement> {
    const newStatement = {
      type: "productBuy",
      amount: data.amount,
      sourceOrDestination: data.supplier,
      person: data.person,
      relatedTo: data.relatedTo,
      note: data.note || "",
      date: Timestamp.fromDate(data.date),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, BANK_STATEMENT_COLLECTION),
      newStatement,
    );

    return { id: docRef.id, ...newStatement } as BankStatement;
  },

  // ---------------------
  // UPDATE STATEMENT
  // ---------------------
  async updateStatement(
    id: string,
    data: Partial<BankStatement>,
  ): Promise<void> {
    const docRef = doc(db, BANK_STATEMENT_COLLECTION, id);
    await updateDoc(docRef, data);
  },

  // ---------------------
  // DELETE STATEMENT
  // ---------------------
  async deleteStatement(id: string): Promise<void> {
    await deleteDoc(doc(db, BANK_STATEMENT_COLLECTION, id));
  },

  // ---------------------
  // GET BY TYPE (deposit / cashout)
  // ---------------------
  async getStatementsByType(
    type: "deposit" | "cashout" | "productBuy",
  ): Promise<BankStatement[]> {
    const q = query(
      collection(db, BANK_STATEMENT_COLLECTION),
      where("type", "==", type),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as BankStatement,
    );
  },
};

const PRODUCT_UNIT_COLLECTION = "product_units";

export const ProductUnitService = {
  async addProductUnit(unit: Omit<ProductUnit, "id">): Promise<ProductUnit> {
    const docRef = await addDoc(collection(db, PRODUCT_UNIT_COLLECTION), unit);

    return {
      id: docRef.id,
      ...unit,
    };
  },

  async addMultipleUnits(
    productId: string,
    serialNumbers: string[],
    extra?: {
      warranty?: Date | null;
      wholeseller?: string | null;
    },
  ): Promise<void> {
    const batch = writeBatch(db);

    serialNumbers.forEach((serial) => {
      const docRef = doc(collection(db, PRODUCT_UNIT_COLLECTION));

      batch.set(docRef, {
        productId,
        serialNumber: serial,
        status: "in_stock",

        // ✅ clean direct fields
        warranty: extra?.warranty ?? null,
        wholeseller: extra?.wholeseller || null,

        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
  },

  async updateUnitSerial(id: string, serialNumber: string): Promise<void> {
    const ref = doc(db, PRODUCT_UNIT_COLLECTION, id);

    await updateDoc(ref, {
      serialNumber,
    });
  },

  async deleteUnit(id: string): Promise<void> {
    const ref = doc(db, PRODUCT_UNIT_COLLECTION, id);

    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();

    if (data.status === "sold") {
      throw new Error("Cannot delete sold unit");
    }

    await deleteDoc(ref);
  },

  async getUnitsByProduct(productId: string): Promise<ProductUnit[]> {
    console.log("[Units Lookup] Requested productId:", productId);

    // First, run the normal query.
    const q = query(
      collection(db, PRODUCT_UNIT_COLLECTION),
      where("productId", "==", productId),
    );

    const snapshot = await getDocs(q);

    console.log("[Units Lookup] Matching units:", snapshot.size);

    if (!snapshot.empty) {
      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as ProductUnit,
      );
    }

    // TEMPORARY DEBUG: inspect the stored unit documents.
    const allUnitsSnapshot = await getDocs(
      collection(db, PRODUCT_UNIT_COLLECTION),
    );

    console.log(
      "[Units Lookup] All stored units:",
      allUnitsSnapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          productId: data.productId,
          serialNumber: data.serialNumber,
          status: data.status,
        };
      }),
    );

    return [];
  },

  async getAvailableUnit(productId: string): Promise<ProductUnit | null> {
    const q = query(
      collection(db, PRODUCT_UNIT_COLLECTION),
      where("productId", "==", productId),
      where("status", "==", "in_stock"),
      limit(1),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as ProductUnit;
  },

  async markUnitsAsSold(unitIds: string[]): Promise<void> {
    const batch = writeBatch(db);

    unitIds.forEach((id) => {
      const ref = doc(db, PRODUCT_UNIT_COLLECTION, id);
      batch.update(ref, {
        status: "sold",
        soldAt: serverTimestamp(),
      });
    });

    await batch.commit();
  },

  async getAvailableUnits(
    productId: string,
    qty: number,
  ): Promise<ProductUnit[]> {
    const q = query(
      collection(db, PRODUCT_UNIT_COLLECTION),
      where("productId", "==", productId),
      where("status", "==", "in_stock"),
      limit(qty),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as ProductUnit,
    );
  },

  async updateUnit(id: string, data: Partial<ProductUnit>): Promise<void> {
    const ref = doc(db, PRODUCT_UNIT_COLLECTION, id);
    await updateDoc(ref, data);
  },

  async getAllUnits(): Promise<ProductUnit[]> {
    const snapshot = await getDocs(collection(db, PRODUCT_UNIT_COLLECTION));

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as ProductUnit,
    );
  },
};

const TEMPERED_COLLECTION = "tempered_glass";

const generateSearchKeywords = (
  brandModels: { brand: string; models: string[] }[],
) => {
  const keywords: string[] = [];

  const addPrefixes = (text: string) => {
    const clean = text.toLowerCase();
    for (let i = 1; i <= clean.length; i++) {
      keywords.push(clean.slice(0, i)); // s, sa, sam, sams...
    }
  };

  brandModels.forEach((b) => {
    const brand = b.brand.toLowerCase();

    addPrefixes(brand);

    b.models.forEach((model) => {
      const m = model.toLowerCase();

      addPrefixes(m);

      keywords.push(`${brand}_${m}`);
    });
  });

  return [...new Set(keywords)]; // remove duplicates
};

// ---------------------
// SERVICE
// ---------------------
export const TemperedGlassService = {
  // ---------------------
  // CREATE
  // ---------------------
  async create(
    data: Omit<
      TemperedGlass,
      "id" | "createdAt" | "updatedAt" | "searchKeywords"
    >,
  ) {
    const searchKeywords = generateSearchKeywords(data.brandModels);

    const newItem = {
      ...data,
      searchKeywords,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, TEMPERED_COLLECTION), newItem);

    return { id: docRef.id, ...newItem };
  },

  // ---------------------
  // GET ALL
  // ---------------------
  async getAll(): Promise<TemperedGlass[]> {
    const snapshot = await getDocs(collection(db, TEMPERED_COLLECTION));

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as TemperedGlass,
    );
  },

  // ---------------------
  // GET SINGLE
  // ---------------------
  async getById(id: string): Promise<TemperedGlass | null> {
    const ref = doc(db, TEMPERED_COLLECTION, id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return { id: snap.id, ...snap.data() } as TemperedGlass;
  },

  // ---------------------
  // UPDATE
  // ---------------------
  async update(id: string, data: Partial<TemperedGlass>) {
    const ref = doc(db, TEMPERED_COLLECTION, id);

    const updatedData: any = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // 🔥 regenerate keywords if brandModels changed
    if (data.brandModels) {
      updatedData.searchKeywords = generateSearchKeywords(data.brandModels);
    }

    await updateDoc(ref, updatedData);
  },

  // ---------------------
  // DELETE
  // ---------------------
  async delete(id: string) {
    await deleteDoc(doc(db, TEMPERED_COLLECTION, id));
  },

  // ---------------------
  // STOCK CONTROL
  // ---------------------
  async increaseStock(id: string, quantity: number) {
    const ref = doc(db, TEMPERED_COLLECTION, id);

    await updateDoc(ref, {
      quantity: increment(quantity),
      updatedAt: serverTimestamp(),
    });
  },

  async reduceStock(id: string, quantity: number) {
    const ref = doc(db, TEMPERED_COLLECTION, id);
    await updateDoc(ref, {
      quantity: increment(-quantity),
      updatedAt: serverTimestamp(),
    });
  },

  // ---------------------
  // 🔍 SEARCH (FAST 🔥)
  // ---------------------
  async search(params: { brand?: string; model?: string }) {
    const { brand, model } = params;

    let keyword = "";

    if (brand && model) {
      keyword = `${brand}_${model}`.toLowerCase();
    } else if (model) {
      keyword = model.toLowerCase();
    } else if (brand) {
      keyword = brand.toLowerCase();
    } else {
      return [];
    }

    const q = query(
      collection(db, TEMPERED_COLLECTION),
      where("searchKeywords", "array-contains", keyword),
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as TemperedGlass,
    );
  },
};
