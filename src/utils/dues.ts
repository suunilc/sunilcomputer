import { Customer, Sale } from '../types';

/**
 * Normalizes phone number strings for robust matching
 */
function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Checks if a sale belongs to a customer
 */
export function isSaleOfCustomer(sale: Sale, customer: Customer): boolean {
  if (sale.customerId && sale.customerId === customer.id) return true;
  
  const custPhoneNorm = normalizePhone(customer.phone);
  const salePhoneNorm = normalizePhone(sale.customerPhone);
  if (custPhoneNorm && salePhoneNorm && custPhoneNorm.length >= 7 && custPhoneNorm === salePhoneNorm) {
    return true;
  }
  
  return false;
}

/**
 * Returns all active unpaid sales for a customer (excluding ones already merged/carried forward into a new invoice)
 */
export function getUnpaidCustomerSales(customer: Customer, sales: Sale[]): Sale[] {
  return sales.filter((s) => {
    if (!isSaleOfCustomer(s, customer)) return false;
    // If this invoice was already merged into a newer invoice, it has been carried forward
    if (s.mergedIntoInvoiceNo) return false;
    return (s.dueAmount || 0) > 0;
  });
}

/**
 * Calculates the exact real-time outstanding due balance for a customer
 */
export function getCustomerLiveDue(customer: Customer | undefined | null, sales: Sale[]): number {
  if (!customer) return 0;

  const customerSales = sales.filter((s) => isSaleOfCustomer(s, customer));

  if (customerSales.length > 0) {
    const unpaidSales = getUnpaidCustomerSales(customer, sales);
    const salesDueSum = unpaidSales.reduce((acc, s) => acc + (s.dueAmount || 0), 0);
    return Math.max(0, Math.round(salesDueSum));
  }

  // If customer has no recorded sales in history, fallback to customer.totalDue
  return Math.max(0, Math.round(customer.totalDue || 0));
}

/**
 * Calculates total purchases (excluding pure dues clearance receipts) for a customer
 */
export function getCustomerLivePurchases(customer: Customer, sales: Sale[]): number {
  const customerSales = sales.filter((s) => isSaleOfCustomer(s, customer));
  if (customerSales.length > 0) {
    const regularSales = customerSales.filter((s) => s.saleType !== 'Dues Clearance');
    return regularSales.reduce((acc, s) => acc + s.grandTotal, 0);
  }
  return customer.totalPurchases || 0;
}

/**
 * Calculates total payments made by a customer across all invoices
 */
export function getCustomerLivePaid(customer: Customer, sales: Sale[]): number {
  const customerSales = sales.filter((s) => isSaleOfCustomer(s, customer));
  if (customerSales.length > 0) {
    return customerSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
  }
  return customer.totalPaid || 0;
}

/**
 * Computes updated customer record with live sales statistics
 */
export function computeCustomerStats(customer: Customer, sales: Sale[]): Customer {
  const totalPurchases = getCustomerLivePurchases(customer, sales);
  const totalPaid = getCustomerLivePaid(customer, sales);
  const totalDue = getCustomerLiveDue(customer, sales);

  return {
    ...customer,
    totalPurchases,
    totalPaid,
    totalDue,
  };
}

/**
 * Recalculates all customers stats across the full sales collection
 */
export function syncAllCustomerStats(customers: Customer[], sales: Sale[]): Customer[] {
  return customers.map((c) => computeCustomerStats(c, sales));
}
