import React, { useState } from 'react';
import { AppState, Sale, TimeFilter } from '../../types';
import { exportToCSV, filterByDateRange, formatCurrency, formatDateTime } from '../../utils/formatters';
import { exportSalesReportToExcel } from '../../utils/excelExport';
import { Receipt, Search, Printer, Download, Eye, Calendar, DollarSign, Tag, FileSpreadsheet, Trash2, KeyRound, AlertTriangle } from 'lucide-react';

interface SalesHistoryProps {
  state: AppState;
  onViewInvoice: (saleId: string) => void;
  onDeleteSale?: (saleId: string) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ state, onViewInvoice, onDeleteSale }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  // Password Protected Sale Delete State
  const [deleteSaleTarget, setDeleteSaleTarget] = useState<Sale | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleConfirmDeleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = deletePassword.trim();
    if (
      cleanPass === '23571113' ||
      cleanPass === 'Sunil369@' ||
      cleanPass === 'Sunil 359@' ||
      (state.currentUser?.password && cleanPass === state.currentUser.password)
    ) {
      if (deleteSaleTarget && onDeleteSale) {
        onDeleteSale(deleteSaleTarget.id);
      }
      setDeleteSaleTarget(null);
      setDeletePassword('');
      setDeleteError('');
    } else {
      setDeleteError('Invalid Password!');
    }
  };

  const timeFilteredSales = filterByDateRange<Sale>(state.sales, timeFilter);
  const totalUnpaidCount = timeFilteredSales.filter((s) => (s.dueAmount || 0) > 0).length;
  const totalPaidCount = timeFilteredSales.filter((s) => (s.dueAmount || 0) === 0).length;

  const filteredSales = timeFilteredSales.filter((s) => {
    // Payment Status Filter:
    // When 'unpaid' is chosen, show only invoices with due > 0. Once settled (due === 0), it is removed from this list!
    if (statusFilter === 'unpaid' && (s.dueAmount || 0) <= 0) return false;
    if (statusFilter === 'paid' && (s.dueAmount || 0) > 0) return false;

    return (
      s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.saleType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalSalesAmount = filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalPaidAmount = filteredSales.reduce((acc, s) => acc + s.paidAmount, 0);
  const totalDueAmount = filteredSales.reduce((acc, s) => acc + s.dueAmount, 0);

  const handleExportExcel = () => {
    exportSalesReportToExcel(filteredSales, `Sales_Report_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Date', 'Customer', 'Phone', 'Sale Type', 'Grand Total', 'Paid', 'Due', 'Status', 'Payment Method'];
    const rows = filteredSales.map((s) => [
      s.invoiceNo,
      s.date,
      s.customerName,
      s.customerPhone,
      s.saleType,
      s.grandTotal,
      s.paidAmount,
      s.dueAmount,
      s.paymentStatus,
      s.paymentMethod,
    ]);
    exportToCSV(`Sales_History_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="p-3 sm:p-6 space-y-5 text-black">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-black flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-black" />
            <span>Sales & Invoices History</span>
          </h2>
          <p className="text-xs text-black font-bold mt-0.5">
            Total {filteredSales.length} invoice records generated. View, reprint, or export bill history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer border-2 border-black"
          >
            <FileSpreadsheet className="w-4 h-4 text-black" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer border-2 border-black"
          >
            <Download className="w-4 h-4 text-black" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-xs">
          <p className="text-xs font-black uppercase tracking-wider text-black">Filtered Sales Revenue</p>
          <p className="text-xl font-black text-black mt-1">{formatCurrency(totalSalesAmount)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-xs">
          <p className="text-xs font-black uppercase tracking-wider text-black">Total Collected Paid</p>
          <p className="text-xl font-black text-black mt-1">{formatCurrency(totalPaidAmount)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-xs">
          <p className="text-xs font-black uppercase tracking-wider text-black">Outstanding Due Balance</p>
          <p className="text-xl font-black text-black mt-1">{formatCurrency(totalDueAmount)}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-black shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-black" />
          <input
            type="text"
            placeholder="Search invoice #, customer, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-500"
          />
        </div>

        {/* Payment Status Tabs (All vs Unpaid Dues vs Paid) */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border-2 border-black flex items-center space-x-1.5 ${
              statusFilter === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'bg-white hover:bg-neutral-100 text-black'
            }`}
          >
            <span>All</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              statusFilter === 'all' ? 'bg-white text-black' : 'bg-neutral-200 text-black'
            }`}>
              {timeFilteredSales.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('unpaid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border-2 border-black flex items-center space-x-1.5 ${
              statusFilter === 'unpaid'
                ? 'bg-black text-white shadow-xs ring-2 ring-black'
                : 'bg-neutral-50 hover:bg-neutral-100 text-black'
            }`}
            title="Invoices with pending due balance"
          >
            <span>⚠️ Unsettled Dues</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              statusFilter === 'unpaid' ? 'bg-white text-black' : 'bg-neutral-200 text-black'
            }`}>
              {totalUnpaidCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border-2 border-black flex items-center space-x-1.5 ${
              statusFilter === 'paid'
                ? 'bg-black text-white shadow-xs'
                : 'bg-white hover:bg-neutral-100 text-black'
            }`}
          >
            <span>✓ Paid / Settled</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              statusFilter === 'paid' ? 'bg-white text-black' : 'bg-neutral-200 text-black'
            }`}>
              {totalPaidCount}
            </span>
          </button>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {(['all', 'today', 'yesterday', 'week', 'month', 'year'] as TimeFilter[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-black capitalize transition-colors cursor-pointer shrink-0 border-2 border-black ${
                timeFilter === tf
                  ? 'bg-neutral-200 text-black shadow-xs ring-2 ring-black font-black'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border-2 border-black shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100 text-black uppercase font-black text-[11px] tracking-wider border-b-2 border-black">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-black font-bold">
                    {statusFilter === 'unpaid' ? (
                      <div className="space-y-2">
                        <p className="text-sm font-black text-black">
                          ✓ No Outstanding Due Invoices!
                        </p>
                        <p className="text-xs text-neutral-600 font-medium max-w-sm mx-auto">
                          All customer invoices for this date range have been fully settled and cleared.
                        </p>
                        <button
                          type="button"
                          onClick={() => setStatusFilter('all')}
                          className="mt-1 px-3 py-1.5 bg-black text-white text-xs font-black rounded-xl cursor-pointer"
                        >
                          View All Invoices
                        </button>
                      </div>
                    ) : (
                      <p>No sales records found matching criteria.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isMerged = Boolean(sale.mergedIntoInvoiceNo);
                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-neutral-100 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-black text-black">
                        {sale.invoiceNo}
                        {isMerged && (
                          <span className="block text-[10px] text-black font-bold mt-0.5">
                            Merged in #{sale.mergedIntoInvoiceNo}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-black font-bold">{formatDateTime(sale.date)}</td>
                      <td className="py-3 px-4">
                        <p className="font-black text-black">{sale.customerName}</p>
                        <p className="text-[10px] text-black font-semibold">{sale.customerPhone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-white text-black border border-black">
                          {sale.saleType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-black text-sm">
                        {formatCurrency(sale.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-black">
                        {formatCurrency(sale.paidAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-black">
                        {sale.dueAmount > 0 ? formatCurrency(sale.dueAmount) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isMerged ? (
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-neutral-200 text-black border border-black">
                            Merged #{sale.mergedIntoInvoiceNo}
                          </span>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded font-black text-[10px] bg-white text-black border border-black"
                          >
                            {sale.paymentStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onViewInvoice(sale.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl transition-colors cursor-pointer border-2 border-black"
                          >
                            <Printer className="w-3.5 h-3.5 text-black" />
                            <span>Print Bill</span>
                          </button>

                          {onDeleteSale && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteSaleTarget(sale);
                                setDeletePassword('');
                                setDeleteError('');
                              }}
                              className="p-1.5 text-black hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-black"
                              title="Delete Bill"
                            >
                              <Trash2 className="w-4 h-4 text-black" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Protected Delete Bill Modal */}
      {deleteSaleTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-black max-w-md w-full space-y-4 shadow-2xl text-black">
            <div className="flex items-center space-x-3 text-black">
              <div className="p-2.5 bg-neutral-100 rounded-xl border border-black">
                <KeyRound className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-black text-base text-black">Security Authorization Required</h3>
                <p className="text-xs text-black font-bold">Deleting bill/invoice record requires password.</p>
              </div>
            </div>

            <p className="text-xs font-black text-black bg-neutral-100 p-3 rounded-xl border-2 border-black">
              Bill: #{deleteSaleTarget.invoiceNo} ({deleteSaleTarget.customerName} - {formatCurrency(deleteSaleTarget.grandTotal)})
            </p>

            <form onSubmit={handleConfirmDeleteSale} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">Enter Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter security password..."
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  className="w-full px-3.5 py-2.5 border-2 border-black rounded-xl text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {deleteError && (
                <div className="p-2.5 bg-neutral-100 border-2 border-black text-black rounded-xl text-xs font-black flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-black shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteSaleTarget(null);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="px-4 py-2 border-2 border-black text-black text-xs font-black rounded-xl cursor-pointer hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl shadow-xs cursor-pointer border-2 border-black"
                >
                  Delete Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
