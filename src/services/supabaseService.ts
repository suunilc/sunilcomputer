import { supabase } from '../lib/supabase';
import { AppState, BusinessInfo, Customer, Expense, Product, Purchase, Sale, Supplier, User } from '../types';

export const GLOBAL_STATE_DOC_ID = 'sunshine_erp_global';

let isPushingState = false;
let lastPushedTimestamp = 0;

/**
 * Ensure Supabase authentication & persistent session is active
 */
export async function getSupabaseAuthSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Supabase session fetch notice:', error.message);
      return null;
    }
    return data.session;
  } catch (err) {
    console.warn('Supabase auth session exception:', err);
    return null;
  }
}

/**
 * Push all data directly into Supabase tables (app_state + individual entity tables)
 */
export async function syncStateToSupabase(state: AppState, force = false): Promise<boolean> {
  if (isPushingState && !force) return false;

  try {
    isPushingState = true;
    const now = Date.now();
    lastPushedTimestamp = now;

    // 1. Primary Sync: Realtime Full AppState Document
    const statePayload = {
      id: GLOBAL_STATE_DOC_ID,
      state: {
        products: state.products || [],
        sales: state.sales || [],
        customers: state.customers || [],
        expenses: state.expenses || [],
        suppliers: state.suppliers || [],
        purchases: state.purchases || [],
        businessInfo: state.businessInfo || {},
        users: state.users || [],
        currentUser: state.currentUser || null,
      },
      updated_at: new Date().toISOString(),
    };

    const primaryUpsert = Promise.resolve(
      supabase.from('app_state').upsert(statePayload, { onConflict: 'id' })
    );

    // 2. Direct Sync into Granular Supabase Tables (non-blocking, best-effort per table)
    const granularSyncTasks: Promise<any>[] = [primaryUpsert];

    // Table: business_info
    if (state.businessInfo) {
      granularSyncTasks.push(
        Promise.resolve(
          supabase.from('business_info').upsert({
            id: 'main_business_info',
            name: state.businessInfo.name || '',
            location: state.businessInfo.location || '',
            founder: state.businessInfo.founder || '',
            contact: state.businessInfo.contact || '',
            email: state.businessInfo.email || '',
            pan_vat_no: state.businessInfo.panVatNo || '',
            logo_url: state.businessInfo.logoUrl || '',
            show_logo_in_header: state.businessInfo.showLogoInHeader ?? true,
            show_logo_on_invoice: state.businessInfo.showLogoOnInvoice ?? true,
            invoice_notice: state.businessInfo.invoiceNotice || '',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
        )
      );
    }

    // Table: products
    if (state.products && state.products.length > 0) {
      const productRows = state.products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        brand: p.brand || '',
        purchase_price: p.purchasePrice || 0,
        selling_price: p.sellingPrice || 0,
        stock_quantity: p.stockQuantity || 0,
        min_stock_alert: p.minStockAlert || 5,
        unit: p.unit || 'Pcs',
        supplier_id: p.supplierId || null,
        supplier_name: p.supplierName || null,
        image_url: p.imageUrl || null,
        date_added: p.dateAdded || new Date().toISOString(),
        description: p.description || null,
        updated_at: new Date().toISOString(),
      }));
      granularSyncTasks.push(
        Promise.resolve(supabase.from('products').upsert(productRows, { onConflict: 'id' }))
      );
    }

    // Table: customers
    if (state.customers && state.customers.length > 0) {
      const customerRows = state.customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        address: c.address || '',
        customer_type: c.customerType || 'Regular',
        total_purchases: c.totalPurchases || 0,
        total_paid: c.totalPaid || 0,
        total_due: c.totalDue || 0,
        created_at: c.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      granularSyncTasks.push(
        Promise.resolve(supabase.from('customers').upsert(customerRows, { onConflict: 'id' }))
      );
    }

    // Table: sales
    if (state.sales && state.sales.length > 0) {
      const saleRows = state.sales.map((s) => ({
        id: s.id,
        invoice_no: s.invoiceNo,
        customer_id: s.customerId || '',
        customer_name: s.customerName || '',
        customer_phone: s.customerPhone || '',
        sale_type: s.saleType || 'Computer Sale',
        subtotal: s.subtotal || 0,
        discount_percent: s.discountPercent || 0,
        discount_amount: s.discountAmount || 0,
        tax_percent: s.taxPercent || 0,
        tax_amount: s.taxAmount || 0,
        grand_total: s.grandTotal || 0,
        paid_amount: s.paidAmount || 0,
        due_amount: s.dueAmount || 0,
        previous_due_added: s.previousDueAdded || 0,
        payment_method: s.paymentMethod || 'Cash',
        payment_status: s.paymentStatus || 'Paid',
        items: s.items || [],
        date: s.date || new Date().toISOString(),
        notes: s.notes || '',
        created_by: s.createdBy || 'Sunil',
        merged_into_invoice_no: s.mergedIntoInvoiceNo || null,
        updated_at: new Date().toISOString(),
      }));
      granularSyncTasks.push(
        Promise.resolve(supabase.from('sales').upsert(saleRows, { onConflict: 'id' }))
      );
    }

    // Table: expenses
    if (state.expenses && state.expenses.length > 0) {
      const expenseRows = state.expenses.map((e) => ({
        id: e.id,
        title: e.title || '',
        category: e.category,
        amount: e.amount || 0,
        description: e.description || '',
        payment_method: e.paymentMethod || 'Cash',
        reference_no: e.referenceNo || '',
        date: e.date || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      granularSyncTasks.push(
        Promise.resolve(supabase.from('expenses').upsert(expenseRows, { onConflict: 'id' }))
      );
    }

    // Execute all sync requests concurrently
    const results = await Promise.allSettled(granularSyncTasks);
    const primaryResult = results[0];

    if (primaryResult.status === 'rejected' || (primaryResult.status === 'fulfilled' && (primaryResult.value as any)?.error)) {
      const err = primaryResult.status === 'rejected' ? primaryResult.reason : (primaryResult.value as any)?.error;
      console.warn('Supabase state upsert warning:', err?.message || err);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Supabase sync exception:', err);
    return false;
  } finally {
    isPushingState = false;
  }
}

/**
 * Fetch full state from Supabase tables directly
 */
export async function fetchFullStateFromSupabase(): Promise<AppState | null> {
  try {
    // Check primary consolidated app_state table first
    const { data, error } = await supabase
      .from('app_state')
      .select('state, updated_at')
      .eq('id', GLOBAL_STATE_DOC_ID)
      .maybeSingle();

    if (!error && data && data.state) {
      return data.state as AppState;
    }

    // Fallback: Query granular tables if app_state document is empty
    const [
      productsRes,
      salesRes,
      customersRes,
      expensesRes,
      bizRes
    ] = await Promise.allSettled([
      Promise.resolve(supabase.from('products').select('*')),
      Promise.resolve(supabase.from('sales').select('*')),
      Promise.resolve(supabase.from('customers').select('*')),
      Promise.resolve(supabase.from('expenses').select('*')),
      Promise.resolve(supabase.from('business_info').select('*').limit(1).maybeSingle()),
    ]);

    const hasData =
      (productsRes.status === 'fulfilled' && (productsRes.value as any).data && (productsRes.value as any).data.length > 0) ||
      (salesRes.status === 'fulfilled' && (salesRes.value as any).data && (salesRes.value as any).data.length > 0);

    if (hasData) {
      const products: Product[] =
        productsRes.status === 'fulfilled' && (productsRes.value as any).data
          ? (productsRes.value as any).data.map((r: any) => ({
              id: r.id,
              sku: r.sku,
              name: r.name,
              category: r.category,
              brand: r.brand || '',
              purchasePrice: Number(r.purchase_price || 0),
              sellingPrice: Number(r.selling_price || 0),
              stockQuantity: Number(r.stock_quantity || 0),
              minStockAlert: Number(r.min_stock_alert || 5),
              unit: r.unit || 'Pcs',
              supplierId: r.supplier_id,
              supplierName: r.supplier_name,
              imageUrl: r.image_url,
              dateAdded: r.date_added || r.created_at,
              description: r.description,
            }))
          : [];

      const sales: Sale[] =
        salesRes.status === 'fulfilled' && (salesRes.value as any).data
          ? (salesRes.value as any).data.map((r: any) => ({
              id: r.id,
              invoiceNo: r.invoice_no,
              customerId: r.customer_id,
              customerName: r.customer_name,
              customerPhone: r.customer_phone,
              saleType: r.sale_type,
              subtotal: Number(r.subtotal || 0),
              discountPercent: Number(r.discount_percent || 0),
              discountAmount: Number(r.discount_amount || 0),
              taxPercent: Number(r.tax_percent || 0),
              taxAmount: Number(r.tax_amount || 0),
              grandTotal: Number(r.grand_total || 0),
              paidAmount: Number(r.paid_amount || 0),
              dueAmount: Number(r.due_amount || 0),
              previousDueAdded: Number(r.previous_due_added || 0),
              paymentMethod: r.payment_method,
              paymentStatus: r.payment_status,
              items: Array.isArray(r.items) ? r.items : [],
              date: r.date || r.created_at,
              notes: r.notes,
              createdBy: r.created_by,
              mergedIntoInvoiceNo: r.merged_into_invoice_no,
            }))
          : [];

      const customers: Customer[] =
        customersRes.status === 'fulfilled' && (customersRes.value as any).data
          ? (customersRes.value as any).data.map((r: any) => ({
              id: r.id,
              name: r.name,
              phone: r.phone,
              address: r.address,
              customerType: r.customer_type,
              totalPurchases: Number(r.total_purchases || 0),
              totalPaid: Number(r.total_paid || 0),
              totalDue: Number(r.total_due || 0),
              createdAt: r.created_at,
            }))
          : [];

      const expenses: Expense[] =
        expensesRes.status === 'fulfilled' && (expensesRes.value as any).data
          ? (expensesRes.value as any).data.map((r: any) => ({
              id: r.id,
              title: r.title,
              category: r.category,
              amount: Number(r.amount || 0),
              description: r.description,
              paymentMethod: r.payment_method,
              referenceNo: r.reference_no,
              date: r.date || r.created_at,
            }))
          : [];

      let businessInfo: Partial<BusinessInfo> = {};
      if (bizRes.status === 'fulfilled' && (bizRes.value as any).data) {
        const b = (bizRes.value as any).data as any;
        businessInfo = {
          name: b.name,
          location: b.location,
          founder: b.founder,
          contact: b.contact,
          email: b.email,
          panVatNo: b.pan_vat_no,
          logoUrl: b.logo_url,
          showLogoInHeader: b.show_logo_in_header,
          showLogoOnInvoice: b.show_logo_on_invoice,
          invoiceNotice: b.invoice_notice,
        };
      }

      return {
        currentUser: null,
        businessInfo: businessInfo as BusinessInfo,
        products,
        sales,
        customers,
        expenses,
        suppliers: [],
        purchases: [],
        users: [],
      };
    }

    return null;
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
    return null;
  }
}

/**
 * Subscribe to realtime updates from Supabase tables
 */
export function subscribeToSupabaseStateChanges(
  onRemoteUpdate: (remoteState: AppState) => void
) {
  try {
    const channel = supabase
      .channel('public:app_state')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_state',
          filter: `id=eq.${GLOBAL_STATE_DOC_ID}`,
        },
        (payload) => {
          // Avoid loopback update within 1.5 seconds of pushing
          if (Date.now() - lastPushedTimestamp < 1500) {
            return;
          }

          if (payload.new && (payload.new as any).state) {
            const newState = (payload.new as any).state as AppState;
            onRemoteUpdate(newState);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}
