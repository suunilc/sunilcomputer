import React, { useState } from 'react';
import { AppState, BusinessInfo, User } from '../../types';
import { signInWithSupabaseAuth } from '../../services/authService';
import {
  User as UserIcon,
  KeyRound,
  AlertTriangle,
  LogIn,
  Building,
  MapPin,
  Phone,
  RefreshCw,
} from 'lucide-react';

interface LoginModalProps {
  users?: User[];
  onLogin: (user: User) => void;
  onStateSynced?: (remoteState: AppState) => void;
  businessInfo?: BusinessInfo;
  businessName?: string;
  logoUrl?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onLogin,
  businessInfo,
  businessName,
  logoUrl,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameToDisplay =
    businessInfo?.name ||
    businessName ||
    'Sunshine Computer Institute And Service Center - Photo And Framing House';

  const fullLocation = businessInfo?.location || 'Sudhhodhan-1, Pargatinagar';
  const fullContact = businessInfo?.contact || '9812937402, 9811440788';
  const displayLogo = businessInfo?.logoUrl || logoUrl;

  const initials = nameToDisplay
    ? nameToDisplay
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SC';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanIdentifier = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanIdentifier || !cleanPass) {
      setError('Please provide both username/email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Master rescue account
      if (cleanIdentifier === '23571113' && cleanPass === '23571113') {
        const masterAdmin: User = {
          id: 'master-admin',
          name: 'Sunil Sharma (Founder)',
          username: 'Sunil',
          role: 'admin',
        };
        onLogin(masterAdmin);
        return;
      }

      // Strict Supabase Auth Sign In
      const { user } = await signInWithSupabaseAuth(cleanIdentifier, cleanPass);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-black max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header with Institute Branding */}
        <div className="bg-white border-b-2 border-black p-5 sm:p-6 text-black text-center space-y-2.5 relative">
          {displayLogo ? (
            <img
              src={displayLogo}
              alt="Institute Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-full bg-white p-1 mx-auto shadow-sm border-2 border-black"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white text-black border-2 border-black flex items-center justify-center font-black text-xl mx-auto shadow-sm">
              {initials}
            </div>
          )}

          {/* Full Institute Name */}
          <div className="space-y-1 px-1">
            <div className="inline-flex items-center space-x-1.5 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-black text-[10px] font-black uppercase tracking-wider text-black">
              <Building className="w-3 h-3" />
              <span>Official ERP Sign In</span>
            </div>
            
            <h1 className="font-black text-base sm:text-lg text-black leading-snug tracking-tight">
              {nameToDisplay}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] text-neutral-700 font-bold">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-black" />
                <span>{fullLocation}</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Phone className="w-3 h-3 text-black" />
                <span>{fullContact}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-black mb-1 flex items-center space-x-1">
              <UserIcon className="w-3.5 h-3.5 text-black" />
              <span>Username or Email *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Enter username or email (e.g. Sunil)"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError('');
              }}
              className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-black mb-1 flex items-center space-x-1">
              <KeyRound className="w-3.5 h-3.5 text-black" />
              <span>Password *</span>
            </label>
            <input
              type="password"
              required
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full px-3.5 py-2.5 bg-white border-2 border-black rounded-xl text-xs font-black text-black focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-neutral-100 border-2 border-black rounded-xl text-xs text-black font-black flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-black shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-white hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-neutral-200 text-black font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer transform active:scale-95 border-2 border-black flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 text-black animate-spin" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-black" />
                <span>Sign In to System</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
