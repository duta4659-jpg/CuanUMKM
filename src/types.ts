export type TransactionType = 'income' | 'expense';

export type IncomeCategory =
  | 'Penjualan Tunai'
  | 'Transfer/QRIS'
  | 'Piutang'
  | 'Lainnya';

export type ExpenseCategory =
  | 'Bahan Baku'
  | 'Peralatan'
  | 'Perlengkapan'
  | 'Sewa'
  | 'Gaji'
  | 'Lainnya';

export type TransactionCategory = IncomeCategory | ExpenseCategory | string;

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  notes?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  userId: string;
  businessName: string;
  ownerName: string;
  phone?: string;
  address?: string;
  initialCash?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type ReportFilter = 'daily' | 'weekly' | 'monthly';

export interface AuthUser {
  uid: string;
  displayName: string;
  emailOrPhone: string;
  photoURL?: string | null;
  provider: 'google' | 'manual';
}

