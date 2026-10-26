/* services/invoiceServiceTypes.ts */
export interface ProductItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceData {
  customerName: string;
  phoneNumber: string;
  paymentType: string;
  discount: number;
  serviceCharge: number;
  products: Array<{
    serialNumbers?: string[];
    warranty?: string;
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  total: number;
  date: string;
  orderId: string;
  paidAmount?: number; // Add this
  dueAmount?: number; // Add this
  paymentStatus?: "paid" | "partial" | "unpaid"; // Add this
}
