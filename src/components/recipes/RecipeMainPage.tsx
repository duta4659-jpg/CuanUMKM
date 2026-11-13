import React, { useState } from 'react';
import {
  ArrowLeft,
  CookingPot,
  Sparkles,
  Store,
  ShoppingBag,
  ShieldCheck,
  ChevronRight,
  Info,
  HeartHandshake,
  CheckCircle,
} from 'lucide-react';
import type { Recipe, RecipeOrder } from '../../types/recipe';
import {
  loadRecipesFromStorage,
  saveRecipesToStorage,
} from '../../utils/recipeStore';
import { SellerFlow } from './SellerFlow';
import { BuyerFlow } from './BuyerFlow';

interface RecipeMainPageProps {
  onBackToHome: () => void;
  sellerWarungName: string;
  sellerOwnerName: string;
  sellerPhone: string;
  sellerAddress: string;
  isAuthenticated?: boolean;
  onRequireAuth?: (onSuccess?: () => void) => void;
  recipes?: Recipe[];
  onCreateRecipe?: (recipe: Recipe) => void;
  orders?: RecipeOrder[];
  onCreateOrder?: (order: RecipeOrder) => void;
  onOrderDecision?: (orderId: string, decision: 'approved' | 'rejected') => void;
}

export const RecipeMainPage: React.FC<RecipeMainPageProps> = ({
  onBackToHome,
  sellerWarungName,
  sellerOwnerName,
  sellerPhone,
  sellerAddress,
  isAuthenticated = true,
  onRequireAuth,
  recipes: externalRecipes,
  onCreateRecipe,
  orders,
  onCreateOrder,
  onOrderDecision,
}) => {
  // view: 'hub' | 'seller' | 'buyer'
  const [view, setView] = useState<'hub' | 'seller' | 'buyer'>('hub');
  const [localRecipeList, setLocalRecipeList] = useState<Recipe[]>(() =>
    loadRecipesFromStorage()
  );

  const recipeList = externalRecipes ?? localRecipeList;

  const handleRecipeCreated = (newRecipe: Recipe) => {
    if (onCreateRecipe) {
      onCreateRecipe(newRecipe);
      return;
    }
    setLocalRecipeList((prev) => {
      const updated = [newRecipe, ...prev];
      saveRecipesToStorage(updated);
      return updated;
    });
  };

  // If inside Seller flow
  if (view === 'seller') {
    return (
      <SellerFlow
        onBack={() => setView('hub')}
        onRecipeCreated={handleRecipeCreated}
        sellerWarungName={sellerWarungName}
        sellerOwnerName={sellerOwnerName}
        sellerPhone={sellerPhone}
        sellerAddress={sellerAddress}
        orders={orders}
        onOrderDecision={onOrderDecision}
      />
    );
  }

  // If inside Buyer flow
  if (view === 'buyer') {
    return (
      <BuyerFlow
        onBack={() => setView('hub')}
        recipes={recipeList}
        buyerDefaultName={sellerOwnerName || 'Pak Budi'}
        buyerDefaultPhone={sellerPhone || '0812-3456-7890'}
        buyerDefaultAddress={sellerAddress || 'Jl. Cisangkuy No. 25'}
        orders={orders}
        onCreateOrder={onCreateOrder}
        onOrderDecision={onOrderDecision}
      />
    );
  }

  // HUB VIEW: 2 KARTU BESAR
  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-10">
      {/* Header with Back button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToHome}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
          title="Kembali ke Beranda"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
          <span className="text-xs font-bold hidden sm:inline">Beranda</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/30">
            <CookingPot className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-800 leading-none">
              Berbagi Resep
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Cuan Bersama, Berkah Bersama. Resepmu bisa jadi rezeki buat orang lain.
            </p>
          </div>
        </div>
      </div>

      {/* 2 KARTU BESAR */}
      <div className="space-y-4 pt-1">
        {/* KARTU 1: MENJUAL RESEP */}
        <div
          onClick={() => {
            if (!isAuthenticated && onRequireAuth) {
              onRequireAuth(() => setView('seller'));
              return;
            }
            setView('seller');
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!isAuthenticated && onRequireAuth) {
                onRequireAuth(() => setView('seller'));
                return;
              }
              setView('seller');
            }
          }}
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white p-6 sm:p-7 shadow-lg shadow-teal-900/15 border border-teal-600/40 hover:shadow-xl transition-all cursor-pointer active:scale-99"
        >
          {/* Subtle glow circle */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-teal-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-teal-200 border border-white/20 shadow-xs">
                <Store className="w-6 h-6 stroke-[2.2]" />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-400 text-slate-950 flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Dapat Penghasilan
              </span>
            </div>

            <div>
              <span className="text-[11px] font-black tracking-widest text-teal-300 uppercase block mb-1">
                KARTU 1 • PENJUAL RESEP
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                MENJUAL RESEP
              </h2>
              <p className="text-xs sm:text-sm text-teal-100 font-medium leading-relaxed mt-1.5">
                "Punya resep rahasia yang laku? Jual di sini, dapat penghasilan."
              </p>
            </div>

            <div className="pt-2 border-t border-teal-600/60 flex items-center justify-between text-xs font-bold text-teal-200">
              <span>Dilindungi Proteksi Radius 15 KM</span>
              <span className="flex items-center gap-1 text-white group-hover:translate-x-1 transition-transform">
                <span>Mulai Jual Resep</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>

        {/* KARTU 2: MEMBELI RESEP */}
        <div
          onClick={() => {
            if (!isAuthenticated && onRequireAuth) {
              onRequireAuth(() => setView('buyer'));
              return;
            }
            setView('buyer');
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!isAuthenticated && onRequireAuth) {
                onRequireAuth(() => setView('buyer'));
                return;
              }
              setView('buyer');
            }
          }}
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-600 to-slate-900 text-white p-6 sm:p-7 shadow-lg shadow-orange-900/15 border border-orange-400/40 hover:shadow-xl transition-all cursor-pointer active:scale-99"
        >
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-orange-200 border border-white/20 shadow-xs">
                <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black bg-white text-orange-950 flex items-center gap-1 shadow-xs">
                <CheckCircle className="w-3.5 h-3.5 text-orange-600" />
                Terbukti Laku
              </span>
            </div>

            <div>
              <span className="text-[11px] font-black tracking-widest text-amber-200 uppercase block mb-1">
                KARTU 2 • PEMBELI RESEP
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                MEMBELI RESEP
              </h2>
              <p className="text-xs sm:text-sm text-amber-50 font-medium leading-relaxed mt-1.5">
                "Mau buka usaha tapi bingung mau jualan apa? Beli resep yang udah terbukti laku."
              </p>
            </div>

            <div className="pt-2 border-t border-orange-400/50 flex items-center justify-between text-xs font-bold text-amber-100">
              <span>Bimbingan Langsung 7 Hari Sampai Bisa</span>
              <span className="flex items-center gap-1 text-white group-hover:translate-x-1 transition-transform">
                <span>Lihat Koleksi Resep</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SISTEM DANA: BAHASA ADEM TANPA ANCAMAN */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-white p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <HeartHandshake className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
              <span>Sistem Dana Bersama yang Aman</span>
            </h3>
            <p className="text-xs sm:text-sm text-emerald-900 font-semibold leading-relaxed">
              "Dana dijaga bersama sampai pelatihan selesai, biar sama-sama tenang."
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              Pelatihan video call boleh lewat WhatsApp agar nyaman. Pembayaran tetap di aplikasi agar aman dan tercatat rapi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
