import React, { useState } from 'react';
import { AppState, Customer, CustomerType, Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { exportDuesReportToExcel } from '../../utils/excelExport';
import { getCustomerLiveDue, getUnpaidCustomerSales } from '../../utils/dues';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  FileSpreadsheet,
  Trash2,
  Printer,
  History,
  FileText,
  KeyRound,
  AlertTriangle,
  Receipt,
  X,
  CreditCard,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

interface CustomerManagementProps {
  state: AppState;
  onAddCustomer: (customer: Customer) => void;
  onSettleDue: (customerId: string, amount: number, paymentMode?: string, remarks?: string) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onOpenPOS?: () => void;
  onOpenPOSWithCustomer?: (customerId: string) => void;
  onViewInvoice?: (saleId: string) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  state,
  onAddCustomer,
  onSettleDue,
  onDeleteCustomer,
  onOpenPOS,
  onOpenPOSWithCustomer,
  onViewInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [duesFilter, setDuesFilter] = useState<'all' | 'with-dues' | 'settled'>('all');
  
  // Settle Due Modal State
  const [selectedCustomerForSettle, setSelectedCustomerForSettle] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settlePaymentMode, setSettlePaymentMode] = useState('Cash');
  const [settleRemarks, setSettleRemarks] = useState('');
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // View Customer Old Bills Modal State
  const [selectedCustomerForBills, setSelectedCustomerForBills] = useState<Customer | null>(null);

  // Password Protected Customer Delete Modal State
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState<Customer | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Add New Customer Modal State
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustType, setNewCustType] = useState<CustomerType>('Regular');

  // Indexed Customers list with S.N. (1, 2, 3...)
  const indexedCustomers = state.customers.map((c, index) => ({
    ...c,
    sn: index + 1,
    liveDue: getCustomerLiveDue(c, state.sales),
  }));

  const totalWithDuesCount = indexedCustomers.filter((c) => c.liveDue > 0).length;
  const totalSettledCount = indexedCustomers.filter((c) => c.liveDue === 0).length;

  const filteredCustomers = indexedCustomers.filter((c) => {
    // Apply Dues Filter: 'with-dues' shows ONLY customers with active unpaid dues (>0)
    // Once settled, c.liveDue becomes 0 and they are removed from 'with-dues' list!
    if (duesFilter === 'with-dues' && c.liveDue <= 0) {
      return false;
    }
    if (duesFilter === 'settled' && c.liveDue > 0) {
      return false;
    }

    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.sn.toString() === term ||
      `#${c.sn}`.toLowerCase().includes(term) ||
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.address.toLowerCase().includes(term) ||
      c.id.toLowerCase().includes(term)
    );
  });

  const totalOutstandingDues = state.customers.reduce(
    (acc, c) => acc + getCustomerLiveDue(c, state.sales),
    0
  );

  const handleExportDuesExcel = () => {
    exportDuesReportToExcel(
      state.customers,
      state.sales,
      `Customer_Dues_Report_${new Date().toISOString().split('T')[0]}`,
      true
    );
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForSettle) return;
    const amt = parseFloat(settleAmount) || 0;
    if (amt <= 0) return;

    onSettleDue(
      selectedCustomerForSettle.id,
      amt,
      settlePaymentMode,
      settleRemarks.trim() || undefined
    );
    setIsSettleModalOpen(false);
    setSettleAmount('');
    setSettleRemarks('');
    setSelectedCustomerForSettle(null);
  };

  const handleConfirmDeleteCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = deletePassword.trim();
    if (
      cleanPass === '23571113' ||
      cleanPass === 'Sunil369@' ||
      cleanPass === 'Sunil 359@' ||
      (state.currentUser?.password && cleanPass === state.currentUser.password)
    ) {
      if (deleteCustomerTarget && onDeleteCustomer) {
        onDeleteCustomer(deleteCustomerTarget.id);
      }
      setDeleteCustomerTarget(null);
      setDeletePassword('');
      setDeleteError('');
    } else {
      setDeleteError('Invalid Password!');
    }
  };

  const handleCreateNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || 'N/A',
      address: newCustAddress.trim() || 'Local',
      customerType: newCustType,
      totalPurchases: 0,
      totalPaid: 0,
      totalDue: 0,
      createdAt: new Date().toISOString(),
    };

    onAddCustomer(newCust);
    setIsAddCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  return (
    <div className="p-3 sm:p-6 space-y-5 text-black">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-black flex items-center space-x-2">
            <Users className="w-6 h-6 text-black" />
            <span>Customer Directory & Ledger Dues</span>
          </h2>
          <p className="text-xs text-black font-bold mt-0.5">
            Manage customer profiles, search by S.N., Name, or Phone, view past invoices, and settle dues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setDuesFilter((prev) => (prev === 'with-dues' ? 'all' : 'with-dues'))}
            className={`px-3.5 py-2 rounded-xl text-black flex items-center space-x-2 border-2 border-black transition-all cursor-pointer shadow-xs ${
              duesFilter === 'with-dues'
                ? 'bg-black text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-black'
            }`}
            title="Toggle to view only customers with active dues"
          >
            <span className="text-xs font-black">
              {duesFilter === 'with-dues' ? '⚠️ Showing Dues Only:' : 'Total Outstanding Dues:'}
            </span>
            <span className="font-black text-sm">
              {formatCurrency(totalOutstandingDues)}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              duesFilter === 'with-dues' ? 'bg-white text-black' : 'bg-black text-white'
            }`}>
              {totalWithDuesCount}
            </span>
          </button>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer border border-black"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Add Customer</span>
          </button>

          <button
            onClick={handleExportDuesExcel}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer border-2 border-black"
          >
            <FileSpreadsheet className="w-4 h-4 text-black" />
            <span>Export Dues List (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-black shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-black" />
          <input
            type="text"
            placeholder="Search by S.N. (1, 2..), Name, or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-500"
          />
        </div>

        {/* Dues List Filter Tabs */}
        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setDuesFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border-2 border-black flex items-center space-x-1.5 ${
              duesFilter === 'all'
                ? 'bg-black text-white shadow-xs'
                : 'bg-white hover:bg-neutral-100 text-black'
            }`}
          >
            <span>All Customers</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              duesFilter === 'all' ? 'bg-white text-black' : 'bg-neutral-200 text-black'
            }`}>
              {indexedCustomers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDuesFilter('with-dues')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border-2 border-black flex items-center space-x-1.5 ${
              duesFilter === 'with-dues'
                ? 'bg-black text-white shadow-xs ring-2 ring-black'
                : 'bg-neutral-50 hover:bg-neutral-100 text-black'
            }`}
          >
            <span>⚠️ Active Dues List</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              duesFilter === 'with-dues' ? 'bg-white text-black' : 'bg-neutral-200 text-black'
            }`}>
              {totalWithDuesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDuesFilter('settled')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border-2 border-black flex items-center space-x-1.5 ${
              duesFilter === 'settled'
                ? 'bg-black text-white shadow-xs'
                : 'bg-white hover:bg-neutral-100 text-black'
            }`}
          >
            <span>✓ Settled Accounts</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              duesFilter === 'settled' ? 'bg-white text-black' : 'bg-neutral-200 text-black'
            }`}>
              {totalSettledCount}
            </span>
          </button>
        </div>
      </div>

      {/* Dues List Info Banner when Dues Filter is Active */}
      {duesFilter === 'with-dues' && (
        <div className="bg-neutral-100 border-2 border-black p-3.5 rounded-2xl flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center space-x-2 text-xs font-black text-black">
            <AlertTriangle className="w-4 h-4 text-black shrink-0" />
            <span>
              <strong>Dues Ledger View:</strong> Showing only customers with active pending dues ({totalWithDuesCount} customers, Total {formatCurrency(totalOutstandingDues)}). When an amount is settled, the customer is automatically removed from this list.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDuesFilter('all')}
            className="px-2.5 py-1 bg-white hover:bg-neutral-200 text-black text-xs font-black rounded-lg border border-black shrink-0 cursor-pointer"
          >
            Show All
          </button>
        </div>
      )}

      {/* Customer List Table with S.N. and Actions */}
      <div className="bg-white rounded-2xl border-2 border-black shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white text-black uppercase font-black text-[11px] tracking-wider border-b-2 border-black">
                <th className="py-3 px-4 w-12 text-center">S.N.</th>
                <th className="py-3 px-4">Customer Name & Action</th>
                <th className="py-3 px-4">Mobile / Contact</th>
                <th className="py-3 px-4">Type & Address</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Due Balance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-black font-bold">
                    {duesFilter === 'with-dues' ? (
                      <div className="space-y-2">
                        <div className="w-10 h-10 bg-neutral-100 border border-black rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6 text-black" />
                        </div>
                        <p className="text-sm font-black text-black">
                          🎉 All Customer Accounts Are Settled!
                        </p>
                        <p className="text-xs text-neutral-600 font-medium max-w-sm mx-auto">
                          There are currently zero outstanding dues. As soon as dues are cleared, customers are automatically removed from this list.
                        </p>
                        <button
                          type="button"
                          onClick={() => setDuesFilter('all')}
                          className="mt-2 px-3 py-1.5 bg-black text-white text-xs font-black rounded-xl cursor-pointer"
                        >
                          View All Customers
                        </button>
                      </div>
                    ) : searchTerm ? (
                      <p>No customers found matching search "{searchTerm}".</p>
                    ) : (
                      <p>No customers found in this view.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const customerSales = state.sales.filter((s) => s.customerId === c.id);
                  const regularSales = customerSales.filter((s) => s.saleType !== 'Dues Clearance');
                  const totalSpent = regularSales.reduce((acc, s) => acc + s.grandTotal, 0);
                  const currentDue = c.liveDue;

                  return (
                    <tr key={c.id} className="hover:bg-neutral-100 transition-colors">
                      {/* S.N. */}
                      <td className="py-3.5 px-4 font-black text-black text-center bg-neutral-50">
                        #{c.sn}
                      </td>

                      {/* Customer Name & "Create Invoice" below name */}
                      <td className="py-3.5 px-4">
                        <p className="font-black text-black text-sm">{c.name}</p>
                        
                        {/* Quick Invoice Button below Customer Name */}
                        <div className="mt-1 flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenPOSWithCustomer) {
                                onOpenPOSWithCustomer(c.id);
                              } else if (onOpenPOS) {
                                onOpenPOS();
                              }
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-neutral-100 text-black border border-black font-black text-[10px] rounded-lg transition-all cursor-pointer shadow-2xs"
                          >
                            <FileText className="w-3 h-3 text-black" />
                            <span>+ Create Invoice</span>
                          </button>

                          {currentDue > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenPOSWithCustomer) {
                                  onOpenPOSWithCustomer(c.id);
                                } else if (onOpenPOS) {
                                  onOpenPOS();
                                }
                              }}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-black border border-black font-black text-[10px] rounded-lg transition-all cursor-pointer shadow-2xs"
                              title="Settle customer due in a new POS bill"
                            >
                              <ExternalLink className="w-3 h-3 text-black" />
                              <span>Settle in New Bill</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-bold text-black">
                        📞 {c.phone || 'No phone'}
                      </td>

                      {/* Address & Type */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-white text-black text-[10px] font-black rounded border border-black">
                          {c.customerType}
                        </span>
                        <p className="text-[11px] text-black font-semibold mt-0.5">📍 {c.address || 'Sudhhodhan'}</p>
                      </td>

                      {/* Total Purchases */}
                      <td className="py-3.5 px-4 text-right font-black text-black">
                        {formatCurrency(totalSpent)}
                      </td>

                      {/* Due Balance */}
                      <td className="py-3.5 px-4 text-right font-black">
                        {currentDue > 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="px-2.5 py-1 rounded bg-neutral-100 text-black border-2 border-black font-black text-xs">
                              {formatCurrency(currentDue)}
                            </span>
                            <span className="text-[9px] font-bold text-neutral-600 mt-0.5">
                              ⚠️ Outstanding
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-white text-black border border-black font-black text-[11px]">
                            ✓ No Dues
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* See All Purchased Old Bills */}
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerForBills(c)}
                            className="px-2.5 py-1.5 bg-black hover:bg-neutral-800 text-white font-black text-[11px] rounded-xl transition-colors cursor-pointer inline-flex items-center space-x-1 border border-black"
                            title="See all purchased old bills"
                          >
                            <History className="w-3.5 h-3.5 text-white" />
                            <span>Old Bills ({customerSales.length})</span>
                          </button>

                          {/* Settle Due Payment */}
                          {currentDue > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomerForSettle(c);
                                setSettleAmount(String(currentDue));
                                setSettleRemarks('');
                                setIsSettleModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-black font-black text-[11px] rounded-xl border-2 border-black transition-colors cursor-pointer inline-flex items-center space-x-1 shadow-2xs active:scale-95"
                              title="Settle Due Payment & Print Receipt"
                            >
                              <Receipt className="w-3.5 h-3.5 text-black" />
                              <span>💵 Settle Due</span>
                            </button>
                          )}

                          {/* Delete Customer */}
                          {onDeleteCustomer && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteCustomerTarget(c);
                                setDeletePassword('');
                                setDeleteError('');
                              }}
                              className="p-1.5 text-black hover:bg-neutral-200 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-black"
                              title="Delete Customer"
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

      {/* Settle Due Modal */}
      {isSettleModalOpen && selectedCustomerForSettle && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-black max-w-md w-full space-y-4 shadow-2xl text-black">
            <div className="flex items-center justify-between border-b border-black pb-2">
              <h3 className="font-black text-base text-black flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-black" />
                <span>Settle Due & Issue Clearance Bill</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSettleModalOpen(false)}
                className="p-1 text-black hover:bg-neutral-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-black space-y-1">
              <p className="text-xs text-black font-bold">
                Customer: <span className="font-black text-black">{selectedCustomerForSettle.name}</span>
                {selectedCustomerForSettle.phone ? ` (${selectedCustomerForSettle.phone})` : ''}
              </p>
              <div className="flex items-center justify-between text-xs font-black text-black">
                <span>Total Live Due:</span>
                <span className="text-sm underline decoration-2">
                  {formatCurrency(getCustomerLiveDue(selectedCustomerForSettle, state.sales))}
                </span>
              </div>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-black">Amount Received (रु.) *</label>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() =>
                        setSettleAmount(
                          String(getCustomerLiveDue(selectedCustomerForSettle, state.sales))
                        )
                      }
                      className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-black text-[10px] font-black rounded border border-black cursor-pointer"
                    >
                      Full Due
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettleAmount(
                          String(
                            Math.round(
                              getCustomerLiveDue(selectedCustomerForSettle, state.sales) / 2
                            )
                          )
                        )
                      }
                      className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-black text-[10px] font-black rounded border border-black cursor-pointer"
                    >
                      Half Due
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  max={getCustomerLiveDue(selectedCustomerForSettle, state.sales)}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Payment Method</label>
                <select
                  value={settlePaymentMode}
                  onChange={(e) => setSettlePaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black bg-white"
                >
                  <option value="Cash">Cash Payment</option>
                  <option value="eSewa">eSewa QR</option>
                  <option value="Khalti">Khalti QR</option>
                  <option value="Bank Transfer">Bank Transfer / FonePay</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Remarks / Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared via online transfer / store counter"
                  value={settleRemarks}
                  onChange={(e) => setSettleRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-black rounded-xl text-xs font-bold text-black"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-black text-white font-black text-xs rounded-xl shadow-xs cursor-pointer hover:bg-neutral-800 border border-black flex items-center justify-center space-x-1.5 transition-transform active:scale-95"
                >
                  <Receipt className="w-4 h-4 text-white" />
                  <span>Confirm Payment & Print Clearance Receipt</span>
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const custId = selectedCustomerForSettle.id;
                      setIsSettleModalOpen(false);
                      if (onOpenPOSWithCustomer) {
                        onOpenPOSWithCustomer(custId);
                      } else if (onOpenPOS) {
                        onOpenPOS();
                      }
                    }}
                    className="text-xs font-black text-black hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-black" />
                    <span>Or Settle in a New Invoice (POS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSettleModalOpen(false)}
                    className="px-3 py-1.5 border border-black text-black text-xs font-black rounded-lg cursor-pointer hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Old Bills Modal */}
      {selectedCustomerForBills && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-2 border-black max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl text-black">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <h3 className="font-black text-base text-black">
                  Purchased Old Bills History
                </h3>
                <p className="text-xs text-black font-bold">
                  Customer: <span className="font-black">{selectedCustomerForBills.name}</span> (📞 {selectedCustomerForBills.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerForBills(null)}
                className="p-1 text-black hover:bg-neutral-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            {/* List of customer sales */}
            {(() => {
              const custSales = state.sales.filter((s) => s.customerId === selectedCustomerForBills.id);
              if (custSales.length === 0) {
                return (
                  <div className="py-8 text-center text-black text-xs font-bold">
                    No previous purchase bills found for this customer.
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {custSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="p-4 bg-white border-2 border-black rounded-xl flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-black text-xs">{sale.invoiceNo}</span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 bg-neutral-100 border border-black rounded">
                            {sale.saleType}
                          </span>
                        </div>
                        <p className="text-[11px] text-black font-bold mt-0.5">{formatDateTime(sale.date)}</p>
                        <p className="text-[11px] font-bold text-black mt-1">
                          Items ({sale.items.length}): {sale.items.map((i) => `${i.productName} (x${i.qty})`).join(', ')}
                        </p>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <p className="font-black text-sm text-black">{formatCurrency(sale.grandTotal)}</p>
                        <p className="text-[10px] text-black font-bold">Paid: {formatCurrency(sale.paidAmount)}</p>
                        
                        {onViewInvoice && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerForBills(null);
                              onViewInvoice(sale.id);
                            }}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-lg transition-colors cursor-pointer border border-black"
                          >
                            <Printer className="w-3.5 h-3.5 text-white" />
                            <span>Print Bill</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Password Protected Delete Customer Modal */}
      {deleteCustomerTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-black max-w-md w-full space-y-4 shadow-2xl text-black">
            <div className="flex items-center space-x-3 text-black">
              <div className="p-2.5 bg-neutral-100 rounded-xl border border-black">
                <KeyRound className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-black text-base text-black">Security Authorization Required</h3>
                <p className="text-xs text-black font-bold">Deleting customer record requires password.</p>
              </div>
            </div>

            <p className="text-xs font-black text-black bg-neutral-100 p-3 rounded-xl border-2 border-black">
              Customer: {deleteCustomerTarget.name} ({deleteCustomerTarget.phone})
            </p>

            <form onSubmit={handleConfirmDeleteCustomer} className="space-y-3">
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
                <div className="p-2.5 bg-black text-white rounded-xl text-xs font-black flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-white shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteCustomerTarget(null);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="px-4 py-2 border-2 border-black text-black text-xs font-black rounded-xl cursor-pointer hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer border border-black"
                >
                  Delete Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-black max-w-md w-full space-y-4 shadow-2xl text-black">
            <h3 className="font-black text-base text-black">Add New Customer</h3>

            <form onSubmit={handleCreateNewCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Sharma"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-bold text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Mobile / Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9812345678"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-bold text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Pargatinagar"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-bold text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Customer Category</label>
                <select
                  value={newCustType}
                  onChange={(e) => setNewCustType(e.target.value as CustomerType)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black bg-white text-black"
                >
                  <option value="Regular">Regular</option>
                  <option value="Student">Student</option>
                  <option value="Photo Client">Photo Client</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Walk-in">Walk-in</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 border-2 border-black text-black text-xs font-black rounded-xl cursor-pointer hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer border border-black"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
