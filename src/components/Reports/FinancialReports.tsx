import React, { useState } from 'react';
import { AppState, CustomDateRange, Expense, Sale, TimeFilter } from '../../types';
import { exportToCSV, filterByDateRange, formatCurrency, formatDate } from '../../utils/formatters';
import { exportDuesReportToExcel, exportSalesReportToExcel } from '../../utils/excelExport';
import { getCustomerLiveDue, getCustomerLivePaid, getCustomerLivePurchases, getUnpaidCustomerSales } from '../../utils/dues';
import {
  LineChart,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  FileText,
  BarChart2,
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
} from 'lucide-react';

interface FinancialReportsProps {
  state: AppState;
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({ state }) => {
  const [reportType, setReportType] = useState<
    'pnl' | 'sales' | 'expenses' | 'stock' | 'customers'
  >('pnl');

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [customRange, setCustomRange] = useState<CustomDateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  // Customer Ledger Search and Filter States
  const [customerSearch, setCustomerSearch] = useState('');
  const [duesOnlyFilter, setDuesOnlyFilter] = useState(true);

  // Filter Data according to time filter
  const filteredSales = filterByDateRange<Sale>(state.sales, timeFilter, customRange);
  const filteredExpenses = filterByDateRange<Expense>(state.expenses, timeFilter, customRange);

  // Math Calculations
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);

  const totalCOGS = filteredSales.reduce((acc, s) => {
    return (
      acc +
      s.items.reduce((itemAcc, item) => itemAcc + item.purchaseRate * item.qty, 0)
    );
  }, 0);

  const grossProfit = totalRevenue - totalCOGS;
  const totalOperatingExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  
  // Formula: Net Profit = Total Revenue - Total Expense
  const netProfit = totalRevenue - totalOperatingExpenses;

  // Stock valuation calculations
  const totalStockItemsCount = state.products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const stockValuationCost = state.products.reduce((acc, p) => acc + p.stockQuantity * p.purchasePrice, 0);
  const stockValuationRetail = state.products.reduce((acc, p) => acc + p.stockQuantity * p.sellingPrice, 0);
  const potentialStockProfit = stockValuationRetail - stockValuationCost;

  // Customer Dues Ledger Calculations
  const customersLedgerData = state.customers.map((c) => {
    const liveDue = getCustomerLiveDue(c, state.sales);
    const livePurchases = getCustomerLivePurchases(c, state.sales);
    const livePaid = getCustomerLivePaid(c, state.sales);
    const unpaidSales = getUnpaidCustomerSales(c, state.sales);
    return {
      customer: c,
      due: liveDue,
      purchases: livePurchases,
      paid: livePaid,
      unpaidSales,
    };
  });

  const totalOutstandingDuesAll = customersLedgerData.reduce((acc, item) => acc + item.due, 0);
  const totalCustomersWithDuesCount = customersLedgerData.filter((item) => item.due > 0).length;

  const filteredCustomerLedger = customersLedgerData.filter((item) => {
    // Dues only toggle
    if (duesOnlyFilter && item.due <= 0) return false;

    // Search query match
    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase().trim();
      const matchName = item.customer.name.toLowerCase().includes(q);
      const matchPhone = (item.customer.phone || '').includes(q);
      const matchAddress = (item.customer.address || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchAddress;
    }

    return true;
  });

  // Export current report to Excel
  const handleExportExcel = () => {
    const filename = `Report_${reportType.toUpperCase()}_${timeFilter}`;

    if (reportType === 'sales') {
      exportSalesReportToExcel(filteredSales, filename);
    } else if (reportType === 'customers') {
      exportDuesReportToExcel(state.customers, state.sales, filename, duesOnlyFilter);
    } else {
      if (reportType === 'pnl') {
        exportSalesReportToExcel(filteredSales, filename);
      } else {
        exportSalesReportToExcel(filteredSales, filename);
      }
    }
  };

  // Export current report CSV
  const handleExport = () => {
    const filename = `Report_${reportType.toUpperCase()}_${timeFilter}`;

    if (reportType === 'pnl') {
      const headers = ['Financial Metric', 'Amount (NPR)'];
      const rows = [
        ['Total Sales Revenue', totalRevenue],
        ['Cost of Goods Sold (COGS)', totalCOGS],
        ['Gross Profit', grossProfit],
        ['Total Operating Expenses', totalOperatingExpenses],
        ['Net Profit / Loss', netProfit],
      ];
      exportToCSV(filename, headers, rows);
    } else if (reportType === 'sales') {
      exportSalesReportToExcel(filteredSales, filename);
    } else if (reportType === 'customers') {
      const headers = [
        'Customer Name',
        'Phone Number',
        'Address',
        'Customer Type',
        'Total Purchases (NPR)',
        'Total Paid (NPR)',
        'Outstanding Due (NPR)',
        'Status',
      ];
      const rows = filteredCustomerLedger.map((item) => [
        item.customer.name,
        item.customer.phone || 'N/A',
        item.customer.address || 'Local',
        item.customer.customerType || 'Regular',
        item.purchases,
        item.paid,
        item.due,
        item.due > 0 ? 'DUE OUTSTANDING' : 'SETTLED / PAID',
      ]);
      exportToCSV(filename, headers, rows);
    } else if (reportType === 'expenses') {
      const headers = ['Ref No', 'Date', 'Category', 'Title', 'Amount', 'Payment Method'];
      const rows = filteredExpenses.map((e) => [
        e.referenceNo || 'EXP',
        e.date,
        e.category,
        e.title,
        e.amount,
        e.paymentMethod,
      ]);
      exportToCSV(filename, headers, rows);
    } else if (reportType === 'stock') {
      const headers = ['SKU', 'Product Name', 'Category', 'Stock Qty', 'Purchase Rate', 'Selling Rate', 'Valuation Cost', 'Valuation Retail'];
      const rows = state.products.map((p) => [
        p.sku,
        p.name,
        p.category,
        p.stockQuantity,
        p.purchasePrice,
        p.sellingPrice,
        p.stockQuantity * p.purchasePrice,
        p.stockQuantity * p.sellingPrice,
      ]);
      exportToCSV(filename, headers, rows);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-5 text-black">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-black flex items-center space-x-2">
            <LineChart className="w-6 h-6 text-black" />
            <span>Financial Reports & P&L Analytics</span>
          </h2>
          <p className="text-xs text-black font-bold mt-0.5">
            Automatic revenue, COGS, expense breakdown, and profit calculation system.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer border-2 border-black flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4 text-black" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5 border-2 border-black"
          >
            <FileSpreadsheet className="w-4 h-4 text-black" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer border-2 border-black flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4 text-black" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Time Period Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-black shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-black flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-black" />
            <span>Select Time Period:</span>
          </span>

          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['today', 'yesterday', 'week', 'month', 'year', 'all', 'custom'] as TimeFilter[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-colors cursor-pointer shrink-0 border-2 border-black ${
                  timeFilter === tf
                    ? 'bg-neutral-200 text-black shadow-xs ring-2 ring-black font-black'
                    : 'bg-white text-black hover:bg-neutral-100'
                }`}
              >
                {tf === 'custom' ? '📅 Custom Range' : tf}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Inputs if 'custom' selected */}
        {timeFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t-2 border-black">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-black">From Date:</span>
              <input
                type="date"
                value={customRange.from}
                onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                className="px-3 py-1.5 border-2 border-black rounded-xl text-xs font-black text-black"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-black">To Date:</span>
              <input
                type="date"
                value={customRange.to}
                onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                className="px-3 py-1.5 border-2 border-black rounded-xl text-xs font-black text-black"
              />
            </div>
          </div>
        )}
      </div>

      {/* Report Selection Tabs */}
      <div className="flex space-x-2 border-b-2 border-black pb-1 overflow-x-auto">
        {[
          { id: 'pnl', label: '📊 Profit & Loss Statement' },
          { id: 'sales', label: '🧾 Sales Report' },
          { id: 'expenses', label: '💸 Expense Report' },
          { id: 'stock', label: '📦 Stock Valuation Report' },
          { id: 'customers', label: '👥 Customer Dues Ledger' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-black rounded-t-xl transition-colors shrink-0 cursor-pointer border-t-2 border-l-2 border-r-2 border-black ${
              reportType === tab.id
                ? 'bg-neutral-200 text-black shadow-xs ring-2 ring-black font-black'
                : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Body Views */}
      {reportType === 'pnl' && (
        <div className="space-y-6">
          {/* Main Profit & Loss Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-black shadow-xs space-y-6">
            <div className="border-b-2 border-black pb-4">
              <h3 className="text-base font-black text-black">
                Profit & Loss Statement ({timeFilter.toUpperCase()})
              </h3>
              <p className="text-xs text-black font-bold">
                Formula: Net Profit = Total Revenue - Total Operating Expenses
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Income Side */}
              <div className="space-y-3 bg-neutral-50 p-4 rounded-xl border-2 border-black">
                <h4 className="font-black text-xs uppercase tracking-wider text-black">
                  Total Income / Revenue
                </h4>
                
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-black">
                  <span className="text-black font-bold">Gross Sales Income</span>
                  <span className="font-black text-black">{formatCurrency(totalRevenue)}</span>
                </div>

                <div className="flex justify-between items-center text-xs py-1.5 border-b border-black">
                  <span className="text-black font-bold">Cost of Goods Sold (COGS)</span>
                  <span className="font-black text-black">- {formatCurrency(totalCOGS)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-black pt-2 text-black">
                  <span>Gross Profit</span>
                  <span>{formatCurrency(grossProfit)}</span>
                </div>
              </div>

              {/* Expense Side */}
              <div className="space-y-3 bg-neutral-50 p-4 rounded-xl border-2 border-black">
                <h4 className="font-black text-xs uppercase tracking-wider text-black">
                  Operating Expenses
                </h4>
                
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-black">
                  <span className="text-black font-bold">Shop Expenses & Restocks</span>
                  <span className="font-black text-black">{formatCurrency(totalOperatingExpenses)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-black pt-2 text-black">
                  <span>Total Operating Expenses</span>
                  <span>{formatCurrency(totalOperatingExpenses)}</span>
                </div>
              </div>

            </div>

            {/* Net Result Box */}
            <div className="p-6 rounded-2xl border-2 border-black text-center text-black bg-white font-sans shadow-xs space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-black">
                Calculated Net Profit / Loss Result
              </p>
              <p className="text-3xl font-black mt-1 text-black">{formatCurrency(netProfit)}</p>
              <p className="text-xs text-black font-bold mt-1">
                {netProfit >= 0 ? 'Operating Profit' : 'Operating Loss'}
              </p>
            </div>
          </div>
        </div>
      )}

      {reportType === 'stock' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-black shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div className="p-4 bg-white rounded-xl border-2 border-black">
              <span className="text-xs text-black font-black uppercase">Stock Valuation (Cost Rate)</span>
              <p className="text-xl font-black text-black mt-1">{formatCurrency(stockValuationCost)}</p>
            </div>

            <div className="p-4 bg-white rounded-xl border-2 border-black">
              <span className="text-xs text-black font-black uppercase">Stock Valuation (Retail Value)</span>
              <p className="text-xl font-black text-black mt-1">{formatCurrency(stockValuationRetail)}</p>
            </div>

            <div className="p-4 bg-white rounded-xl border-2 border-black">
              <span className="text-xs text-black font-black uppercase">Potential Margin</span>
              <p className="text-xl font-black text-black mt-1">+{formatCurrency(potentialStockProfit)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-100 text-black uppercase font-black text-[11px] border-b-2 border-black">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">In Stock</th>
                  <th className="py-2.5 px-3 text-right">Purchase Price</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3 text-right">Total Stock Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {state.products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-100 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-black text-black">{p.sku}</td>
                    <td className="py-2.5 px-3 font-black text-black">{p.name}</td>
                    <td className="py-2.5 px-3 text-black font-bold">{p.category}</td>
                    <td className="py-2.5 px-3 text-center font-black text-black">{p.stockQuantity} {p.unit}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-black">{formatCurrency(p.purchasePrice)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-black">{formatCurrency(p.sellingPrice)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-black">
                      {formatCurrency(p.stockQuantity * p.sellingPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: CUSTOMER DUES LEDGER */}
      {reportType === 'customers' && (
        <div className="space-y-4">
          {/* Customer Dues Overview Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-black flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 text-black" />
                <span>Total Outstanding Dues</span>
              </span>
              <p className="text-2xl font-black text-black">
                {formatCurrency(totalOutstandingDuesAll)}
              </p>
              <p className="text-[11px] text-neutral-600 font-bold">
                Uncollected balance across all accounts
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-black flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-black" />
                <span>Accounts With Dues</span>
              </span>
              <p className="text-2xl font-black text-black">
                {totalCustomersWithDuesCount}{' '}
                <span className="text-xs font-bold text-neutral-500">
                  / {state.customers.length} total
                </span>
              </p>
              <p className="text-[11px] text-neutral-600 font-bold">
                Customers with unpaid invoices
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-black flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                <span>Total Collections</span>
              </span>
              <p className="text-2xl font-black text-black">
                {formatCurrency(customersLedgerData.reduce((acc, c) => acc + c.paid, 0))}
              </p>
              <p className="text-[11px] text-neutral-600 font-bold">
                Total amount paid by customers
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-black flex items-center space-x-1">
                <Package className="w-3.5 h-3.5 text-black" />
                <span>Total Customer Sales</span>
              </span>
              <p className="text-2xl font-black text-black">
                {formatCurrency(customersLedgerData.reduce((acc, c) => acc + c.purchases, 0))}
              </p>
              <p className="text-[11px] text-neutral-600 font-bold">
                Gross sales ledger volume
              </p>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer by name, phone or address..."
                className="w-full pl-9 pr-3 py-2 border-2 border-black rounded-xl text-xs font-black placeholder:font-normal placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setDuesOnlyFilter(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer border-2 border-black ${
                  duesOnlyFilter
                    ? 'bg-neutral-200 text-black shadow-xs ring-2 ring-black font-black'
                    : 'bg-white text-black hover:bg-neutral-100'
                }`}
              >
                🔴 Only Customers with Dues ({totalCustomersWithDuesCount})
              </button>

              <button
                type="button"
                onClick={() => setDuesOnlyFilter(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer border-2 border-black ${
                  !duesOnlyFilter
                    ? 'bg-neutral-200 text-black shadow-xs ring-2 ring-black font-black'
                    : 'bg-white text-black hover:bg-neutral-100'
                }`}
              >
                👥 All Customers ({state.customers.length})
              </button>
            </div>
          </div>

          {/* Customer Dues Ledger Table */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-black flex items-center space-x-2">
                <Users className="w-4 h-4 text-black" />
                <span>Customer Dues Ledger Record ({filteredCustomerLedger.length} Customers)</span>
              </h4>
              <span className="text-xs font-bold text-neutral-600">
                Sorted by Live Account Balance
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-100 text-black uppercase font-black text-[11px] border-b-2 border-black">
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Phone & Address</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Total Purchases</th>
                    <th className="py-2.5 px-3 text-right">Total Paid</th>
                    <th className="py-2.5 px-3 text-right">Due Balance</th>
                    <th className="py-2.5 px-3">Unpaid Bills</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {filteredCustomerLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-500 font-bold text-xs">
                        {duesOnlyFilter
                          ? '🎉 No outstanding customer dues found! All customer accounts are fully settled.'
                          : 'No matching customer records found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomerLedger.map((item) => (
                      <tr key={item.customer.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <p className="font-black text-black">{item.customer.name}</p>
                          {item.customer.createdAt && (
                            <span className="text-[10px] text-neutral-500 font-normal">
                              Joined: {formatDate(item.customer.createdAt)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="space-y-0.5">
                            <p className="font-bold text-black font-mono text-[11px] flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-black shrink-0" />
                              <span>{item.customer.phone || 'N/A'}</span>
                            </p>
                            {item.customer.address && (
                              <p className="text-[10px] text-neutral-600 flex items-center space-x-1">
                                <MapPin className="w-2.5 h-2.5 text-neutral-500 shrink-0" />
                                <span>{item.customer.address}</span>
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black border border-black bg-neutral-100 text-black">
                            {item.customer.customerType || 'Regular'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-black">
                          {formatCurrency(item.purchases)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-black">
                          {formatCurrency(item.paid)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`font-black text-xs ${
                              item.due > 0 ? 'text-black underline font-black' : 'text-neutral-500'
                            }`}
                          >
                            {formatCurrency(item.due)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {item.unpaidSales.length > 0 ? (
                            <div className="space-y-0.5 max-w-[160px]">
                              {item.unpaidSales.slice(0, 2).map((s) => (
                                <div
                                  key={s.id}
                                  className="text-[10px] font-mono text-black bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300"
                                >
                                  {s.invoiceNo}: <strong>{formatCurrency(s.dueAmount)}</strong>
                                </div>
                              ))}
                              {item.unpaidSales.length > 2 && (
                                <span className="text-[9px] text-neutral-500 font-bold block">
                                  +{item.unpaidSales.length - 2} more bill(s)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-neutral-400 font-bold">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.due > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-black text-white">
                              DUE PENDING
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-neutral-100 text-black border border-black">
                              ALL CLEAR
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: SALES & EXPENSES TRANSACTION LOGS */}
      {(reportType === 'sales' || reportType === 'expenses') && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs">
          <p className="text-xs text-black font-black mb-3">
            Showing filtered data for {reportType.toUpperCase()} ({filteredSales.length || filteredExpenses.length} records)
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-100 text-black uppercase font-black text-[11px] border-b-2 border-black">
                  <th className="py-2.5 px-3">Record ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Particulars</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {reportType === 'sales' &&
                  filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-neutral-100 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-black text-black">{s.invoiceNo}</td>
                      <td className="py-2.5 px-3 text-black font-bold">{formatDate(s.date)}</td>
                      <td className="py-2.5 px-3 font-black text-black">{s.customerName} ({s.saleType})</td>
                      <td className="py-2.5 px-3 text-right font-black text-black">{formatCurrency(s.grandTotal)}</td>
                    </tr>
                  ))}
                {reportType === 'expenses' &&
                  filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-neutral-100 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-black text-black">{e.referenceNo || 'EXP'}</td>
                      <td className="py-2.5 px-3 text-black font-bold">{formatDate(e.date)}</td>
                      <td className="py-2.5 px-3 font-black text-black">{e.title} ({e.category})</td>
                      <td className="py-2.5 px-3 text-right font-black text-black">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
