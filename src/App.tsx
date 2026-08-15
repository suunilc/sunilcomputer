import React, { useEffect, useState } from 'react';
import { AppState, BusinessInfo, Customer, Expense, Product, Purchase, Sale, Supplier, User, UserRole } from './types';
import { loadAppState, saveAppState } from './utils/storage';
import { syncAllCustomerStats } from './utils/dues';
import { generateInvoiceNo } from './utils/formatters';
import {
  fetchFullStateFromSupabase,
  subscribeToSupabaseStateChanges,
  syncStateToSupabase,
} from './services/supabaseService';
import { Header } from './components/Navigation/Header';
import { Sidebar } from './components/Navigation/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProductManagement } from './components/Inventory/ProductManagement';
import { POSBilling } from './components/POS/POSBilling';
import { SalesHistory } from './components/Sales/SalesHistory';
import { CustomerManagement } from './components/Customers/CustomerManagement';
import { ExpenseManagement } from './components/Expenses/ExpenseManagement';
import { FinancialReports } from './components/Reports/FinancialReports';
import { DailyClosingReport } from './components/Reports/DailyClosingReport';
import { InvoiceModal } from './components/Billing/InvoiceModal';
import { BackupSettings } from './components/Backup/BackupSettings';
import { LoginModal } from './components/Auth/LoginModal';
import {
  AppThemeConfig,
  applyThemeToDOM,
  loadSavedThemeConfig,
  saveFullThemeConfig,
} from './utils/theme';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadAppState();
    return {
      ...loaded,
      customers: syncAllCustomerStats(loaded.customers || [], loaded.sales || []),
    };
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [posPreselectedCustomerId, setPosPreselectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Full Theme Configuration State (App BG, Menu BG, Text Color, Menu Size)
  const [themeConfig, setThemeConfig] = useState<AppThemeConfig>(() => loadSavedThemeConfig());

  // Apply theme to DOM and persist on change
  useEffect(() => {
    applyThemeToDOM(themeConfig);
    saveFullThemeConfig(themeConfig);
  }, [themeConfig]);

  const handleUpdateThemeConfig = (newConfig: AppThemeConfig) => {
    setThemeConfig(newConfig);
  };

  // Invoice Modal State
  const [activeInvoiceSale, setActiveInvoiceSale] = useState<Sale | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Mobile Navigation Drawer State
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Global Keyboard Shortcuts for Windows and all devices
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName);

      if (e.key === 'Escape') {
        if (isInvoiceModalOpen) {
          setIsInvoiceModalOpen(false);
        }
        if (isMobileNavOpen) {
          setIsMobileNavOpen(false);
        }
      }

      if (!isInput && (e.ctrlKey || e.metaKey)) {
        if (e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setActiveTab('pos');
        }
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setActiveTab('dashboard');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInvoiceModalOpen, isMobileNavOpen]);

  // Initial Sync from Supabase on App Mount
  useEffect(() => {
    let isMounted = true;

    async function initSupabaseSync() {
      try {
        const remoteState = await fetchFullStateFromSupabase();
        if (!isMounted) return;

        if (
          remoteState &&
          ((remoteState.products && remoteState.products.length > 0) ||
            (remoteState.sales && remoteState.sales.length > 0) ||
            (remoteState.customers && remoteState.customers.length > 0) ||
            remoteState.businessInfo)
        ) {
          setState((prevState) => {
            const merged: AppState = {
              ...prevState,
              products:
                remoteState.products && remoteState.products.length > 0
                  ? remoteState.products
                  : prevState.products,
              customers:
                remoteState.customers && remoteState.customers.length > 0
                  ? remoteState.customers
                  : prevState.customers,
              sales: remoteState.sales || prevState.sales,
              expenses: remoteState.expenses || prevState.expenses,
              suppliers: remoteState.suppliers || prevState.suppliers,
              purchases: remoteState.purchases || prevState.purchases,
              businessInfo: {
                ...prevState.businessInfo,
                ...(remoteState.businessInfo || {}),
              },
            };
            saveAppState(merged);
            return merged;
          });
        } else {
          // If no remote state is present in Supabase yet, push local state to initialize it
          syncStateToSupabase(state);
        }
      } catch (err) {
        console.warn('Initial Supabase sync notice:', err);
      }
    }

    initSupabaseSync();

    const unsubscribe = subscribeToSupabaseStateChanges((remoteState) => {
      if (remoteState && isMounted) {
        setState((prev) => {
          const merged: AppState = {
            ...prev,
            ...remoteState,
            businessInfo: {
              ...prev.businessInfo,
              ...(remoteState.businessInfo || {}),
            },
          };
          saveAppState(merged);
          return merged;
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Save on state change locally and auto-push to Supabase cloud
  useEffect(() => {
    saveAppState(state);
    const timer = setTimeout(() => {
      syncStateToSupabase(state);
    }, 1000);
    return () => clearTimeout(timer);
  }, [state]);

  // Handler for opening invoice modal
  const handleViewInvoice = (saleId: string) => {
    const foundSale = state.sales.find((s) => s.id === saleId);
    if (foundSale) {
      setActiveInvoiceSale(foundSale);
      setTriggerConfetti(false);
      setIsInvoiceModalOpen(true);
    }
  };

  // --- BUSINESS LOGIC HANDLERS ---

  const handleCompleteSale = (
    newSale: Sale,
    updatedCustomer?: Customer,
    stockAdjustments?: { productId: string; newStock: number }[],
    updatedStateCustomers?: Customer[]
  ) => {
    setState((prev) => {
      let updatedProducts = [...prev.products];
      if (stockAdjustments && stockAdjustments.length > 0) {
        stockAdjustments.forEach((adj) => {
          updatedProducts = updatedProducts.map((p) =>
            p.id === adj.productId ? { ...p, stockQuantity: adj.newStock } : p
          );
        });
      } else if (newSale.items && newSale.items.length > 0) {
        // Automatically deduct sold item quantities from inventory stock
        const soldQtyByProductId = new Map<string, number>();
        newSale.items.forEach((item) => {
          const qty = Number(item.qty || (item as any).quantity || 0);
          if (item.productId && qty > 0) {
            soldQtyByProductId.set(
              item.productId,
              (soldQtyByProductId.get(item.productId) || 0) + qty
            );
          }
        });

        if (soldQtyByProductId.size > 0) {
          updatedProducts = updatedProducts.map((p) => {
            const soldQty = soldQtyByProductId.get(p.id);
            if (soldQty !== undefined && soldQty > 0) {
              return {
                ...p,
                stockQuantity: Math.max(0, p.stockQuantity - soldQty),
              };
            }
            return p;
          });
        }
      }

      // If this new sale included/settled previous dues (newSale.previousDueAdded > 0),
      // mark previous unpaid invoices for this customer as merged/settled into this new sale invoice!
      let updatedPrevSales = [...prev.sales];
      if (newSale.previousDueAdded && newSale.previousDueAdded > 0) {
        let remainingToClear = newSale.previousDueAdded;
        updatedPrevSales = updatedPrevSales.map((s) => {
          if (remainingToClear <= 0) return s;
          if (s.id === newSale.id) return s;
          const isMatch =
            s.customerId === newSale.customerId ||
            (newSale.customerPhone && Boolean(s.customerPhone) && s.customerPhone === newSale.customerPhone);
          if (isMatch && (s.dueAmount || 0) > 0 && !s.mergedIntoInvoiceNo) {
            const due = s.dueAmount || 0;
            const cleared = Math.min(due, remainingToClear);
            remainingToClear -= cleared;
            const newDue = due - cleared;
            return {
              ...s,
              dueAmount: newDue,
              paymentStatus: newDue === 0 ? ('Paid' as const) : ('Partial' as const),
              mergedIntoInvoiceNo: newDue === 0 ? newSale.invoiceNo : s.mergedIntoInvoiceNo,
              notes: s.notes
                ? `${s.notes} [Due of Rs. ${cleared} merged into ${newSale.invoiceNo}]`
                : `[Due of Rs. ${cleared} merged into ${newSale.invoiceNo}]`,
            };
          }
          return s;
        });
      }

      const allSales = [newSale, ...updatedPrevSales];

      // Automatically recalculate and sync customer stats for all customers!
      let baseCustomers = updatedStateCustomers || [...prev.customers];
      if (updatedCustomer && !updatedStateCustomers) {
        const cIndex = baseCustomers.findIndex((c) => c.id === updatedCustomer.id);
        if (cIndex >= 0) {
          baseCustomers[cIndex] = updatedCustomer;
        } else {
          baseCustomers.push(updatedCustomer);
        }
      }

      const syncedCustomers = syncAllCustomerStats(baseCustomers, allSales);

      return {
        ...prev,
        sales: allSales,
        products: updatedProducts,
        customers: syncedCustomers,
      };
    });

    setActiveInvoiceSale(newSale);
    setTriggerConfetti(true);
    setIsInvoiceModalOpen(true);
  };

  const handleAddProduct = (product: Product) => {
    setState((prev) => ({
      ...prev,
      products: [product, ...prev.products],
    }));
  };

  const handleUpdateProduct = (product: Product) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === product.id ? product : p)),
    }));
  };

  const handleDeleteProduct = (productId: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }));
  };

  const handleAddCustomer = (customer: Customer) => {
    setState((prev) => {
      const exists = prev.customers.some((c) => c.id === customer.id);
      const newCustList = exists
        ? prev.customers.map((c) => (c.id === customer.id ? customer : c))
        : [...prev.customers, customer];
      return {
        ...prev,
        customers: syncAllCustomerStats(newCustList, prev.sales),
      };
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== customerId),
    }));
  };

  const handleSettleCustomerDue = (
    customerId: string,
    paidAmount: number,
    paymentMode: string = 'Cash',
    remarks?: string
  ) => {
    let createdSettlementSale: Sale | null = null;

    setState((prev) => {
      const customer = prev.customers.find((c) => c.id === customerId);
      if (!customer) return prev;

      // Mark previous unpaid sales as cleared by this settlement
      let remainingToClear = paidAmount;
      const updatedPrevSales = prev.sales.map((s) => {
        if (remainingToClear <= 0) return s;
        const isMatch =
          s.customerId === customer.id ||
          (Boolean(customer.phone) && Boolean(s.customerPhone) && s.customerPhone === customer.phone);
        if (isMatch && (s.dueAmount || 0) > 0) {
          const due = s.dueAmount || 0;
          const cleared = Math.min(due, remainingToClear);
          remainingToClear -= cleared;
          const newDue = due - cleared;
          return {
            ...s,
            dueAmount: newDue,
            paymentStatus: newDue === 0 ? ('Paid' as const) : ('Partial' as const),
            notes: s.notes
              ? `${s.notes} [Due payment Rs. ${cleared} via receipt]`
              : `[Due payment Rs. ${cleared} via receipt]`,
          };
        }
        return s;
      });

      const invoiceNo = generateInvoiceNo(prev.sales);
      const settlementSale: Sale = {
        id: `settle-${Date.now()}`,
        invoiceNo,
        saleType: 'Dues Clearance',
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        items: [
          {
            productId: 'due-settlement',
            productName: `Dues Clearance & Credit Settlement Payment ${remarks ? `(${remarks})` : ''}`.trim(),
            qty: 1,
            sellingRate: paidAmount,
            purchaseRate: 0,
            subtotal: paidAmount,
            discount: 0,
          },
        ],
        subtotal: paidAmount,
        discountAmount: 0,
        discountPercent: 0,
        taxPercent: 0,
        taxAmount: 0,
        grandTotal: paidAmount,
        paidAmount: paidAmount,
        dueAmount: 0,
        paymentMethod: (paymentMode as any) || 'Cash',
        paymentStatus: 'Paid',
        date: new Date().toISOString(),
        notes: `Dues Clearance payment of Rs. ${paidAmount.toLocaleString()} by ${customer.name}. ${remarks || ''}`.trim(),
        createdBy: prev.currentUser?.name || 'Sunil Sharma',
      };

      createdSettlementSale = settlementSale;
      const updatedSales = [settlementSale, ...updatedPrevSales];
      const updatedCustomers = syncAllCustomerStats(prev.customers, updatedSales);

      return {
        ...prev,
        customers: updatedCustomers,
        sales: updatedSales,
      };
    });

    if (createdSettlementSale) {
      setActiveInvoiceSale(createdSettlementSale);
      setTriggerConfetti(true);
      setIsInvoiceModalOpen(true);
    }
  };

  const handleDeleteSale = (saleId: string) => {
    setState((prev) => {
      const saleToDelete = prev.sales.find((s) => s.id === saleId);
      const remainingSales = prev.sales.filter((s) => s.id !== saleId);

      let updatedProducts = [...prev.products];
      if (saleToDelete && saleToDelete.items && saleToDelete.items.length > 0) {
        const returnedQtyByProductId = new Map<string, number>();
        saleToDelete.items.forEach((item) => {
          const qty = Number(item.qty || (item as any).quantity || 0);
          if (item.productId && qty > 0) {
            returnedQtyByProductId.set(
              item.productId,
              (returnedQtyByProductId.get(item.productId) || 0) + qty
            );
          }
        });

        if (returnedQtyByProductId.size > 0) {
          updatedProducts = updatedProducts.map((p) => {
            const returnedQty = returnedQtyByProductId.get(p.id);
            if (returnedQty !== undefined && returnedQty > 0) {
              return {
                ...p,
                stockQuantity: p.stockQuantity + returnedQty,
              };
            }
            return p;
          });
        }
      }

      return {
        ...prev,
        products: updatedProducts,
        sales: remainingSales,
        customers: syncAllCustomerStats(prev.customers, remainingSales),
      };
    });
  };

  const handleAddExpense = (expense: Expense) => {
    setState((prev) => ({
      ...prev,
      expenses: [expense, ...prev.expenses],
    }));
  };

  const handleDeleteExpense = (expenseId: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== expenseId),
    }));
  };

  const handleUpdateBusinessInfo = (info: BusinessInfo) => {
    setState((prev) => ({
      ...prev,
      businessInfo: info,
    }));
  };

  const handleUpdateUserCredentials = (userId: string, newUsername: string, newPassword?: string) => {
    setState((prev) => {
      const updatedUsers = (prev.users || []).map((u) => {
        if (u.id === userId || u.username === (prev.currentUser?.username || 'Sunil')) {
          return {
            ...u,
            username: newUsername,
            name: newUsername,
            ...(newPassword ? { password: newPassword } : {}),
          };
        }
        return u;
      });

      let updatedCurrent = prev.currentUser;
      if (updatedCurrent) {
        updatedCurrent = {
          ...updatedCurrent,
          username: newUsername,
          name: newUsername,
          ...(newPassword ? { password: newPassword } : {}),
        };
      }

      return {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrent,
      };
    });
  };

  if (!isLoggedIn) {
    return (
      <LoginModal
        users={state.users}
        businessInfo={state.businessInfo}
        onLogin={(user) => {
          setState((prev) => ({ ...prev, currentUser: user }));
          setIsLoggedIn(true);
        }}
      />
    );
  }

  const currentUserRole = state.currentUser?.role || 'admin';

  return (
    <div
      className="min-h-screen flex flex-col font-sans antialiased selection:bg-black selection:text-white transition-colors duration-200"
      style={{
        backgroundColor: themeConfig.appBgHex,
        color: themeConfig.textColorHex,
      }}
    >
      
      {/* Top Header */}
      <Header
        state={state}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPOS={() => {
          setActiveTab('pos');
          setIsMobileNavOpen(false);
        }}
        onLogout={() => setIsLoggedIn(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onViewInvoice={handleViewInvoice}
        isMobileNavOpen={isMobileNavOpen}
        setIsMobileNavOpen={setIsMobileNavOpen}
        currentBgHex={themeConfig.appBgHex}
        menuBgHex={themeConfig.menuBgHex}
        textColorHex={themeConfig.textColorHex}
        headerScale={themeConfig.headerScale}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Main Body Layout */}
      <div
        className="flex-1 flex overflow-hidden relative"
        style={{
          backgroundColor: themeConfig.appBgHex,
          color: themeConfig.textColorHex,
        }}
      >
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileNavOpen}
          setIsMobileOpen={setIsMobileNavOpen}
          menuBgHex={themeConfig.menuBgHex}
          textColorHex={themeConfig.textColorHex}
          menuWidth={themeConfig.menuWidth}
          menuScale={themeConfig.menuScale}
        />

        {/* Content Region */}
        <main
          className="flex-1 overflow-y-auto min-w-0 pb-12 w-full"
          style={{
            backgroundColor: themeConfig.appBgHex,
            color: themeConfig.textColorHex,
          }}
        >
          
          {activeTab === 'dashboard' && (
            <Dashboard
              state={state}
              setActiveTab={setActiveTab}
              onOpenPOS={() => setActiveTab('pos')}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {activeTab === 'pos' && (
            <POSBilling
              state={state}
              preselectedCustomerId={posPreselectedCustomerId}
              onClearPreselectedCustomer={() => setPosPreselectedCustomerId(null)}
              onCompleteSale={handleCompleteSale}
              onAddCustomer={handleAddCustomer}
            />
          )}

          {activeTab === 'inventory' && (
            <ProductManagement
              state={state}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              userRole={currentUserRole}
            />
          )}

          {activeTab === 'sales' && (
            <SalesHistory
              state={state}
              onViewInvoice={handleViewInvoice}
              onDeleteSale={handleDeleteSale}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerManagement
              state={state}
              onAddCustomer={handleAddCustomer}
              onSettleDue={handleSettleCustomerDue}
              onDeleteCustomer={handleDeleteCustomer}
              onOpenPOS={() => setActiveTab('pos')}
              onOpenPOSWithCustomer={(custId) => {
                setPosPreselectedCustomerId(custId);
                setActiveTab('pos');
              }}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseManagement
              state={state}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'reports' && (
            <FinancialReports state={state} />
          )}

          {activeTab === 'daily-closing' && (
            <DailyClosingReport state={state} />
          )}

          {activeTab === 'settings' && (
            <BackupSettings
              state={state}
              onRestoreState={(newState) => setState(newState)}
              onUpdateBusinessInfo={handleUpdateBusinessInfo}
              onUpdateUserCredentials={handleUpdateUserCredentials}
              themeConfig={themeConfig}
              onUpdateThemeConfig={handleUpdateThemeConfig}
            />
          )}

        </main>
      </div>

      {/* Printable Invoice Modal */}
      {isInvoiceModalOpen && activeInvoiceSale && (
        <InvoiceModal
          sale={activeInvoiceSale}
          businessInfo={state.businessInfo}
          onClose={() => setIsInvoiceModalOpen(false)}
          onDeleteSale={handleDeleteSale}
          triggerConfetti={triggerConfetti}
        />
      )}

    </div>
  );
}
