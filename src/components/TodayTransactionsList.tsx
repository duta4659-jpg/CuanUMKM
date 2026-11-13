import React, { useState } from 'react';
import {
  Banknote,
  QrCode,
  HandCoins,
  ShoppingBag,
  Wrench,
  Boxes,
  Store,
  Users,
  MoreHorizontal,
  Edit2,
  Trash2,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  PlusCircle,
} from 'lucide-react';
import type { Transaction } from '../types';
import { formatRupiah } from '../utils/formatters';
import { CATEGORY_DETAILS } from '../utils/categories';

interface TodayTransactionsListProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => Promise<void>;
  onAddNew: () => void;
}

// Icon mapper for categories (supports multi-category strings)
const renderCategoryIcon = (category: string) => {
  const primary = (category || '').split(',')[0].trim();
  switch (primary) {
    case 'Penjualan Tunai':
      return <Banknote className="w-5 h-5" />;
    case 'Transfer/QRIS':
      return <QrCode className="w-5 h-5" />;
    case 'Piutang':
      return <HandCoins className="w-5 h-5" />;
    case 'Bahan Baku':
      return <ShoppingBag className="w-5 h-5" />;
    case 'Peralatan':
      return <Wrench className="w-5 h-5" />;
    case 'Perlengkapan':
      return <Boxes className="w-5 h-5" />;
    case 'Sewa':
      return <Store className="w-5 h-5" />;
    case 'Gaji':
      return <Users className="w-5 h-5" />;
    default:
      return <MoreHorizontal className="w-5 h-5" />;
  }
};

export const TodayTransactionsList: React.FC<TodayTransactionsListProps> = ({
  transactions,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered transactions
  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchNotes = (tx.notes || '').toLowerCase().includes(q);
      const matchAmount = tx.amount.toString().includes(q);
      return matchCat || matchNotes || matchAmount;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header section with tabs */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Transaksi Hari Ini
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-teal-100 text-teal-800 rounded-full">
              {transactions.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pemasukan dan pengeluaran hari ini
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === 'income'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-700 hover:bg-teal-50'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Pemasukan</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterType === 'expense'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-orange-700 hover:bg-orange-50'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Optional Search bar if there are transactions */}
      {transactions.length > 3 && (
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi berdasarkan catatan atau kategori..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      )}

      {/* Transaction Items */}
      {filtered.length === 0 ? (
        <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3 border border-teal-100">
            <Banknote className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-700">
            {transactions.length === 0
              ? 'Belum Ada Transaksi Hari Ini'
              : 'Tidak Ada Transaksi yang Cocok'}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4">
            {transactions.length === 0
              ? 'Yuk mulai catat penjualan atau belanja tokomu sekarang agar keuangan rapi!'
              : 'Coba ubah kata kunci pencarian atau ganti filter pemasukan/pengeluaran.'}
          </p>
          {transactions.length === 0 && (
            <button
              onClick={onAddNew}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 inline-flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Catat Transaksi Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map((tx) => {
            const isIncome = tx.type === 'income';
            const primaryCat = (tx.category || '').split(',')[0].trim();
            const catStyle = CATEGORY_DETAILS[primaryCat] || {
              icon: 'MoreHorizontal',
              bg: isIncome ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700',
              text: isIncome ? 'text-teal-700' : 'text-orange-700',
              border: isIncome ? 'border-teal-200' : 'border-orange-200',
            };

            return (
              <div
                key={tx.id}
                className="p-4 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors group"
              >
                {/* Left: Category Icon & Details */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${catStyle.bg} ${catStyle.border}`}
                  >
                    {renderCategoryIcon(tx.category)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 truncate">
                        {tx.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isIncome
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-orange-50 text-orange-700 border border-orange-200'
                        }`}
                      >
                        {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </div>

                    {tx.notes ? (
                      <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                        {tx.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-0.5">Tanpa catatan</p>
                    )}

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{tx.time || 'Hari ini'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-sm sm:text-base font-black tracking-tight ${
                        isIncome ? 'text-teal-700' : 'text-orange-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEdit(tx)}
                      title="Edit transaksi"
                      className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus catatan ${tx.category} (${formatRupiah(tx.amount)})?`)) {
                          onDelete(tx.id);
                        }
                      }}
                      title="Hapus transaksi"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
