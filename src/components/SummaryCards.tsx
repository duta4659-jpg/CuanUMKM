import React from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface SummaryCardsProps {
  incomeToday: number;
  expenseToday: number;
  incomeCount: number;
  expenseCount: number;
  initialCash?: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  incomeToday,
  expenseToday,
  incomeCount,
  expenseCount,
  initialCash = 0,
}) => {
  const netToday = incomeToday - expenseToday;
  const totalKasWarung = initialCash + netToday;
  const isSurplus = netToday >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. Saldo Hari Ini Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white p-5 shadow-lg shadow-teal-900/15 border border-teal-600/30">
        {/* Subtle decorative circles */}
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-teal-500/15 rounded-full blur-xl pointer-events-none" />
        <div className="absolute top-2 right-3 opacity-15">
          <Wallet className="w-16 h-16 text-teal-200" />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-200/90 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                Saldo Hari Ini
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  isSurplus
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {isSurplus ? (
                  <>
                    <TrendingUp className="w-3 h-3" />
                    Surplus
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3" />
                    Defisit
                  </>
                )}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              {formatRupiah(netToday)}
            </h2>
          </div>

          <div className="mt-4 pt-3 border-t border-teal-700/60 flex items-center justify-between text-xs text-teal-200">
            <span>Estimasi Kas di Laci:</span>
            <span className="font-semibold text-white">
              {formatRupiah(totalKasWarung)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Pemasukan Hari Ini Card */}
      <div className="rounded-2xl bg-white p-5 border border-teal-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 flex items-center gap-1">
              Pemasukan Hari Ini
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-teal-700 mt-1.5 tracking-tight">
              {formatRupiah(incomeToday)}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-xs">
            <ArrowDownRight className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Uang Masuk</span>
          <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full">
            {incomeCount} Transaksi
          </span>
        </div>
      </div>

      {/* 3. Pengeluaran Hari Ini Card */}
      <div className="rounded-2xl bg-white p-5 border border-orange-200/80 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-700 flex items-center gap-1">
              Pengeluaran Hari Ini
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-orange-600 mt-1.5 tracking-tight">
              {formatRupiah(expenseToday)}
            </h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs">
            <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Uang Keluar</span>
          <span className="font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
            {expenseCount} Transaksi
          </span>
        </div>
      </div>
    </div>
  );
};
