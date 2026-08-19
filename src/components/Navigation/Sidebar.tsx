import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Users,
  Wallet,
  LineChart,
  Clock,
  Settings,
  X,
  Database,
  Radio,
} from 'lucide-react';
import { MenuDensityScale, isColorDark } from '../../utils/theme';
import { SupabaseConnectionState, SUPABASE_PROJECT_ID } from '../../services/supabaseService';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  menuBgHex?: string;
  textColorHex?: string;
  menuWidth?: number;
  menuScale?: MenuDensityScale;
  supabaseStatus?: SupabaseConnectionState;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen = false,
  setIsMobileOpen,
  menuBgHex = '#ffffff',
  textColorHex = '#000000',
  menuWidth = 256,
  menuScale = 'normal',
  supabaseStatus = 'connected',
}) => {
  const isMenuDark = isColorDark(menuBgHex);
  const effectiveTextColor = isMenuDark ? '#ffffff' : textColorHex;
  const borderColor = isMenuDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.85)';
  const activeBg = isMenuDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
  const hoverBg = isMenuDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';

  // Scale mappings
  const scaleClasses = {
    compact: {
      padding: 'px-2.5 py-1.5',
      fontSize: 'text-[11px]',
      iconSize: 'w-3.5 h-3.5',
      gap: 'space-y-0.5',
      badgeSize: 'text-[8px] px-1 py-0.2',
    },
    normal: {
      padding: 'px-3 py-2.5',
      fontSize: 'text-xs',
      iconSize: 'w-4 h-4',
      gap: 'space-y-1',
      badgeSize: 'text-[9px] px-1.5 py-0.5',
    },
    large: {
      padding: 'px-3.5 py-3',
      fontSize: 'text-sm',
      iconSize: 'w-4.5 h-4.5',
      gap: 'space-y-1.5',
      badgeSize: 'text-[10px] px-2 py-0.5',
    },
    xlarge: {
      padding: 'px-4 py-3.5',
      fontSize: 'text-base font-black',
      iconSize: 'w-5 h-5',
      gap: 'space-y-2',
      badgeSize: 'text-[11px] px-2.5 py-1',
    },
  }[menuScale] || {
    padding: 'px-3 py-2.5',
    fontSize: 'text-xs',
    iconSize: 'w-4 h-4',
    gap: 'space-y-1',
    badgeSize: 'text-[9px] px-1.5 py-0.5',
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'pos',
      label: 'New Sale / Billing',
      icon: ShoppingCart,
      badge: 'Billing',
    },
    {
      id: 'inventory',
      label: 'Products & Inventory',
      icon: Package,
    },
    {
      id: 'sales',
      label: 'Sales & Invoices',
      icon: Receipt,
    },
    {
      id: 'customers',
      label: 'Customers & Ledgers',
      icon: Users,
    },
    {
      id: 'expenses',
      label: 'Expenses Tracker',
      icon: Wallet,
    },
    {
      id: 'reports',
      label: 'Reports & P&L',
      icon: LineChart,
    },
    {
      id: 'daily-closing',
      label: 'Daily Closing Report',
      icon: Clock,
    },
    {
      id: 'settings',
      label: 'Settings & Theme',
      icon: Settings,
      badge: 'Custom',
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div
      className="flex flex-col justify-between h-full p-3 select-none transition-colors duration-200"
      style={{
        backgroundColor: menuBgHex,
        color: effectiveTextColor,
      }}
    >
      <div className={scaleClasses.gap}>
        {/* Drawer Header on Mobile */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b lg:border-none mb-1"
          style={{ borderColor: borderColor }}
        >
          <span
            className="text-[11px] uppercase tracking-wider font-black"
            style={{ color: effectiveTextColor }}
          >
            System Menu
          </span>
          {setIsMobileOpen && (
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 rounded-lg cursor-pointer transition-colors"
              style={{ color: effectiveTextColor }}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center justify-between ${scaleClasses.padding} rounded-xl ${scaleClasses.fontSize} transition-all cursor-pointer border-2`}
              style={{
                backgroundColor: isActive ? activeBg : 'transparent',
                borderColor: isActive ? (isMenuDark ? '#ffffff' : '#000000') : 'transparent',
                color: effectiveTextColor,
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                fontWeight: isActive ? 900 : 700,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = hoverBg;
                  e.currentTarget.style.borderColor = borderColor;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon
                  className={`${scaleClasses.iconSize} shrink-0`}
                  style={{ color: effectiveTextColor }}
                />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                {item.badge && (
                  <span
                    className={`${scaleClasses.badgeSize} font-black rounded border`}
                    style={{
                      backgroundColor: isActive
                        ? (isMenuDark ? '#ffffff' : '#000000')
                        : (isMenuDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)'),
                      color: isActive
                        ? (isMenuDark ? '#000000' : '#ffffff')
                        : effectiveTextColor,
                      borderColor: isMenuDark ? '#ffffff' : '#000000',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Institute Info & Supabase sync indicator Box */}
      <div
        className="p-3 rounded-xl border-2 text-xs space-y-1 mt-4 shadow-xs"
        style={{
          backgroundColor: isMenuDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
          borderColor: borderColor,
          color: effectiveTextColor,
        }}
      >
        <div className="flex items-center justify-between">
          <p className="font-black text-xs" style={{ color: effectiveTextColor }}>
            Sunshine Computer
          </p>
          <span
            className={`inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
              supabaseStatus === 'connected'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : supabaseStatus === 'connecting'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                supabaseStatus === 'connected'
                  ? 'bg-emerald-500 animate-pulse'
                  : supabaseStatus === 'connecting'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span>{supabaseStatus === 'connected' ? 'Realtime DB' : supabaseStatus === 'connecting' ? 'Connecting' : 'Offline'}</span>
          </span>
        </div>
        <p className="text-[11px] font-semibold opacity-90">Photo & Framing House</p>
        <p className="text-[10px] font-bold opacity-80">
          📍 Sudhhodhan-1, Pargatinagar
        </p>
        <p className="text-[9px] font-mono opacity-70 truncate pt-0.5">
          Cloud ID: {SUPABASE_PROJECT_ID}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar with Dynamic Custom Width */}
      <aside
        className="hidden lg:flex border-r-2 min-h-[calc(100vh-57px)] flex-col print:hidden shrink-0 transition-all duration-200"
        style={{
          width: `${menuWidth}px`,
          backgroundColor: menuBgHex,
          borderColor: borderColor,
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Visible when isMobileOpen is true) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex print:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className="relative max-w-[85vw] h-full shadow-2xl border-r-2 z-50 flex flex-col animate-in slide-in-from-left duration-200"
            style={{
              width: `${Math.min(menuWidth, 320)}px`,
              backgroundColor: menuBgHex,
              borderColor: borderColor,
            }}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
