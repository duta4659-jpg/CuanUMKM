import React, { useRef } from 'react';
import { Store, Cloud, CloudOff, LogIn, LogOut } from 'lucide-react';
import type { AuthUser } from '../types';

interface HeaderProps {
  businessName: string;
  user: AuthUser | null;
  onLogin: () => void;
  onLogout: () => void;
  isFirebaseConnected: boolean;
  onSecretLogoTap?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  businessName,
  user,
  onLogin,
  onLogout,
  isFirebaseConnected,
  onSecretLogoTap,
}) => {
  const tapCountRef = useRef<number>(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    if (!onSecretLogoTap) return;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    tapCountRef.current += 1;

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      tapTimerRef.current = null;
      onSecretLogoTap();
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      tapTimerRef.current = null;
    }, 2500);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-teal-100 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand & Store Name */}
        <div
          onClick={handleLogoTap}
          className="flex items-center gap-3 select-none cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center">
              C<span className="text-orange-300">$</span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">
                Cuan<span className="text-orange-500">UMKM</span>
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded">
                Warung
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[180px] sm:max-w-xs flex items-center gap-1 mt-0.5">
              <Store className="w-3 h-3 text-teal-600 inline shrink-0" />
              <span>{businessName || 'Warung Berkah UMKM'}</span>
            </p>
          </div>
        </div>

        {/* Firebase & Account Status */}
        <div className="flex items-center gap-2">
          {/* Cloud Sync Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isFirebaseConnected
                ? 'bg-teal-50 text-teal-700 border-teal-200'
                : user
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={
              isFirebaseConnected
                ? 'Terhubung aman ke Firebase Cloud Firestore'
                : user
                ? 'Akun usaha aktif'
                : 'Mode Tamu — Catatan tersimpan di perangkat ini'
            }
          >
            {isFirebaseConnected ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                <span>Firebase Aktif</span>
              </>
            ) : user ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span>Akun Aktif</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Mode Tamu</span>
              </>
            )}
          </div>

          {/* User Auth Action */}
          {user ? (
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Pemilik'}
                  className="w-8 h-8 rounded-full border-2 border-teal-500 shadow-xs object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs border border-teal-300"
                  title={user.displayName}
                >
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <button
                onClick={onLogout}
                title="Keluar Akun"
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm shadow-teal-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Masuk / Daftar</span>
              <span className="xs:hidden">Masuk</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

