import React from 'react';
import { AppState } from '../../types';
import { SunshineLogo } from '../Common/SunshineLogo';
import {
  Search,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Palette,
} from 'lucide-react';
import { HeaderScale, isColorDark } from '../../utils/theme';

interface HeaderProps {
  state: AppState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPOS: () => void;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onViewInvoice?: (saleId: string) => void;
  isMobileNavOpen?: boolean;
  setIsMobileNavOpen?: (open: boolean) => void;
  currentBgHex?: string;
  menuBgHex?: string;
  textColorHex?: string;
  headerScale?: HeaderScale;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  activeTab,
  setActiveTab,
  onOpenPOS,
  onLogout,
  searchQuery,
  setSearchQuery,
  onViewInvoice,
  isMobileNavOpen = false,
  setIsMobileNavOpen,
  currentBgHex = '#ffffff',
  menuBgHex = '#ffffff',
  textColorHex = '#000000',
  headerScale = 'normal',
  onOpenSettings,
}) => {
  const currentUser = state.currentUser;
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const isMenuDark = isColorDark(menuBgHex);
  const effectiveTextColor = isMenuDark ? '#ffffff' : textColorHex;
  const borderColor = isMenuDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.85)';
  const inputBg = isMenuDark ? 'rgba(255, 255, 255, 0.15)' : '#ffffff';
  const buttonBg = isMenuDark ? 'rgba(255, 255, 255, 0.15)' : '#ffffff';
  const buttonHoverBg = isMenuDark ? 'rgba(255, 255, 255, 0.25)' : '#f5f5f5';

  const headerPadding = {
    compact: 'py-2 sm:py-2',
    normal: 'py-2.5 sm:py-3',
    large: 'py-3.5 sm:py-4',
  }[headerScale] || 'py-2.5 sm:py-3';

  // Filter sales matching invoice number, customer name, or phone
  const matchingSales = searchQuery.trim()
    ? state.sales.filter(
        (s) =>
          s.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.customerPhone.includes(searchQuery)
      )
    : [];

  return (
    <header
      className="sticky top-0 z-30 border-b-2 shadow-xs print:hidden transition-colors duration-200"
      style={{
        backgroundColor: menuBgHex,
        borderColor: borderColor,
        color: effectiveTextColor,
      }}
    >
      <div className={`px-3 sm:px-6 ${headerPadding} flex items-center justify-between gap-2`}>
        
        {/* Left Side: Mobile Menu Button + Institute Branding */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          {/* Mobile Hamburger Toggle */}
          {setIsMobileNavOpen && (
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="lg:hidden p-2 rounded-xl border cursor-pointer transition-colors shrink-0"
              style={{
                borderColor: borderColor,
                color: effectiveTextColor,
                backgroundColor: buttonBg,
              }}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {state.businessInfo.showLogoInHeader !== false && (
            (!state.businessInfo.logoUrl || state.businessInfo.logoUrl === '/sunshine-logo.svg') ? (
              <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0">
                <SunshineLogo size={44} className="w-full h-full" />
              </div>
            ) : (
              <img
                src={state.businessInfo.logoUrl}
                alt="Business Logo"
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-full p-0.5 border shadow-xs shrink-0"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: borderColor,
                }}
              />
            )
          )}
          <div className="min-w-0">
            <h1
              className="font-black text-xs sm:text-base tracking-tight truncate flex items-center gap-1.5"
              style={{ color: effectiveTextColor }}
            >
              <span>{state.businessInfo.name}</span>
            </h1>
            <p
              className="text-[10px] sm:text-xs font-semibold truncate opacity-90"
              style={{ color: effectiveTextColor }}
            >
              📍 {state.businessInfo.location} | 📞 {state.businessInfo.contact}
            </p>
          </div>
        </div>

        {/* Global Search */}
        <div className="hidden md:flex items-center mx-2 relative">
          <div className="relative flex items-center" style={{ width: '5.2cm', height: '1cm' }}>
            <Search
              className="w-4 h-4 absolute left-2.5 pointer-events-none"
              style={{ color: effectiveTextColor }}
            />
            <input
              type="text"
              placeholder="Search Invoice # / Name..."
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              className="w-full h-full pl-8 pr-2.5 border rounded-xl text-xs font-bold focus:outline-none transition-all"
              style={{
                backgroundColor: inputBg,
                borderColor: borderColor,
                color: effectiveTextColor,
              }}
            />
          </div>

          {/* Quick Invoice / Customer Search Popover */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-12 left-0 w-80 bg-white border-2 border-black rounded-2xl shadow-2xl p-2 z-50 text-xs text-black">
              <div className="px-2 py-1 text-[10px] font-black uppercase text-black flex justify-between items-center border-b border-black">
                <span>Matching Bills / Invoices</span>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="font-black hover:opacity-70 cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-black mt-1">
                {matchingSales.length === 0 ? (
                  <div className="p-3 text-center text-black font-medium text-[11px]">
                    No invoice or customer found for "{searchQuery}".
                  </div>
                ) : (
                  matchingSales.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (onViewInvoice) {
                          onViewInvoice(s.id);
                        } else {
                          setActiveTab('sales');
                        }
                        setIsSearchOpen(false);
                      }}
                      className="w-full p-2 text-left hover:bg-neutral-100 rounded-xl transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-black">{s.invoiceNo}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-neutral-100 text-black rounded border border-black">
                            {s.saleType}
                          </span>
                        </div>
                        <p className="font-extrabold text-black text-[11px] mt-0.5">{s.customerName}</p>
                        <p className="text-[10px] text-black font-medium">{s.customerPhone}</p>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-black">रु. {s.grandTotal.toLocaleString()}</p>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded border border-black ${
                            s.paymentStatus === 'Paid'
                              ? 'bg-black text-white'
                              : 'bg-white text-black'
                          }`}
                        >
                          {s.paymentStatus}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right User & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Quick Sale Button */}
          <button
            onClick={onOpenPOS}
            className="inline-flex items-center space-x-1.5 px-3 sm:px-4 py-2 sm:py-2.5 font-black text-xs rounded-xl shadow-xs border-2 transition-all cursor-pointer transform active:scale-95"
            style={{
              backgroundColor: buttonBg,
              borderColor: borderColor,
              color: effectiveTextColor,
            }}
            title="Create New Bill"
          >
            <ShoppingCart className="w-4 h-4" style={{ color: effectiveTextColor }} />
            <span className="font-black">⚡ Sale</span>
          </button>

          {/* Quick Theme Switcher Button */}
          <button
            onClick={() => {
              if (onOpenSettings) {
                onOpenSettings();
              } else {
                setActiveTab('settings');
              }
            }}
            className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 text-xs font-black rounded-xl border-2 transition-all cursor-pointer shadow-xs"
            style={{
              backgroundColor: buttonBg,
              borderColor: borderColor,
              color: effectiveTextColor,
            }}
            title="Theme, Colors & Menu Settings"
          >
            <div className="flex items-center -space-x-1">
              <div
                className="w-3 h-3 rounded-full border border-black shadow-xs shrink-0"
                style={{ backgroundColor: currentBgHex }}
                title="App Background"
              />
              <div
                className="w-3 h-3 rounded-full border border-black shadow-xs shrink-0"
                style={{ backgroundColor: menuBgHex }}
                title="Menu Background"
              />
            </div>
            <span className="hidden sm:inline font-black text-[11px]">Theme</span>
          </button>

          {/* Admin User Profile */}
          <div
            className="hidden lg:flex items-center space-x-2 pl-2 border-l"
            style={{ borderColor: borderColor }}
          >
            <div className="text-right">
              <p
                className="text-xs font-black"
                style={{ color: effectiveTextColor }}
              >
                {currentUser?.name || 'Sunil Sharma (Founder)'}
              </p>
              <div className="flex items-center justify-end space-x-1">
                <span
                  className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded border"
                  style={{
                    backgroundColor: buttonBg,
                    borderColor: borderColor,
                    color: effectiveTextColor,
                  }}
                >
                  Admin
                </span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl border transition-colors cursor-pointer"
            style={{
              backgroundColor: buttonBg,
              borderColor: borderColor,
              color: effectiveTextColor,
            }}
            title="Logout / Switch User"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: effectiveTextColor }} />
          </button>
        </div>

      </div>
    </header>
  );
};
