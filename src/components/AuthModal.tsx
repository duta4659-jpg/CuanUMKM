import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import type { AuthUser } from '../types';
import {
  loginWithGoogle,
  registerManualAccount,
  loginManualAccount,
  requestPasswordReset,
} from '../firebase';
import { BrandIcon } from './BrandIcon';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateMessage?: string | null;
  initialMode?: 'login' | 'register';
  onAuthSuccess: (user: AuthUser, businessName?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  gateMessage,
  initialMode = 'login',
  onAuthSuccess,
}) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [businessName, setBusinessName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetSentInfo, setResetSentInfo] = useState<{
    target: string;
    sentViaFirebase: boolean;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setView(initialMode);
      setErrorMsg('');
      setResetSentInfo(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorMsg(
        'Sedang dalam mode offline. Masuk dengan Google membutuhkan internet, atau gunakan akun manual lokal.'
      );
      return;
    }
    setIsLoading(true);
    try {
      const fbUser = await loginWithGoogle();
      const authUser: AuthUser = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'Pemilik Usaha',
        emailOrPhone: fbUser.email || '',
        photoURL: fbUser.photoURL,
        provider: 'google',
      };
      onAuthSuccess(authUser);
      onClose();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(
          err?.message ||
            'Gagal masuk dengan Google. Silakan coba lagi atau daftar manual di bawah.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (view === 'register') {
        const res = await registerManualAccount(businessName, identifier, password);
        onAuthSuccess(res.user, businessName.trim());
        onClose();
      } else if (view === 'login') {
        const res = await loginManualAccount(identifier, password);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan. Silakan periksa kembali data Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await requestPasswordReset(resetEmail);
      setResetSentInfo(res);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Mohon masukkan email yang valid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            {view === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setErrorMsg('');
                  setResetSentInfo(null);
                }}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                aria-label="Kembali ke Masuk"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-8 h-8 rounded-lg shadow-xs shrink-0 overflow-hidden">
              <BrandIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800 leading-tight">
                {view === 'login' && 'Masuk ke CuanUMKM'}
                {view === 'register' && 'Daftar Akun Usaha'}
                {view === 'forgot' && 'Pemulihan Akun'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {view === 'forgot'
                  ? 'Reset kata sandi dengan mudah'
                  : 'Simpan data & buka semua fitur UMKM'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Friendly Gate Message */}
          {gateMessage && view !== 'forgot' && (
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-semibold text-teal-900 leading-relaxed">
                {gateMessage}
              </p>
            </div>
          )}

          {/* Error alert */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot' ? (
            <div className="space-y-4">
              {!resetSentInfo ? (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                    Masukkan <strong>Email</strong> yang Anda daftarkan sebelumnya. Kami akan mengirimkan tautan atau petunjuk pemulihan kata sandi.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Email Terdaftar
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="contoh@email.com"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{isLoading ? 'Memproses...' : 'Kirim Tautan Pemulihan'}</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4 text-center py-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-extrabold text-slate-800">
                      Tautan Pemulihan Terkirim!
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {resetSentInfo.sentViaFirebase
                        ? `Tautan atur ulang kata sandi telah dikirim ke ${resetSentInfo.target}.`
                        : `Simulasi pengiriman tautan pemulihan berhasil dikirim ke ${resetSentInfo.target}.`}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 space-y-1.5">
                    <p className="font-bold text-slate-800">Langkah Selanjutnya:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600">
                      <li>Buka kotak masuk (Inbox) atau folder Spam email Anda.</li>
                      <li>Klik tautan pemulihan kata sandi dari CuanUMKM.</li>
                      <li>Buat kata sandi baru yang mudah diingat lalu masuk kembali.</li>
                    </ol>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      setResetSentInfo(null);
                      setErrorMsg('');
                    }}
                    className="w-full py-3.5 px-5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md cursor-pointer"
                  >
                    Kembali ke Halaman Masuk
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* VIEW: LOGIN & REGISTER */
            <>
              {/* Quick Google Sign-In at Top */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center justify-center gap-3 shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {/* Google SVG Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>Masuk dengan Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  atau cara manual
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              {/* Tabs: Masuk | Daftar */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    view === 'login'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk Akun</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView('register');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    view === 'register'
                      ? 'bg-white text-teal-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftar Baru</span>
                </button>
              </div>

              {/* Manual Form */}
              <form onSubmit={handleManualSubmit} className="space-y-3.5">
                {view === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Nama Usaha (Otomatis Jadi Nama Akun)
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Contoh: Bakpao Eliza"
                        required
                        maxLength={100}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Email atau Nomor Telepon
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="contoh@email.com atau 08123456789"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Kata Sandi
                    </label>
                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setView('forgot');
                          setResetEmail(identifier.includes('@') ? identifier : '');
                          setErrorMsg('');
                        }}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                      >
                        Lupa Kata Sandi?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        view === 'register'
                          ? 'Minimal 6 karakter'
                          : 'Masukkan kata sandi'
                      }
                      required
                      minLength={6}
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-black text-sm sm:text-base shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Memproses...</span>
                  ) : view === 'register' ? (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>Daftar & Masuk Sekarang</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Masuk Sekarang</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
