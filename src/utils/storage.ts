import { INITIAL_STATE } from '../data/initialData';
import { AppState } from '../types';
import { syncStateToSupabase } from '../services/supabaseService';

const STORAGE_KEY = 'sunshine_erp_state_v3';

export function loadAppState(): AppState {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      return INITIAL_STATE;
    }
    const parsed = JSON.parse(raw);
    const parsedBiz = parsed.businessInfo || {};
    return {
      ...INITIAL_STATE,
      ...parsed,
      businessInfo: {
        ...INITIAL_STATE.businessInfo,
        ...parsedBiz,
        logoUrl: parsedBiz.logoUrl !== undefined && parsedBiz.logoUrl !== '' ? parsedBiz.logoUrl : '/sunshine-logo.svg',
      },
    };
  } catch (err) {
    console.error('Failed to parse cached state', err);
    return INITIAL_STATE;
  }
}

export function saveAppState(state: AppState): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    // Direct save to Supabase tables
    syncStateToSupabase(state, false).catch((err) => {
      console.warn('Direct Supabase table save background warning:', err);
    });
  } catch (err) {
    console.error('Failed to save state', err);
  }
}

export function resetAppState(): AppState {
  saveAppState(INITIAL_STATE);
  syncStateToSupabase(INITIAL_STATE, true);
  return INITIAL_STATE;
}

export function exportBackupJSON(state: AppState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `Sunshine_ERP_Backup_${timestamp}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function validateBackupJSON(parsed: any): boolean {
  if (!parsed || typeof parsed !== 'object') return false;
  return Array.isArray(parsed.products) && Array.isArray(parsed.sales) && Array.isArray(parsed.expenses);
}
