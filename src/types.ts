export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export type ProductCategory =
  | 'Computer Accessories'
  | 'Laptop/Desktop'
  | 'Printer & Parts'
  | 'Computer Service Items'
  | 'Photo Printing Materials'
  | 'Frame Materials'
  | 'Training Course Materials'
  | 'Other Products';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Computer Accessories',
  'Laptop/Desktop',
  'Printer & Parts',
  'Computer Service Items',
  'Photo Printing Materials',
  'Frame Materials',
  'Training Course Materials',
  'Other Products',
];

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  brand: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockAlert: number;
  unit: string; // e.g., Pcs, Box, Set, Meter, Sq. Ft., Course
  supplierId?: string;
  supplierName?: string;
  imageUrl?: string;
  dateAdded: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  address: string;
  totalPurchased: number;
  dueAmount: number;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  purchaseRate: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  purchaseInvoiceNo: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Due';
  paymentMethod: 'Cash' | 'Card' | 'Online (eSewa/Khalti)' | 'Bank Transfer';
  notes?: string;
}

export type SaleType =
  | 'Computer Sale'
  | 'Accessories'
  | 'Photo Printing'
  | 'Frame Order'
  | 'Service Charge'
  | 'Course Fee'
  | 'Dues Clearance';

export interface SaleItem {
  productId: string;
  productName: string;
  sku?: string;
  qty: number;
  sellingRate: number;
  purchaseRate: number;
  subtotal: number;
  discount: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  saleType: SaleType;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Due';
  paymentMethod: 'Cash' | 'Card' | 'Online (eSewa/Khalti)' | 'Bank Transfer';
  notes?: string;
  createdBy: string;
  previousDueAdded?: number;
  mergedIntoInvoiceNo?: string;
}

export type CustomerType = 'Regular' | 'Student' | 'Photo Client' | 'Wholesale' | 'Walk-in';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  customerType: CustomerType;
  totalPurchases: number;
  totalPaid: number;
  totalDue: number;
  createdAt?: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Internet'
  | 'Salary'
  | 'Maintenance'
  | 'Materials Purchase'
  | 'Other Expenses';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Rent',
  'Electricity',
  'Internet',
  'Salary',
  'Maintenance',
  'Materials Purchase',
  'Other Expenses',
];

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string;
  paymentMethod: 'Cash' | 'Card' | 'Online (eSewa/Khalti)' | 'Bank Transfer';
  referenceNo?: string;
}

export type TimeFilter =
  | 'today'
  | 'yesterday'
  | 'week'
  | 'month'
  | 'year'
  | 'all'
  | 'custom';

export interface CustomDateRange {
  from: string;
  to: string;
}

export interface BusinessInfo {
  name: string;
  location: string;
  founder: string;
  contact: string;
  email?: string;
  logoUrl?: string;
  showLogoOnInvoice?: boolean;
  showLogoInHeader?: boolean;
  panVatNo?: string;
  invoiceNotice?: string;
}

export interface AppState {
  currentUser: User | null;
  businessInfo: BusinessInfo;
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  sales: Sale[];
  customers: Customer[];
  expenses: Expense[];
  users: User[];
}
