import React, { useState, useEffect } from 'react';
import { AppState, Customer, Product, ProductCategory, PRODUCT_CATEGORIES, Sale, SaleItem, SaleType } from '../../types';
import { formatCurrency, generateInvoiceNo } from '../../utils/formatters';
import { getCustomerLiveDue, getUnpaidCustomerSales } from '../../utils/dues';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  CheckCircle2,
  Printer,
  Barcode,
  Sparkles,
  AlertCircle,
  Tag,
  DollarSign,
  User,
  X,
  Receipt,
  RotateCcw,
} from 'lucide-react';

interface POSBillingProps {
  state: AppState;
  preselectedCustomerId?: string | null;
  onClearPreselectedCustomer?: () => void;
  onCompleteSale: (sale: Sale) => void;
  onAddCustomer: (customer: Customer) => void;
}

export const POSBilling: React.FC<POSBillingProps> = ({
  state,
  preselectedCustomerId,
  onClearPreselectedCustomer,
  onCompleteSale,
  onAddCustomer,
}) => {
  // Cart items state
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    preselectedCustomerId || state.customers[0]?.id || 'cust-104'
  );

  const [saleType, setSaleType] = useState<SaleType>('Accessories');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Discount & Tax State
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('Cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Custom Item Modal State (Manual Product / Service Billing)
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQty, setCustomItemQty] = useState('1');
  const [customItemCategory, setCustomItemCategory] = useState<ProductCategory>('Other Products');

  // Custom Customer Direct Input Mode
  const [isCustomCustomer, setIsCustomCustomer] = useState(false);
  const [customCustName, setCustomCustName] = useState('');
  const [customCustPhone, setCustomCustPhone] = useState('');
  const [customCustAddress, setCustomCustAddress] = useState('Sudhhodhan-1, Pargatinagar');

  // Auto Add Previous Due State
  const [autoAddPreviousDue, setAutoAddPreviousDue] = useState(true);
  const [customSettleAmount, setCustomSettleAmount] = useState<string>('');

  // Quick Add Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('Pargatinagar');

  // Respond to preselected customer from CustomerManagement
  useEffect(() => {
    if (preselectedCustomerId) {
      setSelectedCustomerId(preselectedCustomerId);
      setIsCustomCustomer(false);
      setAutoAddPreviousDue(true);
      if (onClearPreselectedCustomer) {
        onClearPreselectedCustomer();
      }
    }
  }, [preselectedCustomerId, onClearPreselectedCustomer]);

  const selectedCustomer =
    state.customers.find((c) => c.id === selectedCustomerId) || state.customers[0];

  // Dynamic live customer due calculation
  const customerExistingDue =
    selectedCustomer && !isCustomCustomer
      ? getCustomerLiveDue(selectedCustomer, state.sales)
      : 0;

  const unpaidInvoices =
    selectedCustomer && !isCustomCustomer
      ? getUnpaidCustomerSales(selectedCustomer, state.sales)
      : [];

  const parsedSettleAmount =
    customSettleAmount !== ''
      ? Math.max(0, Math.min(customerExistingDue, parseFloat(customSettleAmount) || 0))
      : customerExistingDue;

  const previousDueToAdd =
    autoAddPreviousDue && customerExistingDue > 0 ? parsedSettleAmount : 0;

  // Handle Quick "Settle Dues Only" (Fill Cart with Dues Clearance line item)
  const handleQuickSettleDuesOnly = () => {
    if (customerExistingDue <= 0) return;
    setSaleType('Dues Clearance');
    setCart([
      {
        productId: `settle-item-${Date.now()}`,
        productName: `Dues & Credit Clearance Receipt (${selectedCustomer?.name || 'Customer'})`,
        sku: 'DUES-CLEARANCE',
        qty: 1,
        sellingRate: parsedSettleAmount,
        purchaseRate: 0,
        subtotal: parsedSettleAmount,
        discount: 0,
      },
    ]);
    setAutoAddPreviousDue(false); // Since the line item itself is the due clearance
    setPaidAmount(String(parsedSettleAmount));
  };

  // Add Custom Manual Item to Cart
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim() || !customItemPrice) return;
    const price = parseFloat(customItemPrice) || 0;
    const qty = parseInt(customItemQty, 10) || 1;

    setCart([
      ...cart,
      {
        productId: `custom-${Date.now()}`,
        productName: customItemName.trim(),
        sku: 'CUSTOM-ITEM',
        qty,
        sellingRate: price,
        purchaseRate: 0,
        subtotal: price * qty,
        discount: 0,
      },
    ]);

    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQty('1');
    setIsCustomItemModalOpen(false);
  };

  // Add Product to Cart
  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert(`"${product.name}" is OUT OF STOCK.`);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].qty;
      if (currentQty + 1 > product.stockQuantity) {
        alert(`Cannot add more than available stock (${product.stockQuantity} ${product.unit})`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      updated[existingIndex].subtotal = updated[existingIndex].qty * updated[existingIndex].sellingRate;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          qty: 1,
          sellingRate: product.sellingPrice,
          purchaseRate: product.purchasePrice,
          subtotal: product.sellingPrice,
          discount: 0,
        },
      ]);
    }
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            qty: newQty,
            subtotal: newQty * item.sellingRate,
          };
        }
        return item;
      })
    );
  };

  const updateCartItemName = (productId: string, newName: string) => {
    setCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, productName: newName } : item
      )
    );
  };

  const updateCartItemRate = (productId: string, newRate: number) => {
    const rate = isNaN(newRate) ? 0 : Math.max(0, newRate);
    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, sellingRate: rate, subtotal: rate * item.qty }
          : item
      )
    );
  };

  const handleAddTypeableRow = () => {
    const newId = `typeable-${Date.now()}`;
    setCart([
      ...cart,
      {
        productId: newId,
        productName: 'New Product / Course',
        sku: 'MANUAL',
        qty: 1,
        sellingRate: 0,
        purchaseRate: 0,
        subtotal: 0,
        discount: 0,
      },
    ]);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  
  // Calculate discount total
  const calculatedDiscount = discountPercent > 0
    ? (subtotal * discountPercent) / 100
    : discountAmount;

  const afterDiscount = Math.max(0, subtotal - calculatedDiscount);
  const taxAmount = (afterDiscount * taxPercent) / 100;
  const grandTotal = Math.round(afterDiscount + taxAmount + previousDueToAdd);

  const numericPaid = parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - numericPaid);
  const changeDue = numericPaid > grandTotal ? numericPaid - grandTotal : 0;

  const paymentStatus: Sale['paymentStatus'] =
    numericPaid >= grandTotal
      ? 'Paid'
      : numericPaid > 0
      ? 'Partial'
      : 'Due';

  // Handle Quick Customer Add
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || '',
      address: newCustAddress.trim() || 'Sudhhodhan-1, Pargatinagar',
      customerType: 'Regular',
      totalPurchases: 0,
      totalPaid: 0,
      totalDue: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setNewCustName('');
    setNewCustPhone('');
    setIsCustomerModalOpen(false);
  };

  // Submit Sale & Generate Invoice
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty! Add products before billing.');
      return;
    }

    let finalCustomerId = selectedCustomer?.id || 'cust-104';
    let finalCustomerName = selectedCustomer?.name || 'Walk-in Customer';
    let finalCustomerPhone = selectedCustomer?.phone || '';

    if (isCustomCustomer) {
      if (customCustName.trim()) {
        finalCustomerName = customCustName.trim();
        finalCustomerPhone = customCustPhone.trim();
        const customCust: Customer = {
          id: `cust-${Date.now()}`,
          name: finalCustomerName,
          phone: finalCustomerPhone,
          address: customCustAddress.trim() || 'Sudhhodhan-1, Pargatinagar',
          customerType: 'Regular',
          totalPurchases: 0,
          totalPaid: 0,
          totalDue: 0,
          createdAt: new Date().toISOString().split('T')[0],
        };
        onAddCustomer(customCust);
        finalCustomerId = customCust.id;
      }
    }

    const invoiceNo = generateInvoiceNo(state.sales);
    const effectivePaid = numericPaid > 0 ? Math.min(numericPaid, grandTotal) : (paidAmount === '' ? grandTotal : 0);

    const salePayload: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNo,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      saleType,
      date: new Date().toISOString(),
      items: cart,
      subtotal,
      discountAmount: calculatedDiscount,
      discountPercent,
      taxPercent,
      taxAmount,
      grandTotal,
      paidAmount: effectivePaid,
      dueAmount: Math.max(0, grandTotal - effectivePaid),
      paymentStatus: effectivePaid >= grandTotal ? 'Paid' : effectivePaid > 0 ? 'Partial' : 'Due',
      paymentMethod,
      notes: notes.trim(),
      createdBy: state.currentUser?.name || 'Sunil Sharma',
      previousDueAdded: previousDueToAdd,
    };

    onCompleteSale(salePayload);

    // Reset Form
    setCart([]);
    setDiscountAmount(0);
    setDiscountPercent(0);
    setTaxPercent(0);
    setPaidAmount('');
    setNotes('');
    setCustomCustName('');
    setCustomCustPhone('');
  };

  // Filter products for left grid
  const filteredProducts = state.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 h-full text-black">
      
      {/* Left Column: Product Catalog & Search (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        
        {/* Top Search & Filter Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-black shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <div className="relative flex items-center w-full sm:w-auto" style={{ minWidth: '220px', height: '40px' }}>
              <Search className="w-4 h-4 absolute left-3 text-black pointer-events-none" />
              <input
                type="text"
                placeholder="Search catalog or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-full pl-9 pr-3 bg-white border border-black rounded-xl text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black placeholder-neutral-500"
              />
            </div>

            {/* Custom Manual Item Adder Button */}
            <button
              onClick={() => setIsCustomItemModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer flex items-center justify-center space-x-1.5 border border-black"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Custom Item / Service</span>
            </button>

            {/* Sale Type Picker */}
            <div className="shrink-0 w-full sm:w-auto">
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value as SaleType)}
                className="w-full px-3 py-2 bg-white border-2 border-black text-black rounded-xl text-xs font-black"
              >
                <option value="Computer Sale">💻 Computer Sale</option>
                <option value="Accessories">🖱️ Accessories</option>
                <option value="Photo Printing">📷 Photo Printing</option>
                <option value="Frame Order">🖼️ Frame Order</option>
                <option value="Service Charge">🔧 Service Charge</option>
                <option value="Course Fee">🎓 Course Fee</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer shrink-0 border border-black ${
                selectedCategory === 'All'
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-neutral-100'
              }`}
            >
              All Items
            </button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black cursor-pointer shrink-0 border border-black ${
                  selectedCategory === cat
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-neutral-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-black shadow-xs flex-1 min-h-[350px] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stockQuantity <= 0;

              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => addToCart(product)}
                  className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                    isOutOfStock
                      ? 'opacity-40 bg-neutral-100 border-neutral-300 cursor-not-allowed'
                      : 'bg-white hover:bg-neutral-50 border-black active:scale-95'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-black text-black uppercase tracking-wider block mb-0.5">
                      {product.category}
                    </span>
                    <h4 className="font-black text-xs text-black line-clamp-2 leading-tight">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-black flex items-center justify-between">
                    <span className="font-black text-sm text-black">
                      {formatCurrency(product.sellingPrice)}
                    </span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded border border-black ${
                        isOutOfStock
                          ? 'bg-neutral-200 text-black'
                          : 'bg-neutral-100 text-black'
                      }`}
                    >
                      {product.stockQuantity} {product.unit}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Right Column: Billing Checkout Cart & Customer Selection (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        
        {/* Customer & Sale Info Box */}
        <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-black flex items-center space-x-1">
              <User className="w-4 h-4 text-black" />
              <span>Customer Details</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCustomCustomer(!isCustomCustomer)}
                className={`text-xs font-black px-2.5 py-1 rounded-lg border-2 border-black transition-colors cursor-pointer ${
                  isCustomCustomer
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-neutral-100'
                }`}
              >
                {isCustomCustomer ? '✓ Custom Entry' : '✍️ Custom Name'}
              </button>

              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-xs font-black text-black hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-black" />
                <span>+ Save New</span>
              </button>
            </div>
          </div>

          {!isCustomCustomer ? (
            <div className="space-y-2">
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setCustomSettleAmount('');
                }}
                className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-black text-black"
              >
                {state.customers.map((c) => {
                  const liveDue = getCustomerLiveDue(c, state.sales);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || 'No phone'}) {liveDue > 0 ? ` ⚠️ [DUE: ${formatCurrency(liveDue)}]` : ' ✓ [No Dues]'}
                    </option>
                  );
                })}
              </select>

              {/* Automatic Previous Due Alert & Interactive Settlement Controls */}
              {customerExistingDue > 0 ? (
                <div className="p-3 bg-neutral-50 border-2 border-black rounded-xl space-y-2.5 animate-in fade-in text-black">
                  <div className="flex items-center justify-between text-xs font-black text-black pb-1.5 border-b border-black">
                    <span className="flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 text-black shrink-0" />
                      <span>Outstanding Customer Dues:</span>
                    </span>
                    <span className="text-sm font-black text-black underline decoration-2">
                      {formatCurrency(customerExistingDue)}
                    </span>
                  </div>

                  {unpaidInvoices.length > 0 && (
                    <div className="text-[11px] font-bold text-black flex items-center justify-between">
                      <span>Unsettled Bills: {unpaidInvoices.length} bill(s)</span>
                      <span className="text-black font-mono">
                        ({unpaidInvoices.map((inv) => inv.invoiceNo).slice(0, 3).join(', ')}
                        {unpaidInvoices.length > 3 ? '...' : ''})
                      </span>
                    </div>
                  )}

                  {/* Toggle Checkbox to Settle / Merge into this bill */}
                  <label className="flex items-start space-x-2 text-xs font-black text-black cursor-pointer bg-white p-2 rounded-lg border border-black">
                    <input
                      type="checkbox"
                      checked={autoAddPreviousDue}
                      onChange={(e) => setAutoAddPreviousDue(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-black rounded accent-black cursor-pointer shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>Settle previous dues in this invoice</span>
                        <span className="font-mono text-black font-black">
                          +{formatCurrency(parsedSettleAmount)}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium text-neutral-600">
                        Adds previous due to current bill and clears previous unpaid balances upon payment.
                      </p>
                    </div>
                  </label>

                  {autoAddPreviousDue && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-black text-black">
                        <span>Due Amount to Settle (Rs.):</span>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setCustomSettleAmount(String(customerExistingDue))}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black border border-black cursor-pointer ${
                              parsedSettleAmount === customerExistingDue
                                ? 'bg-black text-white'
                                : 'bg-white text-black hover:bg-neutral-100'
                            }`}
                          >
                            Full Due
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomSettleAmount(String(Math.round(customerExistingDue / 2)))}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black border border-black cursor-pointer ${
                              parsedSettleAmount === Math.round(customerExistingDue / 2)
                                ? 'bg-black text-white'
                                : 'bg-white text-black hover:bg-neutral-100'
                            }`}
                          >
                            Half
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={customerExistingDue}
                        value={customSettleAmount !== '' ? customSettleAmount : customerExistingDue}
                        onChange={(e) => setCustomSettleAmount(e.target.value)}
                        placeholder={`Max ${customerExistingDue}`}
                        className="w-full px-2.5 py-1.5 bg-white border border-black rounded-lg text-xs font-bold text-black"
                      />
                    </div>
                  )}

                  {/* Quick Action: Settle Dues Only (Instant Receipt) */}
                  {cart.length === 0 && (
                    <button
                      type="button"
                      onClick={handleQuickSettleDuesOnly}
                      className="w-full py-1.5 px-2 bg-white hover:bg-neutral-100 text-black border border-black rounded-lg text-[11px] font-black flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition-transform active:scale-95"
                    >
                      <Receipt className="w-3.5 h-3.5 text-black" />
                      <span>⚡ Settle Dues Only (Generate Clearance Receipt)</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-2 bg-neutral-50 border border-neutral-300 rounded-xl text-center text-xs font-bold text-neutral-600 flex items-center justify-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                  <span>No outstanding dues for this customer</span>
                </div>
              )}
            </div>
          ) : (
            /* Custom Customer Input Fields */
            <div className="space-y-2 p-3 bg-neutral-50 border-2 border-black rounded-xl text-xs text-black">
              <p className="font-black text-black text-[11px] uppercase tracking-wide">
                Custom Invoice Customer Info (Optional Phone/Address)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customCustName}
                  onChange={(e) => setCustomCustName(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-black rounded-lg font-bold text-black placeholder-neutral-500"
                />
                <input
                  type="text"
                  placeholder="Phone (Optional)"
                  value={customCustPhone}
                  onChange={(e) => setCustomCustPhone(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-black rounded-lg text-black font-semibold placeholder-neutral-500"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={customCustAddress}
                  onChange={(e) => setCustomCustAddress(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-black rounded-lg text-black font-semibold placeholder-neutral-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="bg-white rounded-2xl border-2 border-black shadow-xs p-4 flex-1 flex flex-col justify-between space-y-4 text-black">
          
          <div>
            <div className="flex items-center justify-between pb-2 border-b-2 border-black text-xs font-black text-black">
              <span>Selected Products ({cart.length})</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleAddTypeableRow}
                  className="px-2 py-1 bg-white hover:bg-neutral-100 text-black font-black text-[11px] rounded-lg border border-black transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3 text-black" />
                  <span>+ Add Row</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-black hover:underline font-black text-[11px] cursor-pointer"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            <div className="divide-y divide-neutral-200 max-h-[260px] overflow-y-auto mt-2 space-y-2">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-black text-xs font-bold space-y-2">
                  <p>🛒 Cart is empty. Click items from catalog or add a row.</p>
                  <button
                    type="button"
                    onClick={handleAddTypeableRow}
                    className="px-3 py-1.5 bg-black text-white font-black text-xs rounded-xl cursor-pointer"
                  >
                    + Add Typeable Product Row
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="py-2 space-y-1.5">
                    {/* Item Name (Typeable) */}
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => updateCartItemName(item.productId, e.target.value)}
                        placeholder="Product / Item Name..."
                        className="flex-1 px-2 py-1 border border-black rounded-lg text-xs font-black text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-black hover:bg-neutral-200 p-1 rounded cursor-pointer border border-transparent hover:border-black"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4 text-black" />
                      </button>
                    </div>

                    {/* Price, Qty and Subtotal Controls */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      {/* Price / Rate (Typeable) */}
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-black font-black">Rate:</span>
                        <input
                          type="number"
                          min="0"
                          value={item.sellingRate}
                          onChange={(e) => updateCartItemRate(item.productId, parseFloat(e.target.value))}
                          className="w-20 px-1.5 py-0.5 border border-black rounded-lg text-xs font-black text-black text-right"
                        />
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-black font-black">Qty:</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, item.qty - 1)}
                          className="w-5 h-5 rounded border border-black bg-white hover:bg-neutral-100 text-black flex items-center justify-center font-black text-xs cursor-pointer"
                        >
                          <Minus className="w-3 h-3 text-black" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateCartQty(item.productId, parseInt(e.target.value, 10) || 1)}
                          className="w-10 text-center font-black text-xs text-black border border-black rounded py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, item.qty + 1)}
                          className="w-5 h-5 rounded border border-black bg-black text-white hover:bg-neutral-800 flex items-center justify-center font-black text-xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-white" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right w-20 font-black text-xs text-black">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Discounts, Tax & Calculations */}
          <div className="space-y-3 pt-3 border-t-2 border-black text-xs text-black">
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black text-black mb-1">Discount (रु. / %)</label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Discount Rs."
                    value={discountAmount || ''}
                    onChange={(e) => {
                      setDiscountAmount(parseFloat(e.target.value) || 0);
                      setDiscountPercent(0);
                    }}
                    className="w-full px-2.5 py-1.5 border border-black rounded-lg text-xs font-black text-black placeholder-neutral-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-black mb-1">Tax / VAT (%)</label>
                <select
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-black rounded-lg text-xs font-black bg-white text-black"
                >
                  <option value={0}>0% Tax Exempt</option>
                  <option value={13}>13% VAT</option>
                  <option value={5}>5% Service Tax</option>
                </select>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black text-black mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as Sale['paymentMethod'])}
                  className="w-full px-2 py-1.5 border border-black rounded-lg text-xs font-black bg-white text-black"
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="Online (eSewa/Khalti)">📲 Online (eSewa/Khalti)</option>
                  <option value="Card">💳 Card</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-black mb-1">Amount Paid (रु.)</label>
                <input
                  type="number"
                  min="0"
                  placeholder={`Exact: ${grandTotal}`}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 border-2 border-black rounded-lg text-xs font-black text-black"
                />
              </div>
            </div>

            {/* Subtotals & Grand Total Summary */}
            <div className="p-3.5 bg-white border-2 border-black text-black rounded-xl space-y-1.5 shadow-xs">
              <div className="flex justify-between text-black text-xs font-bold">
                <span>Subtotal:</span>
                <span className="font-black">{formatCurrency(subtotal)}</span>
              </div>

              {calculatedDiscount > 0 && (
                <div className="flex justify-between text-black text-xs font-bold">
                  <span>Discount Off:</span>
                  <span className="font-black">- {formatCurrency(calculatedDiscount)}</span>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between text-black text-xs font-bold">
                  <span>VAT ({taxPercent}%):</span>
                  <span className="font-black">+ {formatCurrency(taxAmount)}</span>
                </div>
              )}

              {previousDueToAdd > 0 && (
                <div className="flex justify-between text-black text-xs font-black pt-1 border-t border-black">
                  <span>Previous Due Added:</span>
                  <span>+ {formatCurrency(previousDueToAdd)}</span>
                </div>
              )}

              <div className="flex justify-between pt-1.5 border-t-2 border-black font-black text-base text-black">
                <span>Grand Total:</span>
                <span className="text-black">{formatCurrency(grandTotal)}</span>
              </div>

              {dueAmount > 0 ? (
                <div className="flex justify-between text-black font-black text-xs pt-1.5 border-t-2 border-black mt-1.5">
                  <span>Due Balance:</span>
                  <span>{formatCurrency(dueAmount)}</span>
                </div>
              ) : changeDue > 0 ? (
                <div className="flex justify-between text-black font-black text-xs pt-1.5 border-t-2 border-black mt-1.5">
                  <span>Change Return:</span>
                  <span>{formatCurrency(changeDue)}</span>
                </div>
              ) : null}
            </div>

            {/* Complete Sale & Print Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-xl font-black text-sm shadow-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border-2 border-black ${
                cart.length === 0
                  ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed border-neutral-400'
                  : 'bg-white hover:bg-neutral-100 text-black active:scale-95'
              }`}
            >
              <Printer className="w-5 h-5 text-black" />
              <span className="text-black font-black">Complete Sale & Print Bill (Half-A4)</span>
            </button>

          </div>

        </div>

      </div>

      {/* Quick Add Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-black max-w-md w-full space-y-4 text-black">
            <h3 className="font-black text-base text-black">Add New Customer</h3>
            
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Sharma"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-black rounded-xl text-xs font-bold text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="98XXXXXXXX"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-black rounded-xl text-xs font-bold text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-black rounded-xl text-xs font-bold text-black"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 border-2 border-black text-black text-xs font-black rounded-xl cursor-pointer hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white font-black text-xs rounded-xl shadow-xs cursor-pointer hover:bg-neutral-800 border border-black"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Custom Product / Service Billing Modal */}
      {isCustomItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-black max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 text-black">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-black flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-black" />
                <span>Add Custom Item / Service to Bill</span>
              </h3>
              <button
                onClick={() => setIsCustomItemModalOpen(false)}
                className="p-1 text-black hover:bg-neutral-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">Product / Service Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Photo Framing 16x24 inch / Laptop Repair"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-black rounded-xl text-xs font-bold text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">Selling Price (रु.) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Price in Rs."
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-black rounded-xl text-xs font-black text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(e.target.value)}
                    className="w-full px-3 py-2 border border-black rounded-xl text-xs font-black text-black"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCustomItemModalOpen(false)}
                  className="px-4 py-2 border-2 border-black text-black text-xs font-black rounded-xl cursor-pointer hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer border border-black"
                >
                  Add to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
