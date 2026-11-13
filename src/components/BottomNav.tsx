import React from 'react';
import { Home, BarChart3, Plus, UserCircle2 } from 'lucide-react';

export type TabType = 'home' | 'report' | 'profile';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-xl shadow-slate-900/10 py-1.5 px-4 sm:px-6">
      <div className="max-w-md mx-auto flex items-center justify-between relative">
        {/* Tab 1: Beranda */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'home'
              ? 'text-teal-700 font-extrabold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Home
            className={`w-5 h-5 mb-0.5 transition-transform ${
              currentTab === 'home' ? 'scale-110 stroke-[2.5]' : ''
            }`}
          />
          <span className="text-[11px] tracking-tight">Beranda</span>
        </button>

        {/* Tab 2: Laporan */}
        <button
          type="button"
          onClick={() => onSelectTab('report')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'report'
              ? 'text-teal-700 font-extrabold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <BarChart3
            className={`w-5 h-5 mb-0.5 transition-transform ${
              currentTab === 'report' ? 'scale-110 stroke-[2.5]' : ''
            }`}
          />
          <span className="text-[11px] tracking-tight">Laporan</span>
        </button>

        {/* Tombol Besar (+) Tambah Transaksi di Tengah */}
        <div className="relative -top-5 flex flex-col items-center">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-600 via-teal-500 to-teal-400 hover:from-teal-700 hover:to-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-600/40 border-4 border-white active:scale-90 transition-all cursor-pointer group"
            title="Tambah Transaksi Baru"
            aria-label="Tambah Transaksi"
          >
            <Plus className="w-8 h-8 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <span className="text-[10px] font-bold text-teal-800 -mt-0.5">
            Tambah
          </span>
        </div>

        {/* Tab 4: Profil */}
        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            currentTab === 'profile'
              ? 'text-teal-700 font-extrabold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <UserCircle2
            className={`w-5 h-5 mb-0.5 transition-transform ${
              currentTab === 'profile' ? 'scale-110 stroke-[2.5]' : ''
            }`}
          />
          <span className="text-[11px] tracking-tight">Profil</span>
        </button>
      </div>
    </nav>
  );
};
