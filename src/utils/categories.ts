import type { IncomeCategory, ExpenseCategory } from '../types';

export interface CategoryInfo {
  name: string;
  type: 'income' | 'expense';
  iconName: string;
  colorClass: string;
  bgClass: string;
}

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Penjualan Tunai',
  'Transfer/QRIS',
  'Piutang',
  'Lainnya',
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Bahan Baku',
  'Peralatan',
  'Perlengkapan',
  'Sewa',
  'Gaji',
  'Lainnya',
];

export const CATEGORY_DETAILS: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  // Pemasukan
  'Penjualan Tunai': {
    icon: 'Banknote',
    bg: 'bg-emerald-50 text-emerald-700',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  'Transfer/QRIS': {
    icon: 'QrCode',
    bg: 'bg-teal-50 text-teal-700',
    text: 'text-teal-700',
    border: 'border-teal-200',
  },
  'Piutang': {
    icon: 'HandCoins',
    bg: 'bg-cyan-50 text-cyan-700',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
  },
  // Pengeluaran
  'Bahan Baku': {
    icon: 'ShoppingBag',
    bg: 'bg-orange-50 text-orange-700',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  'Peralatan': {
    icon: 'Wrench',
    bg: 'bg-amber-50 text-amber-700',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  'Perlengkapan': {
    icon: 'Boxes',
    bg: 'bg-yellow-50 text-yellow-800',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
  },
  'Sewa': {
    icon: 'Store',
    bg: 'bg-rose-50 text-rose-700',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  'Gaji': {
    icon: 'Users',
    bg: 'bg-purple-50 text-purple-700',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  'Lainnya': {
    icon: 'MoreHorizontal',
    bg: 'bg-slate-50 text-slate-700',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
};
