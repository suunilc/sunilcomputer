import { INITIAL_STATE } from '../data/initialData';
import { AppState, BusinessInfo, Customer, Expense, Product, Purchase, Sale, Supplier, User } from '../types';

const STORAGE_KEY = 'sunshine_erp_state_v3';

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveAppState(INITIAL_STATE);
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
    console.error('Failed to load state from localStorage', err);
    return INITIAL_STATE;
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage', err);
  }
}

export function resetAppState(): AppState {
  saveAppState(INITIAL_STATE);
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
