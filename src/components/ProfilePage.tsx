import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  User as UserIcon,
  Phone,
  MapPin,
  Wallet,
  Save,
  LogIn,
  LogOut,
  CheckCircle2,
  FileJson,
  Upload,
  Lightbulb,
  Bell,
  Coins,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import type { UserProfile, Transaction, AuthUser } from '../types';
import type { RecipeOrder } from '../types/recipe';
import { formatRupiah, parseRupiahInput } from '../utils/formatters';
import { loadRecipeOrdersFromStorage, formatDistanceDetail } from '../utils/recipeStore';

const WITHDRAWALS_STORAGE_KEY = 'cuanumkm_recipe_withdrawals_v1';

interface WithdrawalRecord {
  id: string;
  amount: number;
  method: string;
  accountInfo: string;
  createdAt: string;
}

interface ProfilePageProps {
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => Promise<void>;
  user: AuthUser | null;
  onLogin: () => void;
  onLogout: () => void;
  transactions: Transaction[];
  onRestoreTransactions: (imported: Transaction[]) => void;
  isFirebaseConnected: boolean;
  recipeOrders?: RecipeOrder[];
  onOrderDecision?: (orderId: string, decision: 'approved' | 'rejected') => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  onSaveProfile,
  user,
  onLogin,
  onLogout,
  transactions,
  onRestoreTransactions,
  recipeOrders,
  onOrderDecision,
}) => {
  // Compact 3-button menu state (default null so forms do not crowd the screen)
  const [activeMenu, setActiveMenu] = useState<'info' | 'notifications' | 'balance' | null>(null);

  // Business Info & Cash form states
  const [businessName, setBusinessName] = useState(profile.businessName || '');
  const [ownerName, setOwnerName] = useState(profile.ownerName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [address, setAddress] = useState(profile.address || '');
  const [initialCash, setInitialCash] = useState<number>(profile.initialCash || 0);
  const [initialCashStr, setInitialCashStr] = useState<string>(
    (profile.initialCash || 0).toLocaleString('id-ID')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Payout simulation state
  const [payoutMethod, setPayoutMethod] = useState<string>('Transfer Bank (BCA / BRI / Mandiri)');
  const [payoutAccount, setPayoutAccount] = useState<string>('');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>(() => {
    try {
      const raw = localStorage.getItem(WITHDRAWALS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WithdrawalRecord[]) : [];
    } catch {
      return [];
    }
  });
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);

  useEffect(() => {
    setBusinessName(profile.businessName || '');
    setOwnerName(profile.ownerName || '');
    setPhone(profile.phone || '');
    setAddress(profile.address || '');
    setInitialCash(profile.initialCash || 0);
    setInitialCashStr((profile.initialCash || 0).toLocaleString('id-ID'));
  }, [profile]);

  const orders = useMemo(
    () => recipeOrders ?? loadRecipeOrdersFromStorage(),
    [recipeOrders]
  );

  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'waiting_approval').length,
    [orders]
  );

  const { grossSales, platformFee, netEarnings, withdrawnTotal, activeBalance, approvedCount } =
    useMemo(() => {
      const approved = orders.filter((o) => o.status === 'approved');
      const gross = approved.reduce((sum, ord) => sum + ord.price, 0);
      const fee = Math.round(gross * 0.15);
      const net = gross - fee;
      const withdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
      const active = Math.max(0, net - withdrawn);
      return {
        grossSales: gross,
        platformFee: fee,
        netEarnings: net,
        withdrawnTotal: withdrawn,
        activeBalance: active,
        approvedCount: approved.length,
      };
    }, [orders, withdrawals]);

  const toggleMenu = (menu: 'info' | 'notifications' | 'balance') => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseRupiahInput(e.target.value);
    setInitialCash(val);
    setInitialCashStr(val > 0 ? val.toLocaleString('id-ID') : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveProfile({
        ...profile,
        businessName: businessName.trim() || 'Usaha UMKM',
        ownerName: ownerName.trim() || 'Pemilik Usaha',
        phone: phone.trim(),
        address: address.trim(),
        initialCash,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulatePayout = () => {
    if (activeBalance <= 0) return;
    const record: WithdrawalRecord = {
      id: `wd_${Date.now()}`,
      amount: activeBalance,
      method: payoutMethod,
      accountInfo: payoutAccount.trim() || `${ownerName || 'Pemilik Warung'} (${phone || 'Terdaftar'})`,
      createdAt: new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    const updated = [record, ...withdrawals];
    setWithdrawals(updated);
    try {
      localStorage.setItem(WITHDRAWALS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setPayoutAccount('');
    setPayoutNotice(
      `Simulasi pencairan dana sebesar ${formatRupiah(record.amount)} ke ${record.method} berhasil diproses!`
    );
    setTimeout(() => setPayoutNotice(null), 4500);
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      app: 'CuanUMKM',
      exportedAt: new Date().toISOString(),
      profile: {
        businessName,
        ownerName,
        phone,
        address,
        initialCash,
      },
      transactions,
    };
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute(
      'download',
      `Backup_CuanUMKM_${new Date().toISOString().slice(0, 10)}.json`
    );
    dlAnchorElem.click();
  };

  // Import JSON Backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          onRestoreTransactions(parsed.transactions);
          if (parsed.profile) {
            onSaveProfile({
              ...profile,
              ...parsed.profile,
            });
          }
          alert(`Berhasil memulihkan ${parsed.transactions.length} transaksi!`);
        } else {
          alert('Format file cadangan tidak valid.');
        }
      } catch {
        alert('Gagal membaca file JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* 1. Header Profile & Account Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-extrabold text-2xl shrink-0">
              {ownerName
                ? ownerName.charAt(0).toUpperCase()
                : businessName
                ? businessName.charAt(0).toUpperCase()
                : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {businessName || 'Usaha UMKM Anda'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Pemilik: {ownerName || 'Belum diisi'}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-teal-700 font-semibold mt-1">
                <Store className="w-3.5 h-3.5" />
                <span>Usaha Mikro, Kecil &amp; Menengah</span>
              </div>
            </div>
          </div>

          {/* Auth Status Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {user
                  ? user.provider === 'google'
                    ? 'Akun Terhubung (Google / Firebase)'
                    : 'Akun Terhubung'
                  : 'Status Akses'}
              </span>
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[170px] block">
                {user ? user.emailOrPhone || user.displayName : 'Mode Tamu (Belum Masuk)'}
              </span>
            </div>
            {user ? (
              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk / Daftar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tiga Tombol Menu Utama Ringkas di Profil */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tombol 1: Informasi Usaha & Kas */}
        <button
          type="button"
          onClick={() => toggleMenu('info')}
          className={`text-left rounded-2xl border p-4 transition-all cursor-pointer active:scale-99 flex sm:flex-col items-center sm:items-start justify-between gap-3 shadow-xs ${
            activeMenu === 'info'
              ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
              : 'bg-white hover:bg-teal-50/40 text-slate-800 border-slate-200 hover:border-teal-300'
          }`}
        >
          <div className="flex sm:w-full items-center justify-between gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                activeMenu === 'info'
                  ? 'bg-white/20 text-white'
                  : 'bg-teal-50 text-teal-600 border border-teal-100'
              }`}
            >
              <Store className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="hidden sm:flex items-center">
              {activeMenu === 'info' ? (
                <ChevronUp className="w-4 h-4 text-teal-100" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 sm:w-full">
            <h3
              className={`text-sm font-extrabold leading-snug ${
                activeMenu === 'info' ? 'text-white' : 'text-slate-800'
              }`}
            >
              Informasi Usaha &amp; Kas
            </h3>
            <p
              className={`text-[11px] mt-0.5 leading-relaxed ${
                activeMenu === 'info' ? 'text-teal-100' : 'text-slate-500'
              }`}
            >
              Edit nama warung, pemilik, No. HP, kas awal &amp; alamat toko
            </p>
          </div>

          <div className="sm:hidden shrink-0">
            {activeMenu === 'info' ? (
              <ChevronUp className="w-4 h-4 text-white" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {/* Tombol 2: Notifikasi & Status */}
        <button
          type="button"
          onClick={() => toggleMenu('notifications')}
          className={`text-left rounded-2xl border p-4 transition-all cursor-pointer active:scale-99 flex sm:flex-col items-center sm:items-start justify-between gap-3 shadow-xs ${
            activeMenu === 'notifications'
              ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
              : 'bg-white hover:bg-orange-50/40 text-slate-800 border-slate-200 hover:border-orange-300'
          }`}
        >
          <div className="flex sm:w-full items-center justify-between gap-3">
            <div
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                activeMenu === 'notifications'
                  ? 'bg-white/20 text-white'
                  : 'bg-orange-50 text-orange-600 border border-orange-100'
              }`}
            >
              <Bell className="w-5 h-5 stroke-[2.2]" />
              {pendingOrdersCount > 0 && (
                <span
                  className={`absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full text-[10px] font-black flex items-center justify-center shadow-xs ${
                    activeMenu === 'notifications'
                      ? 'bg-white text-orange-600'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {pendingOrdersCount}
                </span>
              )}
            </div>
            <div className="hidden sm:flex items-center">
              {activeMenu === 'notifications' ? (
                <ChevronUp className="w-4 h-4 text-orange-100" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 sm:w-full">
            <h3
              className={`text-sm font-extrabold leading-snug ${
                activeMenu === 'notifications' ? 'text-white' : 'text-slate-800'
              }`}
            >
              Notifikasi &amp; Status
            </h3>
            <p
              className={`text-[11px] mt-0.5 leading-relaxed ${
                activeMenu === 'notifications' ? 'text-orange-50' : 'text-slate-500'
              }`}
            >
              Pemberitahuan &amp; pesan status pembelian resep penjual
            </p>
          </div>

          <div className="sm:hidden shrink-0">
            {activeMenu === 'notifications' ? (
              <ChevronUp className="w-4 h-4 text-white" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {/* Tombol 3: Dashboard & Saldo Resep */}
        <button
          type="button"
          onClick={() => toggleMenu('balance')}
          className={`text-left rounded-2xl border p-4 transition-all cursor-pointer active:scale-99 flex sm:flex-col items-center sm:items-start justify-between gap-3 shadow-xs ${
            activeMenu === 'balance'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
              : 'bg-white hover:bg-emerald-50/40 text-slate-800 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex sm:w-full items-center justify-between gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                activeMenu === 'balance'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}
            >
              <Coins className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  activeMenu === 'balance'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {formatRupiah(activeBalance)}
              </span>
              {activeMenu === 'balance' ? (
                <ChevronUp className="w-4 h-4 text-emerald-100" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 sm:w-full">
            <h3
              className={`text-sm font-extrabold leading-snug ${
                activeMenu === 'balance' ? 'text-white' : 'text-slate-800'
              }`}
            >
              Dashboard &amp; Saldo Resep
            </h3>
            <p
              className={`text-[11px] mt-0.5 leading-relaxed ${
                activeMenu === 'balance' ? 'text-emerald-50' : 'text-slate-500'
              }`}
            >
              Pendapatan resep, saldo aktif &amp; simulasi pencairan dana
            </p>
          </div>

          <div className="sm:hidden shrink-0">
            {activeMenu === 'balance' ? (
              <ChevronUp className="w-4 h-4 text-white" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>
      </div>

      {/* PANEL 1: FORM INFORMASI USAHA & KAS (Tampil saat Tombol 1 diklik) */}
      {activeMenu === 'info' && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-teal-200 p-5 shadow-sm space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Store className="w-4 h-4 text-teal-600" />
              <span>Informasi Usaha &amp; Pengaturan Kas</span>
            </h3>
            <button
              type="button"
              onClick={() => setActiveMenu(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup panel informasi usaha"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Profil usaha berhasil disimpan!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Nama Warung / Usaha
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Contoh: Warung Makan Berkah, Toko Sembako Bu Siti"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Nama Pemilik
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Contoh: Siti Rahayu"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                No. WhatsApp / HP
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 0812-3456-7890"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Kas Awal di Laci / Rekening (Rp)
              </label>
              <div className="relative">
                <span className="font-bold text-xs text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={initialCashStr}
                  onChange={handleCashChange}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Modal uang kembalian di laci sebelum memulai jualan
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
              Alamat / Lokasi Toko
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Merdeka No. 45, Pasar Baru, Jakarta Pusat"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Informasi Usaha'}</span>
          </button>
        </form>
      )}

      {/* PANEL 2: NOTIFIKASI & STATUS (Tampil saat Tombol 2 diklik) */}
      {activeMenu === 'notifications' && (
        <div className="bg-white rounded-2xl border border-orange-200 p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-500" />
                <span>Notifikasi &amp; Status Pembelian Resep</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pantau pesan pesanan resep yang masuk dan putuskan ACC atau Tolak
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveMenu(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup panel notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
              Belum ada pemberitahuan pembelian resep saat ini.
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => {
                const isUnder15Km = ord.distanceKm < 15;
                const sellerShare = Math.round(ord.price * 0.85);

                return (
                  <div
                    key={ord.id}
                    className={`rounded-xl border p-3.5 space-y-2.5 text-xs ${
                      ord.status === 'waiting_approval' && isUnder15Km
                        ? 'bg-rose-50/70 border-rose-200'
                        : ord.status === 'approved'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-800">
                            {ord.status === 'waiting_approval'
                              ? `Pesanan Baru dari ${ord.buyerName}`
                              : ord.status === 'approved'
                              ? `Resep Di-ACC untuk ${ord.buyerName}`
                              : `Pesanan ${ord.buyerName} Ditolak`}
                          </span>
                          <span className="text-[10px] text-slate-400">• {ord.createdAt}</span>
                        </div>
                        <p className="text-slate-600">
                          Resep: <strong className="text-slate-800">{ord.recipeTitle}</strong>
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>
                            Lokasi rencana: {ord.buyerAddress}, {ord.buyerCity}
                          </span>
                        </p>
                      </div>

                      {ord.status === 'waiting_approval' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Menunggu
                        </span>
                      )}
                      {ord.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                          Di-ACC
                        </span>
                      )}
                      {ord.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold shrink-0">
                          Ditolak
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${
                          isUnder15Km
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-teal-100 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {isUnder15Km && <AlertTriangle className="w-3 h-3" />}
                        Jarak: {formatDistanceDetail(ord.distanceKm)}{' '}
                        {isUnder15Km ? '(< 15 KM)' : '(Aman > 15 KM)'}
                      </span>

                      <span className="text-[11px] font-bold text-teal-700">
                        Bagian Penjual (85%): {formatRupiah(sellerShare)}
                      </span>
                    </div>

                    {ord.status === 'waiting_approval' && onOrderDecision && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onOrderDecision(ord.id, 'approved')}
                          className="flex-1 py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>ACC Pesanan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOrderDecision(ord.id, 'rejected')}
                          className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Tolak</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PANEL 3: DASHBOARD & SALDO RESEP (Tampil saat Tombol 3 diklik) */}
      {activeMenu === 'balance' && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>Dashboard &amp; Saldo Resep</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ringkasan pendapatan penjualan resep (85% bersih untuk penjual) &amp; pencairan dana
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveMenu(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup panel saldo resep"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {payoutNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{payoutNotice}</span>
            </div>
          )}

          {/* Active Balance Highlight Card */}
          <div className="rounded-2xl bg-gradient-to-br from-teal-700 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 block">
                  Saldo Aktif Siap Cair
                </span>
                <div className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">
                  {formatRupiah(activeBalance)}
                </div>
                <p className="text-[11px] text-emerald-100 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Dari {approvedCount} penjualan resep yang telah di-ACC</span>
                </p>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-xs space-y-1 shrink-0">
                <div className="flex justify-between gap-4 text-emerald-100">
                  <span>Omzet Kotor:</span>
                  <span className="font-bold text-white">{formatRupiah(grossSales)}</span>
                </div>
                <div className="flex justify-between gap-4 text-emerald-100">
                  <span>Komisi Sistem (15%):</span>
                  <span className="font-bold text-amber-200">- {formatRupiah(platformFee)}</span>
                </div>
                <div className="flex justify-between gap-4 text-emerald-100 pt-1 border-t border-white/15">
                  <span>Total Hak Penjual (85%):</span>
                  <span className="font-extrabold text-white">{formatRupiah(netEarnings)}</span>
                </div>
                {withdrawnTotal > 0 && (
                  <div className="flex justify-between gap-4 text-emerald-200">
                    <span>Sudah Dicairkan:</span>
                    <span className="font-bold">- {formatRupiah(withdrawnTotal)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Simulasi Pencairan Dana */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-teal-600" />
              <span>Simulasi Pencairan Dana</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tujuan Pencairan
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="Transfer Bank (BCA / BRI / Mandiri)">
                    Transfer Bank (BCA / BRI / Mandiri)
                  </option>
                  <option value="E-Wallet (GoPay / OVO / DANA)">
                    E-Wallet (GoPay / OVO / DANA)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  No. Rekening / No. HP E-Wallet
                </label>
                <input
                  type="text"
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  placeholder="Contoh: BCA 1234567890 a/n Bu Siti"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulatePayout}
              disabled={activeBalance <= 0}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>
                {activeBalance > 0
                  ? `Cairkan Saldo Aktif (${formatRupiah(activeBalance)})`
                  : 'Saldo Aktif Kosong (Menunggu Pesanan Di-ACC)'}
              </span>
            </button>
          </div>

          {/* Riwayat Pencairan Simulasi */}
          {withdrawals.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Riwayat Pencairan Terakhir
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {withdrawals.slice(0, 5).map((wd) => (
                  <div
                    key={wd.id}
                    className="p-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{wd.method}</div>
                      <div className="text-[11px] text-slate-500">
                        {wd.accountInfo} • {wd.createdAt}
                      </div>
                    </div>
                    <span className="font-black text-emerald-700 shrink-0">
                      {formatRupiah(wd.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Cadangan Data & Pengaturan Tambahan (Dipertahankan seperti semula) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileJson className="w-4 h-4 text-orange-500" />
          <span>Cadangan &amp; Keamanan Data</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer text-left"
          >
            <div>
              <div className="text-slate-800 font-bold">Unduh Cadangan (JSON)</div>
              <div className="text-[11px] text-slate-500 font-normal">
                Simpan semua catatan transaksi ke HP / laptop
              </div>
            </div>
            <FileJson className="w-5 h-5 text-teal-600 shrink-0 ml-2" />
          </button>

          <label className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer text-left">
            <div>
              <div className="text-slate-800 font-bold">Pulihkan Data Cadangan</div>
              <div className="text-[11px] text-slate-500 font-normal">
                Impor file .json hasil unduhan sebelumnya
              </div>
            </div>
            <Upload className="w-5 h-5 text-orange-500 shrink-0 ml-2" />
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 4. Tips Cuan untuk Pemilik Warung (Dipertahankan seperti semula) */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-orange-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-orange-800 font-bold text-sm">
          <Lightbulb className="w-4 h-4 text-orange-600" />
          <span>Tips Praktis Keuangan Warung</span>
        </div>
        <ul className="space-y-1.5 text-xs text-orange-950/80 leading-relaxed list-disc list-inside">
          <li>
            <strong>Pisahkan dompet:</strong> Jangan campur uang pribadi/keluarga dengan uang kas warung.
          </li>
          <li>
            <strong>Catat langsung:</strong> Catat setiap kulakan bahan baku dan penjualan saat pembeli selesai bertransaksi.
          </li>
          <li>
            <strong>Cek Laba Bersih harian:</strong> Pastikan saldo harian selalu surplus untuk kelangsungan modal usaha esok hari.
          </li>
        </ul>
      </div>
    </div>
  );
};
