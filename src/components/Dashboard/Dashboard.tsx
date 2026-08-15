import React, { useState } from 'react';
import { AppState, CustomDateRange, Expense, Sale, TimeFilter } from '../../types';
import { formatCurrency, formatDate, filterByDateRange } from '../../utils/formatters';
import { getCustomerLiveDue } from '../../utils/dues';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  PlusCircle,
  Receipt,
  Sparkles,
  Layers,
  Clock,
  Printer,
  ChevronRight,
  Users,
  Calendar,
  Filter,
} from 'lucide-react';

interface DashboardProps {
  state: AppState;
  setActiveTab: (tab: string) => void;
  onOpenPOS: () => void;
  onViewInvoice: (saleId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  state,
  setActiveTab,
  onOpenPOS,
  onViewInvoice,
}) => {
  // Date Range Filter State (Today, Yesterday, This Week, This Month, This Year, All, Custom)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  // Filter Sales & Expenses by the selected time period
  const filteredSales = filterByDateRange<Sale>(state.sales, timeFilter, customDateRange);
  const filteredExpenses = filterByDateRange<Expense>(state.expenses, timeFilter, customDateRange);

  // Unified Sales / Revenue Calculation:
  // Shows strictly the actual cash collected / paid amount received in this period (excluding unpaid dues)
  const filteredRevenueCollected = filteredSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
  
  // Total Billed Grand Total for reference
  const filteredTotalBilled = filteredSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  
  // Dues generated in this period
  const filteredPeriodDue = filteredSales.reduce((acc, s) => acc + (s.dueAmount || 0), 0);

  // Total Expenses in filtered period
  const filteredExpensesTotal = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Net Profit / Net Cash Flow: Collected Revenue - Expenses
  const netProfit = filteredRevenueCollected - filteredExpensesTotal;

  // Total Active Products & Low Stock
  const totalProducts = state.products.length;
  const lowStockCount = state.products.filter((p) => p.stockQuantity <= (p.minStockAlert || 5)).length;

  // Live Customer Dues calculation (strictly reflects active unpaid balances)
  const customersWithDues = state.customers.filter(
    (c) => getCustomerLiveDue(c, state.sales) > 0
  );
  const totalOutstandingDues = customersWithDues.reduce(
    (acc, c) => acc + getCustomerLiveDue(c, state.sales),
    0
  );

  // Filtered Transactions Feed (combined sales and expenses for this period or recent)
  const periodTransactions = [
    ...filteredSales.map((s) => ({
      type: 'Sale' as const,
      id: s.id,
      title: `${s.saleType} - ${s.customerName}`,
      ref: s.invoiceNo,
      amount: s.grandTotal,
      paid: s.paidAmount,
      due: s.dueAmount,
      date: s.date,
      status: s.paymentStatus,
      rawSale: s,
    })),
    ...filteredExpenses.map((e) => ({
      type: 'Expense' as const,
      id: e.id,
      title: `${e.category}: ${e.title}`,
      ref: e.referenceNo || 'EXPENSE',
      amount: e.amount,
      paid: e.amount,
      due: 0,
      date: e.date,
      status: 'Paid' as const,
      rawSale: null,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const filterLabels: { key: TimeFilter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom Date Range' },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 text-black">
      
      {/* Welcome Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-black shadow-xs text-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-black font-black text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-black" />
            <span>Management System Active</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-black">
            Welcome to {state.businessInfo.name}
          </h2>
          <p className="text-xs sm:text-sm text-black font-medium mt-1 max-w-xl">
            Complete inventory, billing, sales, framing, service center & financial report portal for {state.businessInfo.location}.
          </p>
        </div>

        {/* Quick POS Shortcut */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onOpenPOS}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl shadow-xs border-2 border-black transition-all cursor-pointer transform active:scale-95"
            title="Create New Bill"
          >
            <ShoppingCart className="w-4 h-4 text-black" />
            <span>⚡ Create New Sale</span>
          </button>
        </div>
      </div>

      {/* Time Range Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-black shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-black shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-black">
              Time Period Filter:
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {filterLabels.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTimeFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
                  timeFilter === key
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-white text-black border-black hover:bg-neutral-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Picker inputs */}
        {timeFilter === 'custom' && (
          <div className="pt-2 border-t border-neutral-300 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-black text-black">From:</span>
              <input
                type="date"
                value={customDateRange.from}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
                className="px-3 py-1.5 border border-black rounded-lg text-xs font-bold text-black focus:outline-none bg-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-black text-black">To:</span>
              <input
                type="date"
                value={customDateRange.to}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
                className="px-3 py-1.5 border border-black rounded-lg text-xs font-bold text-black focus:outline-none bg-white"
              />
            </div>

            <span className="text-[11px] font-bold text-neutral-600">
              Showing records from {formatDate(customDateRange.from)} to {formatDate(customDateRange.to)}
            </span>
          </div>
        )}
      </div>

      {/* 5 Core Metric Cards (Unified Revenue/Sales Box) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Unified Total Sales / Revenue (Collected Cash Only) */}
        <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-xs">
          <div className="flex items-center justify-between text-black mb-2">
            <span className="text-xs font-black uppercase tracking-wider">
              Sales / Revenue (Collected)
            </span>
            <div className="p-2 bg-neutral-100 text-black rounded-xl border border-black">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-black">{formatCurrency(filteredRevenueCollected)}</p>
          <div className="mt-1 text-[10px] text-black font-bold space-y-0.5">
            <p>✓ Paid amount received in period</p>
            {filteredPeriodDue > 0 && (
              <p className="text-neutral-700">
                Billed: {formatCurrency(filteredTotalBilled)} (Due: {formatCurrency(filteredPeriodDue)})
              </p>
            )}
          </div>
        </div>

        {/* Active Outstanding Dues */}
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className="bg-white p-4 rounded-2xl border-2 border-black shadow-xs text-left hover:bg-neutral-50 transition-colors cursor-pointer"
          title="Click to view customer dues ledger"
        >
          <div className="flex items-center justify-between text-black mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Active Dues</span>
            <div className={`p-2 rounded-xl border border-black ${customersWithDues.length > 0 ? 'bg-neutral-100' : 'bg-neutral-50'}`}>
              <Users className="w-4 h-4 text-black" />
            </div>
          </div>
          <p className="text-2xl font-black text-black">{formatCurrency(totalOutstandingDues)}</p>
          <p className="text-[11px] text-black mt-1 font-bold">
            {customersWithDues.length > 0
              ? `⚠️ ${customersWithDues.length} Customer(s) pending`
              : '✓ All Dues Settled'}
          </p>
        </button>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-xs">
          <div className="flex items-center justify-between text-black mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 bg-neutral-100 text-black rounded-xl border border-black">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-black">{formatCurrency(filteredExpensesTotal)}</p>
          <p className="text-[11px] text-black mt-1 font-bold">{filteredExpenses.length} Expense records</p>
        </div>

        {/* Net Profit (Cash Basis: Collected Revenue - Expenses) */}
        <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-xs">
          <div className="flex items-center justify-between text-black mb-2">
            <span className="text-xs font-black uppercase tracking-wider">
              Net Cashflow / Profit
            </span>
            <div className="p-2 bg-neutral-100 text-black rounded-xl border border-black">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-black">{formatCurrency(netProfit)}</p>
          <p className="text-[11px] text-black mt-1 font-bold">Collected Sales − Expenses</p>
        </div>

        {/* Total Products & Alerts */}
        <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-xs">
          <div className="flex items-center justify-between text-black mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Total Products</span>
            <div className="p-2 bg-neutral-100 text-black rounded-xl border border-black">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-black">{totalProducts}</p>
          <p className="text-[11px] text-black font-black mt-1">
            {lowStockCount > 0 ? `⚠️ ${lowStockCount} Low stock alert` : '✓ Active Catalog'}
          </p>
        </div>

      </div>

      {/* Middle Section: Quick Action Buttons & Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Quick Operations Panel */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs space-y-4">
          <h3 className="font-black text-sm text-black flex items-center space-x-2">
            <Layers className="w-4 h-4 text-black" />
            <span>Quick Operations</span>
          </h3>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={onOpenPOS}
              className="p-3 bg-white hover:bg-neutral-100 border-2 border-black text-black rounded-xl font-black text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5 text-black" />
              <span>New Sale</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className="p-3 bg-white hover:bg-neutral-100 border-2 border-black text-black rounded-xl font-black text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer"
            >
              <Package className="w-5 h-5 text-black" />
              <span>Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className="p-3 bg-white hover:bg-neutral-100 border-2 border-black text-black rounded-xl font-black text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer"
            >
              <TrendingDown className="w-5 h-5 text-black" />
              <span>Expenses</span>
            </button>

            <button
              onClick={() => setActiveTab('daily-closing')}
              className="p-3 bg-white hover:bg-neutral-100 border-2 border-black text-black rounded-xl font-black text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer"
            >
              <Clock className="w-5 h-5 text-black" />
              <span>Closing</span>
            </button>
          </div>
        </div>

        {/* Business Category Revenue Distribution */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-black flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-black" />
              <span>Period Financial Overview & Income Streams</span>
            </h3>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-black text-black hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>View Full P&L</span>
              <ChevronRight className="w-4 h-4 text-black" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Visual Bar: Income vs Expense */}
            <div className="p-4 bg-white rounded-xl border border-black space-y-3">
              <p className="text-xs font-black text-black">Net Cashflow Ratio</p>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-black font-semibold">Collected Revenue:</span>
                  <span className="font-black text-black">{formatCurrency(filteredRevenueCollected)}</span>
                </div>
                <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden border border-black">
                  <div className="bg-black h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-black font-semibold">Total Expenses:</span>
                  <span className="font-black text-black">{formatCurrency(filteredExpensesTotal)}</span>
                </div>
                <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden border border-black">
                  <div
                    className="bg-black h-full rounded-full"
                    style={{ width: `${Math.min(100, filteredRevenueCollected ? (filteredExpensesTotal / filteredRevenueCollected) * 100 : 0)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t border-black flex justify-between text-xs font-black">
                <span className="text-black">Period Net Cashflow:</span>
                <span className="text-black">
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>

            {/* Service & Product Sales Streams */}
            <div className="p-4 bg-white rounded-xl border border-black space-y-2">
              <p className="text-xs font-black text-black">Collected Income by Service</p>
              
              <div className="space-y-2 text-xs">
                {['Computer Sale', 'Accessories', 'Photo Printing', 'Frame Order', 'Service Charge', 'Course Fee', 'Dues Clearance'].map((type) => {
                  const typeSales = filteredSales
                    .filter((s) => s.saleType === type)
                    .reduce((acc, s) => acc + (s.paidAmount || 0), 0);
                  const pct = filteredRevenueCollected ? Math.round((typeSales / filteredRevenueCollected) * 100) : 0;

                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-bold text-black">{type}</span>
                        <span className="font-black text-black">{formatCurrency(typeSales)} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden border border-black">
                        <div
                          className="bg-black h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Section: Transactions Feed */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm text-black">Period Transactions Feed</h3>
            <p className="text-xs text-black font-semibold">
              Showing {periodTransactions.length} recorded sales & expenses for the selected filter
            </p>
          </div>
          <button
            onClick={() => setActiveTab('sales')}
            className="text-xs font-black text-black hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>View All Invoices</span>
            <ChevronRight className="w-4 h-4 text-black" />
          </button>
        </div>

        <div className="table-responsive-container">
          <table className="w-full text-left border-collapse text-xs min-w-[600px]">
            <thead>
              <tr className="bg-white border-b-2 border-black text-black uppercase font-black text-[10px]">
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Ref #</th>
                <th className="py-2.5 px-3">Title / Particulars</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Billed</th>
                <th className="py-2.5 px-3 text-right">Collected (Paid)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {periodTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-neutral-500 font-bold text-xs">
                    No transactions found for this period filter.
                  </td>
                </tr>
              ) : (
                periodTransactions.map((tx) => (
                  <tr key={`${tx.type}-${tx.id}`} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black border border-black bg-neutral-100 text-black">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-black text-black">{tx.ref}</td>
                    <td className="py-2.5 px-3 font-bold text-black">{tx.title}</td>
                    <td className="py-2.5 px-3 font-medium text-black">{formatDate(tx.date)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-neutral-700">
                      {tx.type === 'Expense' ? '-' : ''} {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-black">
                      {formatCurrency(tx.paid)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black border border-black bg-neutral-100 text-black">
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {tx.type === 'Sale' && tx.rawSale && (
                        <button
                          onClick={() => onViewInvoice(tx.rawSale.id)}
                          className="p-1.5 text-black hover:bg-neutral-100 border border-black rounded-lg font-black text-xs inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-black" />
                          <span>Bill</span>
                        </button>
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
  );
};
