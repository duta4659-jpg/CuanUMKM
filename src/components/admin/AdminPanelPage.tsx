import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
  AlertOctagon,
  MapPin,
  Check,
  X,
  Store,
  User,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  CookingPot,
  KeyRound,
  ShoppingBag,
  Eye,
} from 'lucide-react';
import type { Recipe, RecipeOrder } from '../../types/recipe';
import { formatRupiah } from '../../utils/formatters';
import { formatDistanceDetail, getAdminPin, setAdminPin } from '../../utils/recipeStore';

interface AdminPanelPageProps {
  orders: RecipeOrder[];
  recipes: Recipe[];
  onOrderDecision?: (orderId: string, decision: 'approved' | 'rejected') => void;
  onRecipeDecision: (recipeId: string, decision: 'approved' | 'rejected') => void;
  onExit: () => void;
}

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({
  orders,
  recipes,
  onRecipeDecision,
  onExit,
}) => {
  const [activeSection, setActiveSection] = useState<'orders' | 'submissions'>('orders');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting_approval' | 'approved' | 'rejected'>('all');
  const [showPinEditor, setShowPinEditor] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinSavedNotice, setPinSavedNotice] = useState(false);

  // Summary counters
  const stats = useMemo(() => {
    const waitingCount = orders.filter((o) => o.status === 'waiting_approval').length;
    const redWarningCount = orders.filter((o) => o.distanceKm < 15).length;
    const approvedCount = orders.filter((o) => o.status === 'approved').length;
    const rejectedCount = orders.filter((o) => o.status === 'rejected').length;
    const reviewRecipesCount = recipes.filter((r) => r.status === 'review').length;
    return {
      total: orders.length,
      waitingCount,
      redWarningCount,
      approvedCount,
      rejectedCount,
      reviewRecipesCount,
    };
  }, [orders, recipes]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  // Sort recipes so 'review' submissions appear first
  const sortedRecipes = useMemo(() => {
    const priority = { review: 0, approved: 1, rejected: 2 };
    return [...recipes].sort((a, b) => priority[a.status] - priority[b.status]);
  }, [recipes]);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) return;
    setAdminPin(newPin);
    setNewPin('');
    setShowPinEditor(false);
    setPinSavedNotice(true);
    setTimeout(() => setPinSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-10 animate-in fade-in duration-150">
      {/* Top Admin Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 shadow-lg border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Panel Moderasi Admin
                </h2>
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider">
                  Rahasia Pemilik
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Pantau jarak lokasi transaksi resep (&lt; 15 KM) &amp; kurasi pengajuan resep baru dari penjual.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowPinEditor((v) => !v)}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Ubah Sandi Pemilik"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>Ubah Sandi</span>
            </button>
            <button
              type="button"
              onClick={onExit}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Keluar Admin</span>
            </button>
          </div>
        </div>

        {/* Optional PIN Editor */}
        {showPinEditor && (
          <form
            onSubmit={handleSavePin}
            className="mt-4 pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder={`Sandi baru (minimal 4 karakter, saat ini: ${getAdminPin()})`}
              minLength={4}
              required
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs cursor-pointer"
            >
              Simpan Sandi Baru
            </button>
          </form>
        )}

        {pinSavedNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Kata sandi pemilik berhasil diperbarui.</span>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-700/70">
          <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Menunggu ACC
            </span>
            <span className="text-lg font-black text-amber-300">
              {stats.waitingCount}
            </span>
          </div>
          <div className="rounded-xl bg-rose-500/15 border border-rose-400/30 p-2.5">
            <span className="text-[10px] text-rose-200 uppercase font-bold block">
              Peringatan &lt; 15 KM
            </span>
            <span className="text-lg font-black text-rose-300">
              {stats.redWarningCount}
            </span>
          </div>
          <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/30 p-2.5">
            <span className="text-[10px] text-emerald-200 uppercase font-bold block">
              Sudah Di-ACC
            </span>
            <span className="text-lg font-black text-emerald-300">
              {stats.approvedCount}
            </span>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Ditolak
            </span>
            <span className="text-lg font-black text-slate-200">
              {stats.rejectedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Section Switcher: Permintaan Pesanan Resep vs Kurasi Resep Penjual */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveSection('orders')}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'orders'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Permintaan Resep ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('submissions')}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSection === 'submissions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CookingPot className="w-4 h-4" />
          <span>
            Kurasi Resep Penjual
            {stats.reviewRecipesCount > 0 ? ` (${stats.reviewRecipesCount} Baru)` : ` (${recipes.length})`}
          </span>
        </button>
      </div>

      {/* SECTION 1: DAFTAR PERMINTAAN PESANAN RESEP MASUK (PEMANTAUAN / MONITORING) */}
      {activeSection === 'orders' && (
        <div className="space-y-3">
          {/* Monitoring-only banner */}
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-2.5">
            <Eye className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Mode Pemantauan (Monitoring):</strong> Daftar ini menampilkan data pembeli, penjual, dan jarak lokasi terhitung. Hak untuk meng-<strong>ACC</strong> atau <strong>Menolak</strong> pesanan sepenuhnya diserahkan kepada penjual resep terkait.
            </p>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `Semua (${orders.length})` },
              { id: 'waiting_approval', label: `Menunggu (${stats.waitingCount})` },
              { id: 'approved', label: `Di-ACC (${stats.approvedCount})` },
              { id: 'rejected', label: `Ditolak (${stats.rejectedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
              Belum ada permintaan resep pada filter ini.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((ord) => {
                const isUnder15Km = ord.distanceKm < 15;
                const distanceText = formatDistanceDetail(ord.distanceKm);

                return (
                  <div
                    key={ord.id}
                    className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition-all space-y-3 ${
                      isUnder15Km && ord.status === 'waiting_approval'
                        ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200'
                        : isUnder15Km
                        ? 'bg-white border-rose-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Header Row: Recipe + Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <img
                          src={ord.recipePhoto}
                          alt={ord.recipeTitle}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                            {ord.recipeTitle}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
                            <Store className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>
                              Penjual: <strong>{ord.sellerWarung}</strong> ({ord.sellerCity})
                            </span>
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-black text-teal-700">
                              {formatRupiah(ord.price)}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {ord.paymentMethod}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {ord.createdAt}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current Status Badge */}
                      <div className="shrink-0">
                        {ord.status === 'waiting_approval' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-extrabold">
                            <Clock className="w-3 h-3" />
                            Menunggu
                          </span>
                        )}
                        {ord.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold">
                            <CheckCircle2 className="w-3 h-3" />
                            Di-ACC
                          </span>
                        )}
                        {ord.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-extrabold">
                            <XCircle className="w-3 h-3" />
                            Ditolak
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Buyer & Distance Box */}
                    <div className="rounded-xl bg-white/90 border border-slate-200 p-3 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <span>Pemohon / Pembeli: {ord.buyerName}</span>
                          </p>
                          <p className="text-slate-600 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{ord.buyerPhone}</span>
                          </p>
                          <p className="text-slate-600 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span>
                              {ord.buyerAddress}, <strong>{ord.buyerCity}</strong>
                            </span>
                          </p>
                        </div>

                        {/* Distance Badge (Meter / KM) */}
                        <div
                          className={`px-3 py-2 rounded-xl border text-left sm:text-right shrink-0 ${
                            isUnder15Km
                              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          }`}
                        >
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider block ${
                              isUnder15Km ? 'text-rose-100' : 'text-emerald-700'
                            }`}
                          >
                            Jarak Lokasi ke Penjual
                          </span>
                          <span className="text-sm font-black flex items-center sm:justify-end gap-1 mt-0.5">
                            {isUnder15Km && <AlertOctagon className="w-4 h-4 shrink-0" />}
                            <span>{distanceText}</span>
                          </span>
                        </div>
                      </div>

                      {/* RED WARNING SIGN WHEN < 15 KM */}
                      {isUnder15Km && (
                        <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-950 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="text-[11px] leading-relaxed">
                            <strong className="text-rose-800 uppercase">
                              Peringatan Tanda Merah (&lt; 15 KM):
                            </strong>{' '}
                            Jarak lokasi hanya <strong>{distanceText}</strong> dari warung penjual asli. Melanggar zona proteksi 15 KM dan berpotensi menimbulkan persaingan langsung di area yang sama.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: KURASI PENGAJUAN RESEP PENJUAL */}
      {activeSection === 'submissions' && (
        <div className="space-y-3">
          {sortedRecipes.map((rcp) => (
            <div
              key={rcp.id}
              className={`rounded-2xl border p-4 shadow-xs space-y-3 ${
                rcp.status === 'review'
                  ? 'bg-amber-50/60 border-amber-300'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <img
                    src={rcp.photoUrl}
                    alt={rcp.title}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {rcp.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Penjual: <strong>{rcp.sellerWarung}</strong> ({rcp.sellerName})
                    </p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>
                        {rcp.sellerAddress}, {rcp.city}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-black text-teal-700">
                        {formatRupiah(rcp.price)}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {rcp.category}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold shrink-0 ${
                    rcp.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : rcp.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {rcp.status === 'approved'
                    ? 'Tayang'
                    : rcp.status === 'rejected'
                    ? 'Ditolak'
                    : 'Perlu Review'}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/70">
                <button
                  type="button"
                  onClick={() => onRecipeDecision(rcp.id, 'approved')}
                  disabled={rcp.status === 'approved'}
                  className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    rcp.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{rcp.status === 'approved' ? 'Sudah Di-ACC' : 'ACC Tayang'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRecipeDecision(rcp.id, 'rejected')}
                  disabled={rcp.status === 'rejected'}
                  className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    rcp.status === 'rejected'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200 cursor-default'
                      : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                  }`}
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>{rcp.status === 'rejected' ? 'Sudah Ditolak' : 'Tolak'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
