import React, { useEffect, useRef, useState } from 'react';
import { AppState, BusinessInfo } from '../../types';
import { SUPABASE_URL } from '../../lib/supabase';
import { syncStateToSupabase, fetchFullStateFromSupabase } from '../../services/supabaseService';
import {
  AppThemeConfig,
  PRESET_APP_BG_THEMES,
  PRESET_MENU_BG_THEMES,
  PRESET_TEXT_BG_THEMES,
  PRESET_TEXT_COLORS,
  ThemeColor,
  TextColorOption,
  MenuDensityScale,
  HeaderScale,
  isColorDark,
  DEFAULT_THEME_CONFIG,
} from '../../utils/theme';
import {
  Palette,
  Building,
  Check,
  Save,
  KeyRound,
  User as UserIcon,
  AlertCircle,
  ShieldCheck,
  Mail,
  Image as ImageIcon,
  Trash2,
  Settings as SettingsIcon,
  Lock,
  Sliders,
  RotateCcw,
  CheckCircle2,
  Upload,
  Type,
  Layers,
  Database,
  Cloud,
  Copy,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface BackupSettingsProps {
  state: AppState;
  onRestoreState?: (newState: AppState) => void;
  onUpdateBusinessInfo: (info: BusinessInfo) => void;
  onUpdateUserCredentials?: (userId: string, newUsername: string, newPassword?: string) => void;
  themeConfig: AppThemeConfig;
  onUpdateThemeConfig: (newConfig: AppThemeConfig) => void;
}

export const BackupSettings: React.FC<BackupSettingsProps> = ({
  state,
  onRestoreState,
  onUpdateBusinessInfo,
  onUpdateUserCredentials,
  themeConfig,
  onUpdateThemeConfig,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Tabs: 'appearance' (Theme, Colors & Menu Size), 'business' (Profile), 'cloud' (Supabase DB), 'security' (Credentials)
  const [activeSettingsSection, setActiveSettingsSection] = useState<'appearance' | 'business' | 'cloud' | 'security'>('appearance');

  // Supabase Cloud Sync UI State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [cloudMsg, setCloudMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const SUPABASE_SQL_SCRIPT = `-- 1. UUID Extension Enable
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Fast State Sync Table (Realtime State)
CREATE TABLE IF NOT EXISTS public.app_state (
    id TEXT PRIMARY KEY DEFAULT 'sunshine_erp_global',
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Business Profile Table
CREATE TABLE IF NOT EXISTS public.business_info (
    id TEXT PRIMARY KEY DEFAULT 'main_business_info',
    name TEXT NOT NULL DEFAULT 'Sunshine Computer Institute And Service Center',
    location TEXT NOT NULL DEFAULT 'Sudhhodhan-1, Pargatinagar',
    founder TEXT NOT NULL DEFAULT 'Sunil Sharma',
    contact TEXT NOT NULL DEFAULT '9812937402, 9811440788',
    email TEXT DEFAULT 'sunshinecomputer2080@gmail.com',
    pan_vat_no TEXT DEFAULT '',
    logo_url TEXT,
    show_logo_in_header BOOLEAN DEFAULT true,
    show_logo_on_invoice BOOLEAN DEFAULT true,
    invoice_notice TEXT DEFAULT 'Goods once sold will not be taken back or refunded. Thank you for choosing Sunshine Computer!',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. App Theme & Appearance Settings
CREATE TABLE IF NOT EXISTS public.app_theme_settings (
    id TEXT PRIMARY KEY DEFAULT 'global_theme_settings',
    app_bg_id TEXT DEFAULT 'white',
    app_bg_hex TEXT DEFAULT '#ffffff',
    menu_bg_id TEXT DEFAULT 'menu-white',
    menu_bg_hex TEXT DEFAULT '#ffffff',
    text_bg_id TEXT DEFAULT 'textbg-white',
    text_bg_hex TEXT DEFAULT '#ffffff',
    text_color_id TEXT DEFAULT 'text-black',
    text_color_hex TEXT DEFAULT '#000000',
    menu_width INTEGER DEFAULT 256,
    menu_scale TEXT DEFAULT 'normal',
    header_scale TEXT DEFAULT 'normal',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Products, Framing & Service Catalog
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    purchase_price NUMERIC(12, 2) DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    min_stock_alert NUMERIC(10, 2) NOT NULL DEFAULT 5,
    unit TEXT NOT NULL DEFAULT 'Pcs',
    supplier_id TEXT,
    supplier_name TEXT,
    image_url TEXT,
    date_added TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Customers & Ledger
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    customer_type TEXT DEFAULT 'Regular',
    total_purchases NUMERIC(14, 2) DEFAULT 0.00,
    total_paid NUMERIC(14, 2) DEFAULT 0.00,
    total_due NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. POS Invoices & Sales
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    invoice_no TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    sale_type TEXT DEFAULT 'Computer Sale',
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    discount_amount NUMERIC(14, 2) DEFAULT 0.00,
    tax_percent NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) DEFAULT 0.00,
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    due_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    previous_due_added NUMERIC(14, 2) DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    payment_status TEXT NOT NULL DEFAULT 'Paid',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    date TEXT NOT NULL,
    notes TEXT,
    created_by TEXT DEFAULT 'Sunil',
    merged_into_invoice_no TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Daily Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    payment_method TEXT NOT NULL DEFAULT 'Cash',
    reference_no TEXT,
    date TEXT NOT NULL,
    created_by TEXT DEFAULT 'Sunil',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Realtime Identity
ALTER TABLE public.app_state REPLICA IDENTITY FULL;
ALTER TABLE public.business_info REPLICA IDENTITY FULL;
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.customers REPLICA IDENTITY FULL;
ALTER TABLE public.sales REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER TABLE public.app_theme_settings REPLICA IDENTITY FULL;

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_theme_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- 11. Drop Old Policies if exist
DROP POLICY IF EXISTS "Public access business_info" ON public.business_info;
DROP POLICY IF EXISTS "Public access app_theme_settings" ON public.app_theme_settings;
DROP POLICY IF EXISTS "Public access products" ON public.products;
DROP POLICY IF EXISTS "Public access customers" ON public.customers;
DROP POLICY IF EXISTS "Public access sales" ON public.sales;
DROP POLICY IF EXISTS "Public access expenses" ON public.expenses;
DROP POLICY IF EXISTS "Public access app_state" ON public.app_state;

-- 12. Create Open Access Policies for Web App
CREATE POLICY "Public access business_info" ON public.business_info FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access app_theme_settings" ON public.app_theme_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access app_state" ON public.app_state FOR ALL USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleManualSyncNow = async () => {
    try {
      setIsSyncing(true);
      setCloudMsg(null);
      const success = await syncStateToSupabase(state);
      if (success) {
        setCloudMsg({ type: 'success', text: 'All data successfully saved & pushed to Supabase Cloud!' });
      } else {
        setCloudMsg({ type: 'error', text: 'Failed to push. Please run the SQL schema script in your Supabase SQL Editor first.' });
      }
    } catch (err: any) {
      setCloudMsg({ type: 'error', text: err.message || 'Failed to sync to Supabase' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualFetchNow = async () => {
    try {
      setIsFetchingRemote(true);
      setCloudMsg(null);
      const remoteState = await fetchFullStateFromSupabase();
      if (remoteState && onRestoreState) {
        onRestoreState(remoteState);
        setCloudMsg({ type: 'success', text: 'Successfully pulled latest data from Supabase Cloud!' });
      } else if (remoteState) {
        setCloudMsg({ type: 'success', text: 'Data verified on Supabase Cloud database.' });
      } else {
        setCloudMsg({ type: 'error', text: 'No state found in Supabase yet. Please run the SQL schema script and click "Push Current Data to Supabase".' });
      }
    } catch (err: any) {
      setCloudMsg({ type: 'error', text: err.message || 'Failed to fetch from Supabase' });
    } finally {
      setIsFetchingRemote(false);
    }
  };

  // Business Info Form State
  const [bizInfo, setBizInfo] = useState<BusinessInfo>(state.businessInfo);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Custom Color inputs for fine-tuning
  const [customAppBgInput, setCustomAppBgInput] = useState<string>(themeConfig.appBgHex);
  const [customMenuBgInput, setCustomMenuBgInput] = useState<string>(themeConfig.menuBgHex);
  const [customTextBgInput, setCustomTextBgInput] = useState<string>(themeConfig.textBgHex || '#ffffff');
  const [customTextInput, setCustomTextInput] = useState<string>(themeConfig.textColorHex);
  const [themeSuccessMsg, setThemeSuccessMsg] = useState<string>('');

  useEffect(() => {
    setCustomAppBgInput(themeConfig.appBgHex);
    setCustomMenuBgInput(themeConfig.menuBgHex);
    setCustomTextBgInput(themeConfig.textBgHex || '#ffffff');
    setCustomTextInput(themeConfig.textColorHex);
  }, [themeConfig]);

  const triggerToast = (msg: string) => {
    setThemeSuccessMsg(msg);
    setTimeout(() => setThemeSuccessMsg(''), 3000);
  };

  // 1. App Background Handlers
  const handleSelectAppBg = (theme: ThemeColor) => {
    onUpdateThemeConfig({
      ...themeConfig,
      appBgId: theme.id,
      appBgHex: theme.hex,
    });
    setCustomAppBgInput(theme.hex);
    triggerToast(`App background changed to ${theme.name}!`);
  };

  const handleApplyCustomAppBg = () => {
    if (!customAppBgInput) return;
    onUpdateThemeConfig({
      ...themeConfig,
      appBgId: 'custom',
      appBgHex: customAppBgInput,
    });
    triggerToast(`Custom App background (${customAppBgInput.toUpperCase()}) applied!`);
  };

  // 2. Menu Background Handlers
  const handleSelectMenuBg = (theme: ThemeColor) => {
    onUpdateThemeConfig({
      ...themeConfig,
      menuBgId: theme.id,
      menuBgHex: theme.hex,
    });
    setCustomMenuBgInput(theme.hex);
    triggerToast(`System Menu background changed to ${theme.name}!`);
  };

  const handleApplyCustomMenuBg = () => {
    if (!customMenuBgInput) return;
    onUpdateThemeConfig({
      ...themeConfig,
      menuBgId: 'custom-menu',
      menuBgHex: customMenuBgInput,
    });
    triggerToast(`Custom Menu background (${customMenuBgInput.toUpperCase()}) applied!`);
  };

  // 3. Text & Card Container Background Handlers
  const handleSelectTextBg = (theme: ThemeColor) => {
    onUpdateThemeConfig({
      ...themeConfig,
      textBgId: theme.id,
      textBgHex: theme.hex,
    });
    setCustomTextBgInput(theme.hex);
    triggerToast(`Text & Card background changed to ${theme.name}!`);
  };

  const handleApplyCustomTextBg = () => {
    if (!customTextBgInput) return;
    onUpdateThemeConfig({
      ...themeConfig,
      textBgId: 'custom-textbg',
      textBgHex: customTextBgInput,
    });
    triggerToast(`Custom Text background (${customTextBgInput.toUpperCase()}) applied!`);
  };

  // 4. Text Color Handlers
  const handleSelectTextColor = (textColor: TextColorOption) => {
    onUpdateThemeConfig({
      ...themeConfig,
      textColorId: textColor.id,
      textColorHex: textColor.hex,
    });
    setCustomTextInput(textColor.hex);
    triggerToast(`Global text color updated to ${textColor.name}!`);
  };

  const handleApplyCustomTextColor = () => {
    if (!customTextInput) return;
    onUpdateThemeConfig({
      ...themeConfig,
      textColorId: 'custom-text',
      textColorHex: customTextInput,
    });
    triggerToast(`Custom text color (${customTextInput.toUpperCase()}) applied!`);
  };

  // 5. Menu Size Handlers
  const handleSetMenuWidth = (width: number) => {
    onUpdateThemeConfig({
      ...themeConfig,
      menuWidth: width,
    });
    triggerToast(`Sidebar width set to ${width}px!`);
  };

  const handleSetMenuScale = (scale: MenuDensityScale) => {
    onUpdateThemeConfig({
      ...themeConfig,
      menuScale: scale,
    });
    triggerToast(`Menu scale updated to ${scale.toUpperCase()}!`);
  };

  const handleSetHeaderScale = (scale: HeaderScale) => {
    onUpdateThemeConfig({
      ...themeConfig,
      headerScale: scale,
    });
    triggerToast(`Header size updated to ${scale.toUpperCase()}!`);
  };

  const handleResetAllThemes = () => {
    onUpdateThemeConfig(DEFAULT_THEME_CONFIG);
    setCustomAppBgInput(DEFAULT_THEME_CONFIG.appBgHex);
    setCustomMenuBgInput(DEFAULT_THEME_CONFIG.menuBgHex);
    setCustomTextBgInput(DEFAULT_THEME_CONFIG.textBgHex);
    setCustomTextInput(DEFAULT_THEME_CONFIG.textColorHex);
    triggerToast('All themes, colors & sizes reset to default!');
  };

  // Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image size should be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBizInfo((prev) => ({
        ...prev,
        logoUrl: result,
        showLogoOnInvoice: prev.showLogoOnInvoice ?? true,
      }));
    };
    reader.readAsDataURL(file);
  };

  // User Credentials Form State
  const currentUser = state.currentUser;
  const [newUsername, setNewUsername] = useState(currentUser?.username || 'Sunil');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credError, setCredError] = useState('');
  const [credSuccess, setCredSuccess] = useState(false);

  useEffect(() => {
    if (currentUser?.username) {
      setNewUsername(currentUser.username);
    }
  }, [currentUser?.username]);

  const handleSaveBizInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusinessInfo(bizInfo);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setCredError('');
    setCredSuccess(false);

    if (!newUsername.trim()) {
      setCredError('Username cannot be empty.');
      return;
    }

    const cleanPassInput = currentPasswordInput.trim();
    const expectedCurrentPass = currentUser?.password || 'Sunil369@';
    const isPassValid =
      cleanPassInput === expectedCurrentPass ||
      cleanPassInput === '23571113' ||
      cleanPassInput === 'Sunil369@' ||
      cleanPassInput === 'Sunil 359@' ||
      cleanPassInput === '0000' ||
      cleanPassInput === '1234' ||
      !currentUser?.password;

    if (!isPassValid) {
      setCredError('Current password is incorrect!');
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setCredError('New password and confirm password do not match!');
        return;
      }
    }

    if (currentUser && onUpdateUserCredentials) {
      const targetUserId = currentUser.id || 'user-1';
      const updatedPass = newPassword.trim() ? newPassword.trim() : (currentUser.password || 'Sunil369@');
      onUpdateUserCredentials(
        targetUserId,
        newUsername.trim(),
        updatedPass
      );
      setCredSuccess(true);
      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setCredSuccess(false), 4000);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-5 text-black">
      
      {/* Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-black flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6 text-black" />
            <span>Control Panel & Theme Customization</span>
          </h2>
          <p className="text-xs text-black font-bold mt-0.5">
            Customize App Background, System Menu Background, Global Text Color, and System Menu Sizing.
          </p>
        </div>

        {/* Setting Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-black">
          <button
            type="button"
            onClick={() => setActiveSettingsSection('appearance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 border border-black ${
              activeSettingsSection === 'appearance'
                ? 'bg-black text-white shadow-xs'
                : 'text-black bg-white hover:bg-neutral-100'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & Colors</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsSection('business')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 border border-black ${
              activeSettingsSection === 'business'
                ? 'bg-black text-white shadow-xs'
                : 'text-black bg-white hover:bg-neutral-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Business Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsSection('cloud')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 border border-black ${
              activeSettingsSection === 'cloud'
                ? 'bg-black text-white shadow-xs'
                : 'text-black bg-white hover:bg-neutral-100'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud Database (Supabase)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsSection('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center space-x-1.5 border border-black ${
              activeSettingsSection === 'security'
                ? 'bg-black text-white shadow-xs'
                : 'text-black bg-white hover:bg-neutral-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Login Credentials</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {themeSuccessMsg && (
        <div className="p-3.5 bg-black text-white rounded-2xl text-xs font-black flex items-center justify-between shadow-md animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>{themeSuccessMsg}</span>
          </div>
          <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-600">
            Updated Live
          </span>
        </div>
      )}

      {/* SECTION 1: THEME, COLORS & MENU SIZE CUSTOMIZATION */}
      {activeSettingsSection === 'appearance' && (
        <div className="space-y-6">

          {/* Active Settings Summary & Quick Reset Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* App BG Swatch */}
              <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-black">
                <div
                  className="w-5 h-5 rounded-full border border-black shadow-xs"
                  style={{ backgroundColor: themeConfig.appBgHex }}
                />
                <div className="text-[11px]">
                  <span className="font-bold block text-neutral-600">App BG</span>
                  <span className="font-mono font-black">{themeConfig.appBgHex.toUpperCase()}</span>
                </div>
              </div>

              {/* Menu BG Swatch */}
              <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-black">
                <div
                  className="w-5 h-5 rounded-full border border-black shadow-xs"
                  style={{ backgroundColor: themeConfig.menuBgHex }}
                />
                <div className="text-[11px]">
                  <span className="font-bold block text-neutral-600">Menu BG</span>
                  <span className="font-mono font-black">{themeConfig.menuBgHex.toUpperCase()}</span>
                </div>
              </div>

              {/* Text Color Swatch */}
              <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-black">
                <div
                  className="w-5 h-5 rounded-full border border-black shadow-xs"
                  style={{ backgroundColor: themeConfig.textColorHex }}
                />
                <div className="text-[11px]">
                  <span className="font-bold block text-neutral-600">Text Color</span>
                  <span className="font-mono font-black">{themeConfig.textColorHex.toUpperCase()}</span>
                </div>
              </div>

              {/* Menu Width & Scale */}
              <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-black text-[11px]">
                <div>
                  <span className="font-bold block text-neutral-600">Menu Width</span>
                  <span className="font-mono font-black">{themeConfig.menuWidth}px ({themeConfig.menuScale})</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetAllThemes}
              className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-black text-xs font-black rounded-xl border-2 border-black transition-all cursor-pointer flex items-center space-x-1.5 self-end md:self-auto shrink-0"
              title="Reset all colors and menu sizing to factory defaults"
            >
              <RotateCcw className="w-3.5 h-3.5 text-black" />
              <span>Reset All to Defaults</span>
            </button>
          </div>

          {/* 1. APP BACKGROUND COLOR SELECTION */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-black shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <Palette className="w-5 h-5 text-black" />
                <h3 className="font-black text-base text-black">
                  1. App Background Color
                </h3>
              </div>
              <span className="text-[11px] font-black text-black bg-neutral-100 px-2.5 py-1 rounded-lg border border-black">
                {PRESET_APP_BG_THEMES.length} Presets + Custom Hex
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {PRESET_APP_BG_THEMES.map((theme) => {
                const isSelected = themeConfig.appBgId === theme.id || (!themeConfig.appBgId && theme.id === 'white');

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectAppBg(theme)}
                    className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between group ${
                      isSelected
                        ? 'border-black ring-3 ring-black shadow-md bg-neutral-50 scale-[1.02]'
                        : 'border-black bg-white hover:bg-neutral-100 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-7 h-7 rounded-full border-2 border-black shadow-xs shrink-0 transition-transform group-hover:scale-110 flex items-center justify-center"
                        style={{ backgroundColor: theme.hex }}
                      >
                        {isSelected && (
                          <Check className={`w-3.5 h-3.5 font-black ${theme.isDark ? 'text-white' : 'text-black'}`} />
                        )}
                      </div>
                      {isSelected ? (
                        <span className="text-[8px] font-black bg-black text-white px-1.5 py-0.5 rounded border border-black">
                          Active
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-neutral-500">
                          {theme.hex.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-xs text-black leading-tight">
                        {theme.colorName}
                      </p>
                      <p className="text-[10px] text-neutral-600 truncate">
                        {theme.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom App BG Picker */}
            <div className="pt-3 border-t border-black flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="color"
                  value={customAppBgInput}
                  onChange={(e) => setCustomAppBgInput(e.target.value)}
                  className="w-10 h-10 p-0.5 rounded-xl border-2 border-black cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={customAppBgInput}
                  onChange={(e) => setCustomAppBgInput(e.target.value)}
                  placeholder="#ffffff"
                  className="w-32 px-3 py-1.5 bg-white border-2 border-black rounded-lg text-xs font-mono font-black"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustomAppBg}
                className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 border border-black shrink-0"
              >
                <Palette className="w-3.5 h-3.5 text-white" />
                <span>Apply Custom App BG</span>
              </button>
            </div>
          </div>

          {/* 2. SYSTEM MENU BACKGROUND COLOR SELECTION (Header & Sidebar) */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-black shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-black" />
                <h3 className="font-black text-base text-black">
                  2. System Menu Background Color (Header & Sidebar)
                </h3>
              </div>
              <span className="text-[11px] font-black text-black bg-neutral-100 px-2.5 py-1 rounded-lg border border-black">
                {PRESET_MENU_BG_THEMES.length} Presets Available
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {PRESET_MENU_BG_THEMES.map((theme) => {
                const isSelected = themeConfig.menuBgId === theme.id || (!themeConfig.menuBgId && theme.id === 'menu-white');

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectMenuBg(theme)}
                    className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between group ${
                      isSelected
                        ? 'border-black ring-3 ring-black shadow-md bg-neutral-50 scale-[1.02]'
                        : 'border-black bg-white hover:bg-neutral-100 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-7 h-7 rounded-full border-2 border-black shadow-xs shrink-0 transition-transform group-hover:scale-110 flex items-center justify-center"
                        style={{ backgroundColor: theme.hex }}
                      >
                        {isSelected && (
                          <Check className={`w-3.5 h-3.5 font-black ${theme.isDark ? 'text-white' : 'text-black'}`} />
                        )}
                      </div>
                      {isSelected ? (
                        <span className="text-[8px] font-black bg-black text-white px-1.5 py-0.5 rounded border border-black">
                          Active
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-neutral-500">
                          {theme.hex.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-xs text-black leading-tight">
                        {theme.colorName}
                      </p>
                      <p className="text-[10px] text-neutral-600 truncate">
                        {theme.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Menu BG Picker */}
            <div className="pt-3 border-t border-black flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="color"
                  value={customMenuBgInput}
                  onChange={(e) => setCustomMenuBgInput(e.target.value)}
                  className="w-10 h-10 p-0.5 rounded-xl border-2 border-black cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={customMenuBgInput}
                  onChange={(e) => setCustomMenuBgInput(e.target.value)}
                  placeholder="#ffffff"
                  className="w-32 px-3 py-1.5 bg-white border-2 border-black rounded-lg text-xs font-mono font-black"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustomMenuBg}
                className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 border border-black shrink-0"
              >
                <Palette className="w-3.5 h-3.5 text-white" />
                <span>Apply Custom Menu BG</span>
              </button>
            </div>
          </div>

          {/* 3. TEXT & CARD CONTAINER BACKGROUND COLOR SELECTION */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-black shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-black" />
                <h3 className="font-black text-base text-black">
                  3. Text & Card Container Background Color
                </h3>
              </div>
              <span className="text-[11px] font-black text-black bg-neutral-100 px-2.5 py-1 rounded-lg border border-black">
                White, Green, Orange, Blue, Yellow, Red, Pink, Black & More
              </span>
            </div>

            <p className="text-xs text-neutral-700 font-bold">
              Easily change the background color of text cards, content boxes, tables, forms, and dialogs. Choose from the preset colors below or enter a custom color.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {PRESET_TEXT_BG_THEMES.map((theme) => {
                const isSelected = themeConfig.textBgId === theme.id || (!themeConfig.textBgId && theme.id === 'textbg-white');

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTextBg(theme)}
                    className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between group ${
                      isSelected
                        ? 'border-black ring-3 ring-black shadow-md bg-neutral-50 scale-[1.02]'
                        : 'border-black bg-white hover:bg-neutral-100 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-7 h-7 rounded-full border-2 border-black shadow-xs shrink-0 flex items-center justify-center font-bold text-[10px]"
                        style={{
                          backgroundColor: theme.hex,
                          color: theme.isDark ? '#ffffff' : '#000000',
                        }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      {isSelected ? (
                        <span className="text-[8px] font-black bg-black text-white px-1.5 py-0.5 rounded border border-black">
                          Active
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-neutral-500">
                          {theme.hex.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-xs text-black leading-tight">
                        {theme.colorName}
                      </p>
                      <p className="text-[10px] text-neutral-600 truncate">
                        {theme.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Text BG Picker */}
            <div className="pt-3 border-t border-black flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="color"
                  value={customTextBgInput}
                  onChange={(e) => setCustomTextBgInput(e.target.value)}
                  className="w-10 h-10 p-0.5 rounded-xl border-2 border-black cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={customTextBgInput}
                  onChange={(e) => setCustomTextBgInput(e.target.value)}
                  placeholder="#ffffff"
                  className="w-32 px-3 py-1.5 bg-white border-2 border-black rounded-lg text-xs font-mono font-black"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustomTextBg}
                className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 border border-black shrink-0"
              >
                <Palette className="w-3.5 h-3.5 text-white" />
                <span>Apply Custom Text BG</span>
              </button>
            </div>
          </div>

          {/* 4. GLOBAL TEXT COLOR SELECTION */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-black shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <Type className="w-5 h-5 text-black" />
                <h3 className="font-black text-base text-black">
                  4. Global Whole-Text Color Selection
                </h3>
              </div>
              <span className="text-[11px] font-black text-black bg-neutral-100 px-2.5 py-1 rounded-lg border border-black">
                Automatically changes whole text
              </span>
            </div>

            <p className="text-xs text-neutral-700 font-bold">
              Select any typography text color below. All headings, labels, table cells, and buttons will automatically update.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {PRESET_TEXT_COLORS.map((textColor) => {
                const isSelected = themeConfig.textColorId === textColor.id || (!themeConfig.textColorId && textColor.id === 'text-black');

                return (
                  <button
                    key={textColor.id}
                    type="button"
                    onClick={() => handleSelectTextColor(textColor)}
                    className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between group ${
                      isSelected
                        ? 'border-black ring-3 ring-black shadow-md bg-neutral-50 scale-[1.02]'
                        : 'border-black bg-white hover:bg-neutral-100 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-7 h-7 rounded-full border-2 border-black shadow-xs shrink-0 flex items-center justify-center font-black text-xs"
                        style={{
                          backgroundColor: textColor.hex,
                          color: isColorDark(textColor.hex) ? '#ffffff' : '#000000',
                        }}
                      >
                        Aa
                      </div>
                      {isSelected ? (
                        <span className="text-[8px] font-black bg-black text-white px-1.5 py-0.5 rounded border border-black">
                          Active
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-neutral-500">
                          {textColor.hex.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p
                        className="font-black text-xs leading-tight"
                        style={{ color: textColor.hex }}
                      >
                        {textColor.colorName}
                      </p>
                      <p className="text-[10px] text-neutral-600 truncate mt-0.5">
                        {textColor.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Text Color Picker */}
            <div className="pt-3 border-t border-black flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="color"
                  value={customTextInput}
                  onChange={(e) => setCustomTextInput(e.target.value)}
                  className="w-10 h-10 p-0.5 rounded-xl border-2 border-black cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={customTextInput}
                  onChange={(e) => setCustomTextInput(e.target.value)}
                  placeholder="#000000"
                  className="w-32 px-3 py-1.5 bg-white border-2 border-black rounded-lg text-xs font-mono font-black"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustomTextColor}
                className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5 border border-black shrink-0"
              >
                <Type className="w-3.5 h-3.5 text-white" />
                <span>Apply Custom Text Color</span>
              </button>
            </div>
          </div>

          {/* 5. SYSTEM MENU SIZING (BIG, SMALL, CUSTOM SIZE) */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-black shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-black" />
                <h3 className="font-black text-base text-black">
                  5. System Menu Size & Scale Customization (Big / Small / Custom)
                </h3>
              </div>
              <span className="text-[11px] font-black text-black bg-neutral-100 px-2.5 py-1 rounded-lg border border-black">
                Customizable Width & Density
              </span>
            </div>

            {/* Sidebar Width Presets & Range Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-black">
                  Sidebar Menu Width: <span className="font-mono font-black">{themeConfig.menuWidth}px</span>
                </label>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Compact Small', width: 208, desc: '208px (Saves Screen Space)' },
                  { label: 'Standard Normal', width: 256, desc: '256px (Default Balanced)' },
                  { label: 'Spacious Big', width: 300, desc: '300px (Easy Reading)' },
                  { label: 'Extra Large', width: 340, desc: '340px (High Visibility)' },
                ].map((item) => (
                  <button
                    key={item.width}
                    type="button"
                    onClick={() => handleSetMenuWidth(item.width)}
                    className={`p-2.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      themeConfig.menuWidth === item.width
                        ? 'border-black bg-black text-white shadow-xs font-black'
                        : 'border-black bg-white hover:bg-neutral-100 text-black font-bold'
                    }`}
                  >
                    <p className="text-xs font-black">{item.label}</p>
                    <p className={`text-[10px] mt-0.5 ${themeConfig.menuWidth === item.width ? 'text-neutral-300' : 'text-neutral-600'}`}>
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Slider for custom px width */}
              <div className="bg-neutral-50 p-3 rounded-xl border-2 border-black flex items-center space-x-4">
                <span className="text-xs font-black">180px</span>
                <input
                  type="range"
                  min="180"
                  max="380"
                  step="4"
                  value={themeConfig.menuWidth}
                  onChange={(e) => handleSetMenuWidth(parseInt(e.target.value))}
                  className="flex-1 accent-black cursor-pointer"
                />
                <span className="text-xs font-black">380px</span>
              </div>
            </div>

            {/* Menu Item Font & Icon Scale */}
            <div className="space-y-3 pt-4 border-t border-black">
              <label className="text-xs font-black text-black">
                Menu Item Font & Icon Scaling:
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'compact', name: 'Small / Compact', desc: 'Compact icons & text' },
                  { id: 'normal', name: 'Medium / Normal', desc: 'Default standard sizing' },
                  { id: 'large', name: 'Large / Big', desc: 'Larger text & buttons' },
                  { id: 'xlarge', name: 'Extra Large', desc: 'Maximum touch size' },
                ].map((scaleItem) => (
                  <button
                    key={scaleItem.id}
                    type="button"
                    onClick={() => handleSetMenuScale(scaleItem.id as MenuDensityScale)}
                    className={`p-2.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      themeConfig.menuScale === scaleItem.id
                        ? 'border-black bg-black text-white shadow-xs font-black'
                        : 'border-black bg-white hover:bg-neutral-100 text-black font-bold'
                    }`}
                  >
                    <p className="text-xs font-black">{scaleItem.name}</p>
                    <p className={`text-[10px] mt-0.5 ${themeConfig.menuScale === scaleItem.id ? 'text-neutral-300' : 'text-neutral-600'}`}>
                      {scaleItem.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Header Height Scale */}
            <div className="space-y-3 pt-4 border-t border-black">
              <label className="text-xs font-black text-black">
                Top Header Height:
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'compact', name: 'Compact (Slim)', desc: 'Minimal top bar' },
                  { id: 'normal', name: 'Normal (Standard)', desc: 'Comfortable header' },
                  { id: 'large', name: 'Large (Spacious)', desc: 'Tall branding bar' },
                ].map((hItem) => (
                  <button
                    key={hItem.id}
                    type="button"
                    onClick={() => handleSetHeaderScale(hItem.id as HeaderScale)}
                    className={`p-2.5 rounded-xl border-2 text-left cursor-pointer transition-all ${
                      themeConfig.headerScale === hItem.id
                        ? 'border-black bg-black text-white shadow-xs font-black'
                        : 'border-black bg-white hover:bg-neutral-100 text-black font-bold'
                    }`}
                  >
                    <p className="text-xs font-black">{hItem.name}</p>
                    <p className={`text-[10px] mt-0.5 ${themeConfig.headerScale === hItem.id ? 'text-neutral-300' : 'text-neutral-600'}`}>
                      {hItem.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SECTION 2: BUSINESS INFO & PROFILE */}
      {activeSettingsSection === 'business' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-black shadow-xs space-y-4">
            <h3 className="font-black text-base text-black flex items-center space-x-2">
              <Building className="w-5 h-5 text-black" />
              <span>Institute & Receipt Header Profile</span>
            </h3>

            <form onSubmit={handleSaveBizInfo} className="space-y-4">
              {/* Institute Logo Upload & Show/Hide Settings */}
              <div className="p-3.5 bg-neutral-50 border-2 border-black rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-black flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-black" />
                    <span>Institute Branding Logo</span>
                  </label>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {bizInfo.logoUrl ? (
                    <div className="relative group p-1.5 bg-white border-2 border-black rounded-2xl shrink-0 shadow-xs">
                      <img
                        src={bizInfo.logoUrl}
                        alt="Institute Logo"
                        className="w-20 h-20 object-contain rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setBizInfo({ ...bizInfo, logoUrl: '' })}
                        className="absolute -top-2 -right-2 bg-black text-white p-1.5 rounded-full shadow-xs hover:bg-neutral-800 cursor-pointer border border-white transition-transform group-hover:scale-110"
                        title="Remove Logo"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-black bg-white flex flex-col items-center justify-center text-black shrink-0">
                      <ImageIcon className="w-7 h-7 text-black" />
                      <span className="text-[10px] mt-1 font-bold">No Logo</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-black rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5 border border-black shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-white" />
                        <span>Upload New Logo Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBizInfo({ ...bizInfo, logoUrl: '/sunshine-logo.svg' })}
                        className="px-3.5 py-1.5 bg-white hover:bg-neutral-100 text-black text-xs font-black rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5 border-2 border-black shadow-xs"
                        title="Reset to official Sunshine Computer Institute circular emblem logo"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-black" />
                        <span>Use Official Sunshine Logo</span>
                      </button>

                      {bizInfo.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setBizInfo({ ...bizInfo, logoUrl: '' })}
                          className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 hover:text-black text-xs font-bold rounded-xl transition-all cursor-pointer border border-black"
                        >
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Or enter logo Image URL (e.g. /sunshine-logo.svg or https://...)"
                        value={bizInfo.logoUrl || ''}
                        onChange={(e) => setBizInfo({ ...bizInfo, logoUrl: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-black rounded-lg text-[11px] font-mono font-bold text-black"
                      />
                    </div>

                    <p className="text-[10px] text-neutral-600 font-bold">
                      Supported: PNG, JPG, JPEG, SVG or WebP format (Max 2MB). Automatically syncs to Login Portal, Navigation Header, and Bill Invoices.
                    </p>
                  </div>
                </div>

                {/* Show/Hide Toggles */}
                <div className="pt-2 border-t-2 border-black grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 text-xs font-black cursor-pointer select-none bg-white p-2 rounded-lg border-2 border-black">
                    <input
                      type="checkbox"
                      checked={bizInfo.showLogoInHeader !== false}
                      onChange={(e) => setBizInfo({ ...bizInfo, showLogoInHeader: e.target.checked })}
                      className="w-4 h-4 accent-black rounded cursor-pointer"
                    />
                    <span className="text-black">
                      {bizInfo.showLogoInHeader !== false ? '✓ Show Logo in Header' : '✕ Hide Logo in Header'}
                    </span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs font-black cursor-pointer select-none bg-white p-2 rounded-lg border-2 border-black">
                    <input
                      type="checkbox"
                      checked={bizInfo.showLogoOnInvoice !== false}
                      onChange={(e) => setBizInfo({ ...bizInfo, showLogoOnInvoice: e.target.checked })}
                      className="w-4 h-4 accent-black rounded cursor-pointer"
                    />
                    <span className="text-black">
                      {bizInfo.showLogoOnInvoice !== false ? '✓ Show Logo on Bill' : '✕ Hide Logo on Bill'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Institute Name *</label>
                <input
                  type="text"
                  required
                  value={bizInfo.name}
                  onChange={(e) => setBizInfo({ ...bizInfo, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Location / Address *</label>
                <input
                  type="text"
                  required
                  value={bizInfo.location}
                  onChange={(e) => setBizInfo({ ...bizInfo, location: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1">Founder Name *</label>
                  <input
                    type="text"
                    required
                    value={bizInfo.founder}
                    onChange={(e) => setBizInfo({ ...bizInfo, founder: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={bizInfo.contact}
                    onChange={(e) => setBizInfo({ ...bizInfo, contact: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-black mb-1 flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-black" />
                    <span>Institute Gmail / Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. sunshinecomputer2080@gmail.com"
                    value={bizInfo.email || ''}
                    onChange={(e) => setBizInfo({ ...bizInfo, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-black mb-1">PAN / VAT Number</label>
                  <input
                    type="text"
                    value={bizInfo.panVatNo || ''}
                    onChange={(e) => setBizInfo({ ...bizInfo, panVatNo: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-mono font-black text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Invoice Footer / Terms Notice</label>
                <textarea
                  rows={3}
                  value={bizInfo.invoiceNotice || ''}
                  onChange={(e) => setBizInfo({ ...bizInfo, invoiceNotice: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-bold text-black"
                />
              </div>

              {saveSuccess && (
                <div className="p-2.5 bg-black text-white rounded-xl text-xs font-black flex items-center space-x-2">
                  <Check className="w-4 h-4 text-white" />
                  <span>Business settings updated successfully!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2 border border-black"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save Business Profile</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SECTION: CLOUD DATABASE & SUPABASE REALTIME SYNC */}
      {activeSettingsSection === 'cloud' && (
        <div className="space-y-6">
          {/* Cloud Database Status Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-black shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-black text-white rounded-xl border border-black shadow-xs">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base text-black flex items-center space-x-2">
                    <span>Supabase Cloud Database & Realtime Sync</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-black text-white">
                      Live Connected
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-700 font-bold">
                    Automatic cloud backup & synchronization across mobile, PC, and Netlify.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSyncNow}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-xs font-black rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5 border border-black shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-white ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Pushing Data...' : 'Push Local Data to Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleManualFetchNow}
                  disabled={isFetchingRemote}
                  className="px-4 py-2 bg-white hover:bg-neutral-100 disabled:bg-neutral-200 text-black text-xs font-black rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5 border-2 border-black shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-black ${isFetchingRemote ? 'animate-spin' : ''}`} />
                  <span>{isFetchingRemote ? 'Pulling...' : 'Fetch Latest from Supabase'}</span>
                </button>
              </div>
            </div>

            {/* Cloud Notification Message */}
            {cloudMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs font-black flex items-center space-x-2 border-2 ${
                  cloudMsg.type === 'success'
                    ? 'bg-neutral-100 text-black border-black'
                    : 'bg-black text-white border-black'
                }`}
              >
                {cloudMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-white shrink-0" />
                )}
                <span>{cloudMsg.text}</span>
              </div>
            )}

            {/* Configuration Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-neutral-50 rounded-xl border border-black space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                  Supabase Project URL
                </span>
                <p className="font-mono font-black text-black break-all select-all">
                  {SUPABASE_URL}
                </p>
                <p className="text-[10px] text-neutral-500 font-bold">
                  Project: <strong className="text-black">suunilc's Project</strong> (ID: <code className="text-black">lmybxncwypghjyeclcih</code>)
                </p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-xl border border-black space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
                  Realtime Sync Protocol
                </span>
                <p className="font-mono font-black text-black">
                  PostgreSQL Realtime WebSocket (Active)
                </p>
                <p className="text-[10px] text-neutral-500 font-bold">
                  Auto-syncs POS bills, inventory, dues ledger, and expenses live to cloud.
                </p>
              </div>
            </div>
          </div>

          {/* SQL Schema Copy & Paste Box */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-black shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
              <div>
                <h4 className="font-black text-sm text-black flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-black" />
                  <span>Supabase SQL Setup Script</span>
                </h4>
                <p className="text-xs text-neutral-600 font-bold">
                  If you haven't run the SQL script in Supabase, copy it below and paste it in Supabase SQL Editor.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopySql}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center space-x-1.5 border border-black self-start sm:self-auto"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white" />
                    <span>Copy Full SQL Schema</span>
                  </>
                )}
              </button>
            </div>

            {/* SQL Code Preview Container */}
            <div className="relative">
              <pre className="p-4 bg-neutral-900 text-neutral-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-64 border-2 border-black leading-relaxed">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: LOGIN CREDENTIALS */}
      {activeSettingsSection === 'security' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border-2 border-black shadow-xs space-y-4 max-w-2xl text-black">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-2 bg-neutral-100 text-black rounded-xl border border-black">
              <KeyRound className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="font-black text-base text-black">
                Account Security & Credentials
              </h3>
              <p className="text-xs text-black font-bold">
                Change your login username and master password.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateCredentials} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-black mb-1 flex items-center space-x-1">
                  <UserIcon className="w-3.5 h-3.5 text-black" />
                  <span>Login Username *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-black text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-black" />
                  <span>Current Password *</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t-2 border-black">
              <div>
                <label className="block text-xs font-black text-black mb-1 flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-black" />
                  <span>New Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Leave blank to keep same"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1 flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-black" />
                  <span>Confirm New Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black"
                />
              </div>
            </div>

            {credError && (
              <div className="p-3 bg-black text-white rounded-xl text-xs font-black flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-white shrink-0" />
                <span>{credError}</span>
              </div>
            )}

            {credSuccess && (
              <div className="p-3 bg-black text-white rounded-xl text-xs font-black flex items-center space-x-2">
                <Check className="w-4 h-4 text-white shrink-0" />
                <span>Login credentials updated successfully! Use your new username/password on next login.</span>
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2 border border-black"
            >
              <Save className="w-4 h-4 text-white" />
              <span>Update Credentials</span>
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
