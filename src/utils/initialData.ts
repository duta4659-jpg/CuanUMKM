import type { Transaction, UserProfile } from '../types';
import { getTodayDateString } from './formatters';

export const DEFAULT_PROFILE: UserProfile = {
  userId: 'local_guest',
  businessName: 'Warung Berkah UMKM',
  ownerName: 'Bu Siti Rahayu',
  phone: '0812-3456-7890',
  address: 'Jl. Merdeka No. 45, Pasar Minggu, Jakarta Selatan',
  initialCash: 500000,
};

export function getInitialTransactions(userId: string): Transaction[] {
  const today = getTodayDateString();
  const d = new Date();
  
  // Yesterday date
  const yDate = new Date();
  yDate.setDate(yDate.getDate() - 1);
  const yYear = yDate.getFullYear();
  const yMonth = String(yDate.getMonth() + 1).padStart(2, '0');
  const yDay = String(yDate.getDate()).padStart(2, '0');
  const yesterday = `${yYear}-${yMonth}-${yDay}`;

  return [
    {
      id: `tx_init_1`,
      userId,
      type: 'income',
      category: 'Penjualan Tunai',
      amount: 450000,
      notes: 'Penjualan pagi (Paket sarapan & sembako)',
      date: today,
      time: '08:15',
      createdAt: new Date(d.setHours(8, 15)).toISOString(),
    },
    {
      id: `tx_init_2`,
      userId,
      type: 'expense',
      category: 'Bahan Baku',
      amount: 185000,
      notes: 'Beli telur 2 krat & minyak goreng di pasar induk',
      date: today,
      time: '09:30',
      createdAt: new Date(d.setHours(9, 30)).toISOString(),
    },
    {
      id: `tx_init_3`,
      userId,
      type: 'income',
      category: 'Transfer/QRIS',
      amount: 320000,
      notes: 'Pembayaran QRIS pelanggan katering siang',
      date: today,
      time: '12:45',
      createdAt: new Date(d.setHours(12, 45)).toISOString(),
    },
    {
      id: `tx_init_4`,
      userId,
      type: 'expense',
      category: 'Perlengkapan',
      amount: 35000,
      notes: 'Bungkus plastik & kertas nasi',
      date: today,
      time: '14:10',
      createdAt: new Date(d.setHours(14, 10)).toISOString(),
    },
    {
      id: `tx_init_5`,
      userId,
      type: 'income',
      category: 'Penjualan Tunai',
      amount: 280000,
      notes: 'Penjualan sore (snack & minuman dingin)',
      date: today,
      time: '16:30',
      createdAt: new Date(d.setHours(16, 30)).toISOString(),
    },
    // Yesterday records for weekly/monthly reports
    {
      id: `tx_init_6`,
      userId,
      type: 'income',
      category: 'Penjualan Tunai',
      amount: 850000,
      notes: 'Total penjualan harian kemarin',
      date: yesterday,
      time: '18:00',
      createdAt: new Date(yDate.setHours(18, 0)).toISOString(),
    },
    {
      id: `tx_init_7`,
      userId,
      type: 'expense',
      category: 'Bahan Baku',
      amount: 320000,
      notes: 'Beras pandan wangi 25kg',
      date: yesterday,
      time: '07:30',
      createdAt: new Date(yDate.setHours(7, 30)).toISOString(),
    },
    {
      id: `tx_init_8`,
      userId,
      type: 'expense',
      category: 'Sewa',
      amount: 150000,
      notes: 'Iuran kebersihan & retribusi lapak pasar',
      date: yesterday,
      time: '10:00',
      createdAt: new Date(yDate.setHours(10, 0)).toISOString(),
    },
  ];
}
