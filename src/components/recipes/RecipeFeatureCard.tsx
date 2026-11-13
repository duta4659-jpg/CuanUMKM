import React from 'react';
import { ArrowRight, CookingPot, Sparkles } from 'lucide-react';

interface RecipeFeatureCardProps {
  onClick: () => void;
}

export const RecipeFeatureCard: React.FC<RecipeFeatureCardProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50/70 to-orange-50/60 border border-teal-200/90 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-99"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Icon & Title/Description */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-teal-600/30 group-hover:scale-105 transition-transform">
            {/* Ikon mangkuk */}
            <CookingPot className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight leading-none group-hover:text-teal-700 transition-colors">
                Berbagi Resep
              </h3>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded-full border border-orange-200 flex items-center gap-0.5 shrink-0">
                <Sparkles className="w-2.5 h-2.5" />
                Baru
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate mt-1">
              Cuan Bersama, Berkah Bersama. Resepmu bisa jadi rezeki buat orang lain.
            </p>
          </div>
        </div>

        {/* Right: Tombol [ Lihat Resep Terlaris -> ] */}
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 group-hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors">
            <span className="hidden xs:inline">Lihat Resep Terlaris</span>
            <span className="xs:hidden">Lihat</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
};
