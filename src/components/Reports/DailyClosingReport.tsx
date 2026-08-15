import React from 'react';
import { AppState, Expense, Purchase, Sale } from '../../types';
import { filterByDateRange, formatCurrency, formatDateTime } from '../../utils/formatters';
import { Clock, Printer, DollarSign, Wallet, ShoppingCart, CheckCircle2 } from 'lucide-react';

interface DailyClosingReportProps {
  state: AppState;
}

export const DailyClosingReport: React.FC<DailyClosingReportProps> = ({ state }) => {
  const todaySales = filterByDateRange<Sale>(state.sales, 'today');
  const todayPurchases = filterByDateRange<Purchase>(state.purchases, 'today');
  const todayExpenses = filterByDateRange<Expense>(state.expenses, 'today');

  const cashSales = todaySales
    .filter((s) => s.paymentMethod === 'Cash')
    .reduce((acc, s) => acc + s.paidAmount, 0);

  const onlineSales = todaySales
    .filter((s) => s.paymentMethod === 'Online (eSewa/Khalti)')
    .reduce((acc, s) => acc + s.paidAmount, 0);

  const cardSales = todaySales
    .filter((s) => s.paymentMethod === 'Card')
    .reduce((acc, s) => acc + s.paidAmount, 0);

  const bankSales = todaySales
    .filter((s) => s.paymentMethod === 'Bank Transfer')
    .reduce((acc, s) => acc + s.paidAmount, 0);

  const totalCollectedToday = todaySales.reduce((acc, s) => acc + s.paidAmount, 0);

  const cashExpensesToday = todayExpenses
    .filter((e) => e.paymentMethod === 'Cash')
    .reduce((acc, e) => acc + e.amount, 0);

  const cashPurchasesToday = todayPurchases
    .filter((p) => p.paymentMethod === 'Cash')
    .reduce((acc, p) => acc + p.paidAmount, 0);

  // Net Cash in Drawer = Cash Sales - Cash Expenses - Cash Purchases
  const netCashInDrawer = cashSales - cashExpensesToday - cashPurchasesToday;

  return (
    <div className="p-3 sm:p-6 space-y-5 text-black">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-black flex items-center space-x-2">
            <Clock className="w-6 h-6 text-black" />
            <span>Daily Register Closing Summary</span>
          </h2>
          <p className="text-xs text-black font-bold mt-0.5">
            Cash register audit report for {formatDateTime(new Date().toISOString())}.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer border-2 border-black"
        >
          <Printer className="w-4 h-4 text-black" />
          <span>Print Daily Closing</span>
        </button>
      </div>

      {/* Main Cash Drawer Calculation Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs space-y-1 sm:space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-black">Total Cash Collected</span>
          <p className="text-2xl font-black text-black">{formatCurrency(cashSales)}</p>
          <p className="text-[11px] text-black font-bold">From cash receipts</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs space-y-1 sm:space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-black">Online eSewa / Khalti</span>
          <p className="text-2xl font-black text-black">{formatCurrency(onlineSales)}</p>
          <p className="text-[11px] text-black font-bold">Digital QR payments</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs space-y-1 sm:space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-black">Cash Payouts & Expenses</span>
          <p className="text-2xl font-black text-black">{formatCurrency(cashExpensesToday + cashPurchasesToday)}</p>
          <p className="text-[11px] text-black font-bold">Rent, bills & restocks</p>
        </div>

        <div className="bg-white text-black p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs space-y-1 sm:space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-black">Net Cash in Drawer</span>
          <p className="text-2xl font-black text-black">{formatCurrency(netCashInDrawer)}</p>
          <p className="text-[11px] text-black font-bold">Physical drawer balance</p>
        </div>

      </div>

      {/* Itemized Sales Breakdown Today */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-black shadow-xs space-y-4">
        <h3 className="font-black text-base text-black">Today's Transactions Log ({todaySales.length} Sales)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100 text-black uppercase font-black text-[11px] border-b-2 border-black">
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Sale Type</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {todaySales.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-100 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-black text-black">{s.invoiceNo}</td>
                  <td className="py-2.5 px-3 text-black font-bold">{s.date.split('T')[1]?.slice(0, 5) || 'Today'}</td>
                  <td className="py-2.5 px-3 font-black text-black">{s.customerName}</td>
                  <td className="py-2.5 px-3 text-black font-bold">{s.saleType}</td>
                  <td className="py-2.5 px-3 font-black text-black">{s.paymentMethod}</td>
                  <td className="py-2.5 px-3 text-right font-black text-black">{formatCurrency(s.paidAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
