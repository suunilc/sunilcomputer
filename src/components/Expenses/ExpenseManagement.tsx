import React, { useState } from 'react';
import { AppState, Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '../../types';
import { exportToCSV, formatCurrency, formatDate } from '../../utils/formatters';
import { Wallet, Plus, Search, Trash2, Calendar, DollarSign, Download, Filter, X, KeyRound, AlertTriangle } from 'lucide-react';

interface ExpenseManagementProps {
  state: AppState;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpenseManagement: React.FC<ExpenseManagementProps> = ({
  state,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Password Protected Delete Expense State
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<Expense | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleConfirmDeleteExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = deletePassword.trim();
    if (
      cleanPass === '23571113' ||
      cleanPass === 'Sunil369@' ||
      cleanPass === 'Sunil 359@' ||
      (state.currentUser?.password && cleanPass === state.currentUser.password)
    ) {
      if (deleteExpenseTarget) {
        onDeleteExpense(deleteExpenseTarget.id);
      }
      setDeleteExpenseTarget(null);
      setDeletePassword('');
      setDeleteError('');
    } else {
      setDeleteError('Invalid Password!');
    }
  };

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Expense['paymentMethod']>('Cash');
  const [referenceNo, setReferenceNo] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      title: title.trim(),
      category,
      amount: parseFloat(amount) || 0,
      date,
      description: description.trim(),
      paymentMethod,
      referenceNo: referenceNo.trim() || `EXP-${Math.floor(Math.random() * 9000 + 1000)}`,
    };

    onAddExpense(newExpense);
    setIsModalOpen(false);
    setTitle('');
    setAmount('');
    setDescription('');
    setReferenceNo('');
  };

  const filteredExpenses = state.expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalExpenseSum = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="p-3 sm:p-6 space-y-5 text-black">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-black flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-black" />
            <span>Expense Tracking System</span>
          </h2>
          <p className="text-xs text-black font-bold mt-0.5">
            Log shop rent, electricity, internet, staff salaries, and operational costs.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer border-2 border-black"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Category Pills & Total */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-black shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer shrink-0 border-2 border-black ${
              selectedCategory === 'All'
                ? 'bg-neutral-200 text-black shadow-xs ring-2 ring-black font-black'
                : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            All Categories
          </button>
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer shrink-0 border-2 border-black ${
                selectedCategory === cat
                  ? 'bg-neutral-200 text-black shadow-xs ring-2 ring-black font-black'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-black text-black block">Total Expenses</span>
          <span className="text-lg font-black text-black">{formatCurrency(totalExpenseSum)}</span>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-2xl border-2 border-black shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100 text-black uppercase font-black text-[11px] tracking-wider border-b-2 border-black">
                <th className="py-3 px-4 text-center">S.N.</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Expense Title</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-black font-bold">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp, index) => (
                  <tr key={exp.id} className="hover:bg-neutral-100 transition-colors">
                    <td className="py-3 px-4 text-center font-black text-black">#{index + 1}</td>
                    <td className="py-3 px-4 text-black font-bold">{formatDate(exp.date)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-white text-black border border-black">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-black text-black">{exp.title}</p>
                      {exp.description && <p className="text-[10px] text-black font-semibold">{exp.description}</p>}
                    </td>
                    <td className="py-3 px-4 text-black font-bold">{exp.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-black text-black text-sm">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setDeleteExpenseTarget(exp);
                          setDeletePassword('');
                          setDeleteError('');
                        }}
                        className="text-black hover:bg-neutral-200 p-1.5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-black"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4 text-black" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-black max-w-md w-full space-y-4 shadow-2xl text-black">
            <h3 className="font-black text-base text-black">Record Business Expense</h3>
            
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">Expense Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black bg-white text-black"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NEA Electricity Bill or Shop Rent"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-bold text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">Amount (रु.) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-bold text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs bg-white font-black text-black"
                >
                  <option value="Cash">Cash</option>
                  <option value="Online (eSewa/Khalti)">Online (eSewa/Khalti)</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-bold text-black"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border-2 border-black text-black text-xs font-black rounded-xl cursor-pointer hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white hover:bg-neutral-100 text-black font-black text-xs rounded-xl shadow-xs cursor-pointer border-2 border-black"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Protected Delete Expense Modal */}
      {deleteExpenseTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-black max-w-md w-full space-y-4 shadow-2xl text-black">
            <div className="flex items-center space-x-3 text-black">
              <div className="p-2.5 bg-neutral-100 rounded-xl border border-black">
                <KeyRound className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-black text-base text-black">Security Authorization Required</h3>
                <p className="text-xs text-black font-bold">Deleting expense record requires password.</p>
              </div>
            </div>

            <p className="text-xs font-black text-black bg-neutral-100 p-3 rounded-xl border-2 border-black">
              Expense: {deleteExpenseTarget.title} ({formatCurrency(deleteExpenseTarget.amount)})
            </p>

            <form onSubmit={handleConfirmDeleteExpense} className="space-y-3">
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
                    setDeleteExpenseTarget(null);
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
                  Delete Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
