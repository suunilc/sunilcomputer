import * as XLSX from 'xlsx';
import { Customer, Sale } from '../types';
import { getCustomerLiveDue, getCustomerLivePaid, getCustomerLivePurchases } from './dues';

/**
 * Export Sales Report to Excel (.xlsx)
 */
export function exportSalesReportToExcel(sales: Sale[], filename: string = 'Sales_Report') {
  const headers = [
    'Invoice No',
    'Date',
    'Customer Name',
    'Phone',
    'Sale Type',
    'Total Amount (NPR)',
    'Paid Amount (NPR)',
    'Due Amount (NPR)',
    'Payment Method',
    'Payment Status',
    'Items Summary',
  ];

  const rows = sales.map((s) => {
    const itemsSummary = s.items.map((i) => `${i.productName} (x${i.qty})`).join('; ');
    return [
      s.invoiceNo,
      s.date,
      s.customerName,
      s.customerPhone || '',
      s.saleType,
      s.grandTotal,
      s.paidAmount,
      s.dueAmount,
      s.paymentMethod,
      s.paymentStatus,
      itemsSummary,
    ];
  });

  // Calculate Totals
  const totalGrand = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalPaid = sales.reduce((acc, s) => acc + s.paidAmount, 0);
  const totalDue = sales.reduce((acc, s) => acc + s.dueAmount, 0);

  // Append Summary Row
  rows.push([
    'TOTALS',
    '',
    '',
    '',
    `${sales.length} Bills`,
    totalGrand,
    totalPaid,
    totalDue,
    '',
    '',
    '',
  ]);

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for clean readability
  worksheet['!cols'] = [
    { wch: 15 }, // Invoice No
    { wch: 14 }, // Date
    { wch: 24 }, // Customer Name
    { wch: 15 }, // Phone
    { wch: 16 }, // Sale Type
    { wch: 18 }, // Total Amount
    { wch: 18 }, // Paid Amount
    { wch: 18 }, // Due Amount
    { wch: 22 }, // Payment Method
    { wch: 15 }, // Payment Status
    { wch: 40 }, // Items Summary
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export Customer Dues Report to Excel (.xlsx)
 * Only includes customers who have active outstanding dues (removes settled accounts)
 */
export function exportDuesReportToExcel(
  customers: Customer[],
  sales: Sale[],
  filename: string = 'Customer_Dues_Report',
  onlyWithDues: boolean = true
) {
  const headers = [
    'Customer Name',
    'Phone Number',
    'Address',
    'Customer Type',
    'Total Purchases (NPR)',
    'Total Paid (NPR)',
    'Outstanding Due Balance (NPR)',
    'Status',
  ];

  // If onlyWithDues is true, filter out settled customers (due === 0)
  const targetCustomers = onlyWithDues
    ? customers.filter((c) => getCustomerLiveDue(c, sales) > 0)
    : customers;

  const rows = targetCustomers.map((c) => {
    const totalSpent = getCustomerLivePurchases(c, sales);
    const totalPaid = getCustomerLivePaid(c, sales);
    const dueAmount = getCustomerLiveDue(c, sales);
    const status = dueAmount > 0 ? 'DUE OUTSTANDING' : 'CLEAR / SETTLED';

    return [
      c.name,
      c.phone || 'N/A',
      c.address || 'N/A',
      c.customerType,
      totalSpent,
      totalPaid,
      dueAmount,
      status,
    ];
  });

  // Calculate Totals
  const totalPurchases = rows.reduce((acc, r) => acc + Number(r[4] || 0), 0);
  const totalPaidSum = rows.reduce((acc, r) => acc + Number(r[5] || 0), 0);
  const totalDueSum = rows.reduce((acc, r) => acc + Number(r[6] || 0), 0);

  rows.push([
    'TOTAL OUTSTANDING DUES',
    '',
    '',
    `${targetCustomers.length} Customers`,
    totalPurchases,
    totalPaidSum,
    totalDueSum,
    '',
  ]);

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  worksheet['!cols'] = [
    { wch: 26 }, // Customer Name
    { wch: 16 }, // Phone
    { wch: 28 }, // Address
    { wch: 16 }, // Customer Type
    { wch: 22 }, // Total Purchases
    { wch: 20 }, // Total Paid
    { wch: 28 }, // Outstanding Due
    { wch: 18 }, // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dues Ledger Report');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
