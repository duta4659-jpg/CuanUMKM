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
    <div className="fixed bottom-6 left-4 right-4 z-40 pointer-events-none flex justify-center">
      <nav
        aria-label="Navigasi Utama"
        className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-[0_14px_38px_-8px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/5 py-2 px-4 sm:px-6"
      >
        <div className="flex items-center justify-between relative">
          {/* Tab 1: Beranda */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className={`min-h-[44px] min-w-[56px] flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              currentTab === 'home'
                ? 'text-teal-700 bg-teal-50/80 font-extrabold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Home
              className={`w-5 h-5 mb-0.5 transition-transform ${
                currentTab === 'home' ? 'scale-110 stroke-[2.5]' : ''
              }`}
            />
            <span className="text-[11px] tracking-tight whitespace-nowrap">Beranda</span>
          </button>

          {/* Tab 2: Laporan */}
          <button
            type="button"
            onClick={() => onSelectTab('report')}
            className={`min-h-[44px] min-w-[56px] flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              currentTab === 'report'
                ? 'text-teal-700 bg-teal-50/80 font-extrabold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <BarChart3
              className={`w-5 h-5 mb-0.5 transition-transform ${
                currentTab === 'report' ? 'scale-110 stroke-[2.5]' : ''
              }`}
            />
            <span className="text-[11px] tracking-tight whitespace-nowrap">Laporan</span>
          </button>

          {/* Tombol Besar (+) Tambah Transaksi di Tengah */}
          <div className="relative -top-5 flex flex-col items-center -mb-3">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-teal-600 via-teal-500 to-teal-400 hover:from-teal-700 hover:to-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-600/40 border-4 border-white active:scale-90 transition-all cursor-pointer group"
              title="Tambah Transaksi Baru"
              aria-label="Tambah Transaksi"
            >
              <Plus className="w-8 h-8 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
            </button>
            <span className="text-[10px] font-bold text-teal-800 mt-0.5 whitespace-nowrap">
              Tambah
            </span>
          </div>

          {/* Tab 4: Profil */}
          <button
            type="button"
            onClick={() => onSelectTab('profile')}
            className={`min-h-[44px] min-w-[56px] flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
              currentTab === 'profile'
                ? 'text-teal-700 bg-teal-50/80 font-extrabold'
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <UserCircle2
              className={`w-5 h-5 mb-0.5 transition-transform ${
                currentTab === 'profile' ? 'scale-110 stroke-[2.5]' : ''
              }`}
            />
            <span className="text-[11px] tracking-tight whitespace-nowrap">Profil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
