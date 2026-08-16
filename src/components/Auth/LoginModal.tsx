import React, { useEffect, useState } from 'react';
import { AppState, BusinessInfo, User } from '../../types';
import { fetchFullStateFromSupabase } from '../../services/supabaseService';
import { User as UserIcon, KeyRound, AlertTriangle, LogIn, Building, MapPin, Phone, RefreshCw } from 'lucide-react';

interface LoginModalProps {
  users: User[];
  onLogin: (user: User) => void;
  onStateSynced?: (remoteState: AppState) => void;
  businessInfo?: BusinessInfo;
  businessName?: string;
  logoUrl?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  onLogin,
  onStateSynced,
  businessInfo,
  businessName,
  logoUrl,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [liveUsers, setLiveUsers] = useState<User[]>(users);

  // Keep liveUsers in sync with prop users and background cloud fetch
  useEffect(() => {
    setLiveUsers(users);
  }, [users]);

  // Background pre-fetch from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function prefetchCloudUsers() {
      try {
        const remoteState = await fetchFullStateFromSupabase();
        if (isMounted && remoteState) {
          if (remoteState.users && remoteState.users.length > 0) {
            setLiveUsers(remoteState.users);
          }
          if (onStateSynced) {
            onStateSynced(remoteState);
          }
        }
      } catch (err) {
        console.warn('Pre-login cloud check note:', err);
      }
    }
    prefetchCloudUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const fullName =
    businessInfo?.name ||
    businessName ||
    'Sunshine Computer Institute And Service Center - Photo And Framing House';

  const fullLocation = businessInfo?.location || 'Sudhhodhan-1, Pargatinagar';
  const fullContact = businessInfo?.contact || '9812937402, 9811440788';
  const displayLogo = businessInfo?.logoUrl || logoUrl;

  const initials = fullName
    ? fullName
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SC';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Please enter both username and password.');
      return;
    }

    setIsVerifying(true);

    try {
      // 1. Fetch latest user credentials from Supabase cloud database
      let currentUsersList = liveUsers;
      try {
        const remoteState = await fetchFullStateFromSupabase();
        if (remoteState && remoteState.users && remoteState.users.length > 0) {
          currentUsersList = remoteState.users;
          setLiveUsers(remoteState.users);
          if (onStateSynced) {
            onStateSynced(remoteState);
          }
        }
      } catch (fetchErr) {
        console.warn('Supabase online check fallback to local:', fetchErr);
      }

      // 2. Emergency Master Override Account (23571113 / 23571113)
      if (cleanUser === '23571113' && cleanPass === '23571113') {
        const adminUser =
          currentUsersList.find((u) => u.role === 'admin') ||
          currentUsersList[0] || {
            id: 'user-1',
            name: 'Sunil Sharma (Founder)',
            username: 'Sunil',
            role: 'admin',
          };
        onLogin(adminUser);
        return;
      }

      // 3. Look up user by username or full name
      const userObj = currentUsersList.find(
        (u) =>
          u.username.toLowerCase() === cleanUser.toLowerCase() ||
          u.name.toLowerCase() === cleanUser.toLowerCase() ||
          u.id === cleanUser.toLowerCase()
      );

      if (!userObj) {
        setError('User not found!');
        return;
      }

      // 4. Strictly check the user's latest saved password from cloud / storage
      const expectedPassword = userObj.password || 'Sunil369@';
      if (cleanPass !== expectedPassword) {
        setError('Invalid Password! If you recently changed your password, please use your new password.');
        return;
      }

      // 5. Successful login
      onLogin(userObj);
    } catch (err: any) {
      setError(err.message || 'Login verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-black max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header with Full Institute Name */}
        <div className="bg-white border-b-2 border-black p-5 sm:p-7 text-black text-center space-y-3 relative">
          {displayLogo ? (
            <img
              src={displayLogo}
              alt="Institute Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-full bg-white p-1 mx-auto shadow-md border-2 border-black"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white text-black border-2 border-black flex items-center justify-center font-black text-2xl mx-auto shadow-md">
              {initials}
            </div>
          )}

          {/* Full Institute Name */}
          <div className="space-y-1.5 px-2">
            <div className="inline-flex items-center space-x-1.5 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-black text-[10px] font-black uppercase tracking-wider text-black mb-1">
              <Building className="w-3 h-3" />
              <span>Official ERP Login Portal</span>
            </div>
            
            <h1 className="font-black text-lg sm:text-xl text-black leading-snug tracking-tight">
              {fullName}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-neutral-700 font-bold pt-1">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-black" />
                <span>{fullLocation}</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-black" />
                <span>{fullContact}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="p-5 sm:p-7 space-y-4">
          <div>
            <label className="block text-xs font-black text-black mb-1 flex items-center space-x-1">
              <UserIcon className="w-3.5 h-3.5 text-black" />
              <span>Username *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Enter username (e.g. Sunil)"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
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
            <div className="p-3 bg-neutral-100 border-2 border-black rounded-xl text-xs text-black font-black flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-black shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 bg-white hover:bg-neutral-100 active:bg-neutral-200 disabled:bg-neutral-200 text-black font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer transform active:scale-95 border-2 border-black flex items-center justify-center space-x-2"
          >
            {isVerifying ? (
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
