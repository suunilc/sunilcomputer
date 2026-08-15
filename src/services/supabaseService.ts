import { supabase } from '../lib/supabase';
import { AppState } from '../types';

export const GLOBAL_STATE_DOC_ID = 'sunshine_erp_global';

let isPushingState = false;
let lastPushedTimestamp = 0;

/**
 * Push full AppState into Supabase app_state table
 */
export async function syncStateToSupabase(state: AppState): Promise<boolean> {
  if (isPushingState) return false;

  try {
    isPushingState = true;
    const now = Date.now();
    lastPushedTimestamp = now;

    const payload = {
      id: GLOBAL_STATE_DOC_ID,
      state: {
        products: state.products || [],
        sales: state.sales || [],
        customers: state.customers || [],
        expenses: state.expenses || [],
        suppliers: state.suppliers || [],
        purchases: state.purchases || [],
        businessInfo: state.businessInfo || {},
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('app_state')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase sync warning:', error.message);
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
 * Fetch full state from Supabase app_state table
 */
export async function fetchFullStateFromSupabase(): Promise<AppState | null> {
  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('state, updated_at')
      .eq('id', GLOBAL_STATE_DOC_ID)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return null;
    }

    if (data && data.state) {
      return data.state as AppState;
    }

    return null;
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
    return null;
  }
}

/**
 * Subscribe to realtime updates from Supabase app_state table
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
          // Avoid self-triggered loops within 1.5 seconds of pushing
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
