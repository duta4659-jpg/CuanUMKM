import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Calendar,
  Clock,
  FileText,
  Trash2,
  Sparkles,
} from 'lucide-react';
import type { Transaction, TransactionType } from '../types';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  CATEGORY_DETAILS,
} from '../utils/categories';
import {
  formatRupiah,
  getTodayDateString,
  getCurrentTimeString,
  parseRupiahInput,
} from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'userId'> & { id?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: Transaction | null;
}

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000, 250000, 500000];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const [type, setType] = useState<TransactionType>('income');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Penjualan Tunai']);
  const [amount, setAmount] = useState<number>(0);
  const [amountInputStr, setAmountInputStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      const parsedCats = initialData.category
        ? initialData.category.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      setSelectedCategories(
        parsedCats.length > 0
          ? parsedCats
          : [initialData.type === 'income' ? 'Penjualan Tunai' : 'Bahan Baku']
      );
      setAmount(initialData.amount);
      setAmountInputStr(initialData.amount.toLocaleString('id-ID'));
      setNotes(initialData.notes || '');
      setDate(initialData.date || getTodayDateString());
      setTime(initialData.time || getCurrentTimeString());
    } else {
      setType('income');
      setSelectedCategories(['Penjualan Tunai']);
      setAmount(0);
      setAmountInputStr('');
      setNotes('');
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
    }
    setErrorMsg('');
  }, [initialData, isOpen]);

  // When type changes, adjust selected categories for that type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      const valid = selectedCategories.filter((c) => INCOME_CATEGORIES.includes(c as any));
      setSelectedCategories(valid.length > 0 ? valid : ['Penjualan Tunai']);
    } else {
      const valid = selectedCategories.filter((c) => EXPENSE_CATEGORIES.includes(c as any));
      setSelectedCategories(valid.length > 0 ? valid : ['Bahan Baku']);
    }
    setErrorMsg('');
  };

  const toggleCategory = (catName: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(catName)) {
        return prev.filter((c) => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
    setErrorMsg('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const num = parseRupiahInput(rawValue);
    setAmount(num);
    setAmountInputStr(num > 0 ? num.toLocaleString('id-ID') : '');
    setErrorMsg('');
  };

  const handleQuickAdd = (addVal: number) => {
    const newAmount = (amount || 0) + addVal;
    setAmount(newAmount);
    setAmountInputStr(newAmount.toLocaleString('id-ID'));
    setErrorMsg('');
  };

  const handleClearAmount = () => {
    setAmount(0);
    setAmountInputStr('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setErrorMsg('Mohon masukkan nominal yang valid (lebih dari Rp 0)');
      return;
    }
    if (selectedCategories.length === 0) {
      setErrorMsg('Pilih minimal satu kategori transaksi');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        id: initialData?.id,
        type,
        category: selectedCategories.join(', '),
        amount,
        notes: notes.trim(),
        date,
        time,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                type === 'income' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'
              }`}
            >
              {type === 'income' ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              {initialData ? 'Ubah Transaksi' : 'Catat Transaksi Baru'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* 1. Toggle Pemasukan / Pengeluaran */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-3.5 px-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                    : 'text-slate-600 hover:text-teal-700'
                }`}
              >
                <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                <span>Pemasukan (+)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-3.5 px-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'text-slate-600 hover:text-orange-600'
                }`}
              >
                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                <span>Pengeluaran (-)</span>
              </button>
            </div>
          </div>

          {/* 2. Input Nominal Rp Besar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Nominal Uang
              </label>
              {amount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAmount}
                  className="text-xs text-slate-400 hover:text-rose-500 font-medium cursor-pointer"
                >
                  Reset Nominal
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xl text-slate-400">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amountInputStr}
                onChange={handleAmountChange}
                placeholder="0"
                autoFocus={!initialData}
                className={`w-full pl-13 pr-4 py-4 rounded-2xl border-2 text-2xl sm:text-3xl font-black text-slate-800 tracking-tight transition-all focus:outline-none focus:ring-4 ${
                  type === 'income'
                    ? 'border-teal-300 focus:border-teal-600 focus:ring-teal-100'
                    : 'border-orange-300 focus:border-orange-500 focus:ring-orange-100'
                }`}
              />
            </div>

            {/* Quick Add Buttons */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickAdd(q)}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                    type === 'income'
                      ? 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
                      : 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100'
                  }`}
                >
                  +{q >= 1000 ? `${q / 1000}rb` : q}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Kategori Transaksi */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Pilih Kategori (Bisa Pilih Lebih Dari Satu)
              </label>
              {selectedCategories.length > 0 && (
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {selectedCategories.length} Dipilih
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentCategories.map((catName) => {
                const isSelected = selectedCategories.includes(catName);
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => toggleCategory(catName)}
                    className={`p-3 rounded-xl border text-left font-semibold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? type === 'income'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30'
                          : 'border-orange-500 bg-orange-50 text-orange-950 ring-2 ring-orange-500/30'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{catName}</span>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                        isSelected
                          ? type === 'income'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-orange-500 text-white shadow-xs'
                          : 'border-2 border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-[11px] text-rose-500 mt-1.5 font-medium">
                *Pilih minimal satu kategori transaksi
              </p>
            )}
          </div>

          {/* 4. Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Catatan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                type === 'income'
                  ? 'Contoh: 10 porsi nasi uduk, pembayaran warung Pak Budi'
                  : 'Contoh: Beli beras 20kg, gas LPG 3kg, minyak'
              }
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* 5. Tanggal & Waktu */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Jam
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Tombol Aksi Simpan & Hapus */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Yakin ingin menghapus catatan transaksi ini?')) {
                    await onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="py-3 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className={`flex-1 py-4 px-6 rounded-2xl font-black text-base text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'income'
                  ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-teal-600/30'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/30'
              }`}
            >
              {isSubmitting ? (
                <span>Menyimpan ke Firebase...</span>
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>
                    Simpan {type === 'income' ? 'Pemasukan' : 'Pengeluaran'} (
                    {formatRupiah(amount)})
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
