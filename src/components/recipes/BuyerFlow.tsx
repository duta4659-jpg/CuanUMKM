import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Unlock,
  MapPin,
  Star,
  CheckCircle,
  Clock,
  Sparkles,
  Phone,
  MessageCircle,
  Video,
  CreditCard,
  QrCode,
  AlertTriangle,
  Send,
  HelpCircle,
  Info,
  ChevronRight,
  Flame,
  Check,
  RefreshCw,
  X,
  ChefHat,
} from 'lucide-react';
import type { Recipe, RecipeOrder, ChatMessage } from '../../types/recipe';
import { formatRupiah } from '../../utils/formatters';

interface BuyerFlowProps {
  onBack: () => void;
  recipes: Recipe[];
  buyerDefaultName?: string;
  buyerDefaultPhone?: string;
  buyerDefaultAddress?: string;
  orders?: RecipeOrder[];
  onCreateOrder?: (order: RecipeOrder) => void;
  onOrderDecision?: (orderId: string, decision: 'approved' | 'rejected') => void;
}

export const BuyerFlow: React.FC<BuyerFlowProps> = ({
  onBack,
  recipes,
  buyerDefaultName = '',
  buyerDefaultPhone = '',
  buyerDefaultAddress = '',
  orders,
  onCreateOrder,
}) => {
  // Only show approved recipes in catalog
  const approvedRecipes = React.useMemo(() => {
    return recipes.filter((r) => r.status === 'approved');
  }, [recipes]);

  // Step: 'rules' | 'list' | 'detail_preview' | 'checkout' | 'waiting_approval' | 'unlocked_recipe'
  const [currentStep, setCurrentStep] = useState<
    'rules' | 'list' | 'detail_preview' | 'checkout' | 'waiting_approval' | 'unlocked_recipe'
  >('rules');

  const [agreedToRules, setAgreedToRules] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Buyer Form Inputs
  const [buyerName, setBuyerName] = useState(buyerDefaultName);
  const [buyerPhone, setBuyerPhone] = useState(buyerDefaultPhone);
  const [buyerAddress, setBuyerAddress] = useState(buyerDefaultAddress);
  const [buyerCity, setBuyerCity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'transfer'>('qris');

  // Distance calculation state
  const [distanceKm, setDistanceKm] = useState<number>(48);
  const [orderStatus, setOrderStatus] = useState<'waiting' | 'approved' | 'rejected'>('waiting');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const liveOrder = React.useMemo(
    () => (activeOrderId && orders ? orders.find((o) => o.id === activeOrderId) : undefined),
    [activeOrderId, orders]
  );

  React.useEffect(() => {
    if (!liveOrder) return;
    if (liveOrder.status === 'approved') {
      setOrderStatus('approved');
      if (currentStep === 'waiting_approval') {
        setCurrentStep('unlocked_recipe');
      }
    } else if (liveOrder.status === 'rejected') {
      setOrderStatus('rejected');
    }
  }, [liveOrder, currentStep]);

  // Chat bimbingan state (clean empty start)
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    if (buyerCity && buyerCity.toLowerCase().includes(recipe.city.toLowerCase())) {
      setDistanceKm(8);
    } else {
      setDistanceKm(52);
    }
    setCurrentStep('detail_preview');
  };

  const handleProceedToCheckout = () => {
    setCurrentStep('checkout');
  };

  const handleConfirmPayment = () => {
    if (!selectedRecipe) return;
    const newOrderId = `ord_${Date.now()}`;
    const newOrder: RecipeOrder = {
      id: newOrderId,
      recipeId: selectedRecipe.id,
      recipeTitle: selectedRecipe.title,
      recipePhoto: selectedRecipe.photoUrl,
      sellerName: selectedRecipe.sellerName,
      sellerWarung: selectedRecipe.sellerWarung,
      sellerPhone: selectedRecipe.sellerPhone,
      sellerCity: selectedRecipe.city,
      buyerName: buyerName.trim() || 'Pembeli',
      buyerPhone: buyerPhone.trim() || '-',
      buyerAddress: buyerAddress.trim() || '-',
      buyerCity: buyerCity || '-',
      distanceKm,
      price: selectedRecipe.price,
      status: 'waiting_approval',
      paymentMethod,
      createdAt: 'Baru saja',
    };
    onCreateOrder?.(newOrder);
    setActiveOrderId(newOrderId);
    setOrderStatus('waiting');
    setCurrentStep('waiting_approval');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      sender: 'buyer',
      senderName: buyerName.trim() || 'Pembeli',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  // ==========================================
  // VIEW 1: ATURAN PEMBELI RESEP
  // ==========================================
  if (currentStep === 'rules') {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              Aturan Bagi Pembeli Resep
            </h2>
            <p className="text-xs text-slate-500">
              Pahami aturan etika & perlindungan resep sebelum membeli
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-teal-900">
                Membeli Resep yang Terbukti Menghidupi Warung
              </h4>
              <p className="text-xs text-teal-800 leading-relaxed mt-0.5">
                Anda membeli resep rahasia yang telah diuji bertahun-tahun oleh pemilik warung aslinya. Mari jaga kepercayaan ini bersama.
              </p>
            </div>
          </div>

          {/* 5 Rules */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                  Wajib Isi Alamat Lengkap + Titik Google Maps Tempat Mau Jualan
                </h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Lokasi rencana jualan Anda dibutuhkan untuk mengecek <strong>Proteksi Radius 15 KM</strong> dari lapak penjual asli.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                  Wajib Jujur & Dilarang Pakai Alamat Palsu
                </h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Dilarang mencantumkan alamat palsu untuk mengakali radius 15 KM. Kejujuran adalah pintu rezeki dan keberkahan jualan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                  Dilarang Menyebar / Menjual Ulang Resep
                </h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Resep ini dibeli <strong>hanya untuk digunakan usaha jualan sendiri</strong>. Dilarang mempublikasikan ke grup atau media sosial.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                4
              </span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                  Dilarang Screenshot: Resep Ber-Watermark Nama Pembeli
                </h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Setiap lembar resep yang terbuka akan tercetak watermark nama dan nomor telepon Anda secara otomatis.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                5
              </span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                  Pembeli Wajib Sopan Saat Chat & Bimbingan
                </h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Hormati penjual yang bersedia membimbing Anda selama minimal 7 hari. Bertanyalah dengan santun dan kekeluargaan.
                </p>
              </div>
            </div>
          </div>

          {/* Sistem Dana Adem */}
          <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl text-xs text-teal-900 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 mb-1 text-teal-950">
              <Info className="w-4 h-4 text-teal-600" />
              Sistem Dana Aman CuanUMKM
            </p>
            <p>
              "Dana dijaga bersama sampai pelatihan selesai, biar sama-sama tenang." Uang Anda aman di sistem. Jika penjual menolak karena jarak terlalu dekat, uang Anda kembali 100% otomatis.
            </p>
          </div>

          {/* Checkbox */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-teal-200 bg-teal-50/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="w-5 h-5 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Saya Setuju dengan 5 Aturan Pembeli di Atas
              </span>
            </label>
          </div>

          <button
            type="button"
            disabled={!agreedToRules}
            onClick={() => setCurrentStep('list')}
            className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-base shadow-lg shadow-teal-600/25 transition-all transform active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Lihat Daftar Resep Terbukti Laku →
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: TATA CARA 1 - DAFTAR RESEP (LIST 1-1, FOTO BESAR)
  // ==========================================
  if (currentStep === 'list') {
    return (
      <div className="space-y-4 max-w-2xl mx-auto pb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep('rules')}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Daftar Resep Lolos Kurasi
              </h2>
              <p className="text-xs text-slate-500">
                Resep asli warung pilihan yang terbukti laris setiap hari
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-full">
            {approvedRecipes.length} Resep Siap Pakai
          </span>
        </div>

        {/* Info banner proteksi 15km */}
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>Dilindungi Proteksi 15 KM:</strong> Menjaga agar Anda tidak bersaing dengan warung penjual di wilayah yang sama.
          </span>
        </div>

        {/* LIST KE BAWAH 1-1, FOTO BESAR (BUKAN KOTAK KECIL SHOPEE) */}
        {approvedRecipes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <ChefHat className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">
              Belum Ada Resep Terkurasi
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Saat ini belum ada resep yang tayang. Resep yang dikirim penjual dan lolos kurasi admin akan tampil di halaman ini.
            </p>
          </div>
        ) : (
        <div className="space-y-4">
          {approvedRecipes.map((rcp) => (
            <div
              key={rcp.id}
              onClick={() => handleSelectRecipe(rcp)}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden cursor-pointer group active:scale-99"
            >
              {/* Foto Besar Menggugah Selera */}
              <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-100">
                {rcp.photoUrl ? (
                  <img
                    src={rcp.photoUrl}
                    alt={rcp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal-700 to-slate-800 flex items-center justify-center">
                    <ChefHat className="w-16 h-16 text-teal-200/70" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                {/* Badges on image */}
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-600/95 backdrop-blur-xs text-white text-[11px] font-bold shadow-xs">
                    {rcp.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    {rcp.city}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-extrabold flex items-center gap-1 shadow-xs">
                    <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                    {rcp.rating} ({rcp.reviewCount} ulasan)
                  </span>
                </div>

                {/* Bottom title & warung on image */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-extrabold text-base sm:text-lg leading-snug drop-shadow-sm">
                    {rcp.title}
                  </h3>
                  <p className="text-xs text-teal-200 font-medium mt-0.5 drop-shadow-xs">
                    Oleh {rcp.sellerWarung} ({rcp.sellerName})
                  </p>
                </div>
              </div>

              {/* Body Card */}
              <div className="p-4 space-y-3">
                {/* Proof of Omzet */}
                <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-orange-950 flex items-start gap-2">
                  <Flame className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-orange-900">Bukti Laris: </span>
                    <span>{rcp.omzetDescription}</span>
                  </div>
                </div>

                {/* Footer with Price & Action Button */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Harga Lisensi Resep
                    </span>
                    <span className="text-lg font-black text-teal-700 tracking-tight">
                      {formatRupiah(rcp.price)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRecipe(rcp);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Lihat Preview Resep</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 3: TATA CARA 2 - PREVIEW RESEP (DETAIL TERKUNCI)
  // ==========================================
  if (currentStep === 'detail_preview' && selectedRecipe) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto pb-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep('list')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Preview Resep</h2>
            <p className="text-xs text-slate-500">
              Langkah 2: Periksa informasi resep sebelum membeli
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-5 p-5">
          {/* Big Photo & Title */}
          <div className="relative rounded-2xl overflow-hidden h-52 sm:h-64 border border-slate-200">
            {selectedRecipe.photoUrl ? (
              <img
                src={selectedRecipe.photoUrl}
                alt={selectedRecipe.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-700 to-slate-800 flex items-center justify-center">
                <ChefHat className="w-16 h-16 text-teal-200/70" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent" />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <span className="px-2 py-0.5 rounded bg-teal-600 text-white text-[11px] font-bold">
                {selectedRecipe.category}
              </span>
              <h3 className="text-lg sm:text-xl font-black mt-1 leading-tight">
                {selectedRecipe.title}
              </h3>
              <p className="text-xs text-teal-200 mt-0.5">
                Pemilik Asli: {selectedRecipe.sellerWarung} • {selectedRecipe.city}
              </p>
            </div>
          </div>

          {/* Bukti Omzet & Penjualan */}
          <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-orange-900">
              <Flame className="w-4 h-4 text-orange-600" />
              <span>Bukti Omzet & Penjualan Terbukti Laku</span>
            </div>
            <p className="text-xs leading-relaxed">{selectedRecipe.omzetDescription}</p>
          </div>

          {/* GARANSI BIMBINGAN */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
              <div className="font-bold text-teal-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Proteksi 15 KM</span>
              </div>
              <p className="text-teal-700 text-[11px] mt-0.5">
                Aman dari persaingan warung penjual asli.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
              <div className="font-bold text-teal-900 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-teal-600" />
                <span>Bimbingan 7 Hari</span>
              </div>
              <p className="text-teal-700 text-[11px] mt-0.5">
                Konsultasi & video call WA sampai mahir.
              </p>
            </div>
          </div>

          {/* SECTION RESEP TERKUNCI (GEMBOK) */}
          <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5 text-center relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Lock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 className="text-sm font-black text-amber-950">
              Detail Resep Lengkap Masih Terkunci
            </h4>
            <p className="text-xs text-amber-800/90 max-w-md mx-auto mt-1 leading-relaxed">
              Takaran gram presisi, racikan bumbu rahasia, langkah demi langkah, dan trik dapur penjual akan langsung terbuka otomatis setelah pembayaran Anda disetujui penjual.
            </p>

            <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center justify-center gap-4 text-[11px] text-amber-900 font-semibold">
              <span className="flex items-center gap-1">🔒 Takaran Gram</span>
              <span className="flex items-center gap-1">🔒 Trik Kunci Rasa</span>
              <span className="flex items-center gap-1">🔒 Chat Penjual Langsung</span>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold block">
                Total Biaya Resep & Pelatihan
              </span>
              <span className="text-2xl font-black text-teal-700 tracking-tight">
                {formatRupiah(selectedRecipe.price)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Beli Sekarang (Langkah 3 dari 5) →</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 4: TATA CARA 3 - FORM BELI & TITIK MAPS JUALAN (CHECKOUT)
  // ==========================================
  if (currentStep === 'checkout' && selectedRecipe) {
    const isUnder15Km = distanceKm < 15;

    return (
      <div className="space-y-4 max-w-2xl mx-auto pb-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep('detail_preview')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Isi Alamat Jualan & Pembayaran
            </h2>
            <p className="text-xs text-slate-500">
              Langkah 3: Konfirmasi titik Google Maps & pembayaran aman
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Ringkasan Resep */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            {selectedRecipe.photoUrl ? (
              <img
                src={selectedRecipe.photoUrl}
                alt={selectedRecipe.title}
                className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-300"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
                <ChefHat className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                {selectedRecipe.title}
              </h4>
              <p className="text-[11px] text-slate-500">
                Warung Penjual: {selectedRecipe.sellerWarung} ({selectedRecipe.city})
              </p>
              <p className="text-xs font-black text-teal-700 mt-0.5">
                {formatRupiah(selectedRecipe.price)}
              </p>
            </div>
          </div>

          {/* Form Biodata & Alamat Rencana Jualan */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Rencana Lokasi Usaha Pembeli
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Nama Lengkap Anda
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Contoh: Pak Budi Santoso"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                No. WhatsApp Aktif (Untuk Bimbingan Penjual)
              </label>
              <input
                type="text"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Alamat Lengkap Rencana Jualan
                </label>
                <input
                  type="text"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  placeholder="Contoh: Jl. Cisangkuy No. 25, Cihapit"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Kota / Wilayah Tempat Jualan
                </label>
                <select
                  value={buyerCity}
                  onChange={(e) => {
                    const c = e.target.value;
                    setBuyerCity(c);
                    // Dynamically toggle distance check
                    if (c && c.toLowerCase().includes(selectedRecipe.city.toLowerCase())) {
                      setDistanceKm(7.5);
                    } else {
                      setDistanceKm(48);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-500 bg-white"
                >
                  <option value="">-- Pilih Kota / Wilayah --</option>
                  <option value="Bandung">Bandung</option>
                  <option value="Semarang">Semarang</option>
                  <option value="Yogyakarta">Yogyakarta</option>
                  <option value="Jakarta Selatan">Jakarta Selatan</option>
                  <option value="Surabaya">Surabaya</option>
                  <option value="Malang">Malang</option>
                  <option value="Solo">Solo</option>
                  <option value="Lainnya">Kota Lainnya</option>
                </select>
              </div>
            </div>

            {/* Google Maps Distance Calculation Box */}
            <div className="p-3.5 rounded-xl border border-teal-200 bg-slate-50 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Kalkulasi Jarak ke Warung Penjual
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    isUnder15Km
                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  Jarak: {distanceKm} KM ({isUnder15Km ? 'Dekat: < 15 KM' : 'Aman: > 15 KM'})
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-1.5">
                {isUnder15Km ? (
                  <span className="text-orange-900 font-medium">
                    ⚠️ <strong>Pemberitahuan Radius 15 KM:</strong> Jarak lapak Anda cukup dekat ({distanceKm} KM) dari warung penjual asli di {selectedRecipe.city}. Penjual memiliki hak untuk menyetujui atau menolak. Jika ditolak, uang Anda kembali 100% otomatis.
                  </span>
                ) : (
                  <span className="text-emerald-900 font-medium">
                    ✅ <strong>Di Luar Radius 15 KM:</strong> Lokasi jualan Anda berjarak {distanceKm} KM dari penjual asli. Sangat aman dan biasanya langsung disetujui penjual.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Pilih Metode Pembayaran
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`p-3 rounded-xl border text-left font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'qris'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/30'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-4 h-4 text-teal-600" />
                <span>QRIS (Gopay / OVO / Dana / BCA)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`p-3 rounded-xl border text-left font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/30'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span>Transfer Bank (BCA / BRI / Mandiri)</span>
              </button>
            </div>
          </div>

          {/* Kotak Sistem Dana Adem */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed">
            <p className="font-extrabold flex items-center gap-1.5 mb-0.5 text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Sistem Dana Bersama yang Aman
            </p>
            <p className="italic text-emerald-800">
              "Dana dijaga bersama sampai pelatihan selesai, biar sama-sama tenang."
            </p>
            <p className="text-[11px] text-emerald-700 mt-1">
              Uang Anda tidak langsung cair ke penjual, melainkan disimpan aman oleh sistem sampai penjual menyetujui dan resep terbuka.
            </p>
          </div>

          {/* Tombol Bayar */}
          <button
            type="button"
            onClick={handleConfirmPayment}
            className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-teal-600/25 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5 stroke-[2.5]" />
            <span>Bayar {formatRupiah(selectedRecipe.price)} & Kirim ke Penjual</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 5: TATA CARA 4 - MENUNGGU PERSETUJUAN PENJUAL (RADIUS 15 KM)
  // ==========================================
  if (currentStep === 'waiting_approval' && selectedRecipe) {
    const isUnder15Km = distanceKm < 15;

    return (
      <div className="space-y-4 max-w-2xl mx-auto pb-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800">
              {orderStatus === 'rejected'
                ? 'Pesanan Ditolak Penjual (Dana Kembali 100%)'
                : 'Menunggu Persetujuan Penjual'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {orderStatus === 'rejected'
                ? 'Karena jarak jualan Anda terlalu dekat (< 15 KM) dengan warung penjual asli, penjual menolak pesanan demi menjaga radius usaha. Dana Anda otomatis dikembalikan 100% utuh tanpa potongan.'
                : 'Penjual sedang memeriksa jarak lokasi jualan Anda. Jika jarak lebih dari 15 KM, biasanya langsung disetujui (ACC).'}
            </p>
          </div>

          {/* Info Jarak */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Resep:</span>
              <span className="font-bold text-slate-800">{selectedRecipe.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Warung Penjual:</span>
              <span className="font-bold text-slate-800">{selectedRecipe.sellerWarung} ({selectedRecipe.city})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lokasi Rencana Anda:</span>
              <span className="font-bold text-slate-800">{buyerAddress}, {buyerCity}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Jarak Terhitung:</span>
              <span className="font-black text-teal-700">
                {distanceKm} KM ({isUnder15Km ? 'Radius < 15 KM' : 'Aman > 15 KM'})
              </span>
            </div>
          </div>

          {/* Sistem Dana Adem */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 max-w-md mx-auto text-left">
            <p className="font-bold">Dana Terjaga Aman di Sistem:</p>
            <p className="italic mt-0.5">
              "Dana dijaga bersama sampai pelatihan selesai, biar sama-sama tenang."
            </p>
          </div>

          {orderStatus !== 'rejected' ? (
            <div className="pt-2 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setCurrentStep('list')}
                className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
              >
                ← Kembali ke Daftar Resep
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep('list')}
                className="py-3 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                ← Cari Resep Lain di Luar Wilayah Anda
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 6: TATA CARA 5 - RESEP LENGKAP TERBUKA + WATERMARK + CHAT BIMBINGAN 7 HARI
  // ==========================================
  if (!selectedRecipe) {
    return null;
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep('list')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Resep Terbuka & Bimbingan Aktif
            </h2>
            <p className="text-xs text-slate-500">
              Langkah 5: Resep sah ber-watermark & pendampingan 7 hari
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Status: DI-ACC Penjual
        </span>
      </div>

      {/* DOKUMEN RESEP LENGKAP DENGAN WATERMARK RESMI NAMA PEMBELI */}
      <div className="bg-white rounded-2xl border-2 border-teal-500/40 p-5 sm:p-6 shadow-md relative overflow-hidden space-y-5">
        {/* WATERMARK RESMI DI LATAR BELAKANG */}
        <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-5 rotate-[-25deg]">
          <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-wider text-center leading-relaxed">
            HAK USAHA RESMI: {buyerName.toUpperCase()}<br />
            {buyerPhone} • DILARANG MENYEBAR / MENJUAL ULANG
          </p>
        </div>

        {/* Kop Resep Terbuka */}
        <div className="border-b border-slate-200 pb-4 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Resep Resmi Berlisensi
            </span>
            <h3 className="text-xl font-black text-slate-800 mt-1">
              {selectedRecipe.title}
            </h3>
            <p className="text-xs text-slate-500">
              Resep Rahasia Warung: <strong>{selectedRecipe.sellerWarung}</strong> ({selectedRecipe.sellerName})
            </p>
          </div>

          <div className="text-left sm:text-right bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs shrink-0">
            <span className="text-[10px] text-slate-400 block font-bold">Lisensi Atas Nama:</span>
            <span className="font-black text-teal-800">{buyerName}</span>
            <span className="text-[10px] text-slate-500 block">{buyerCity}</span>
          </div>
        </div>

        {/* 1. Bahan & Takaran Gram Presisi */}
        <div className="space-y-2 relative z-10">
          <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Daftar Bahan & Takaran Gram Presisi</span>
          </h4>
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 divide-y divide-slate-200/80">
            {selectedRecipe.ingredients.map((ing, idx) => (
              <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{ing.name}</span>
                <span className="font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  {ing.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Trik Rahasia Dapur Penjual */}
        <div className="space-y-2 relative z-10">
          <h4 className="text-sm font-extrabold text-amber-900 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Trik Rahasia & Kunci Rasa Penjual</span>
          </h4>
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
            {selectedRecipe.secretTricks.map((trick, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-amber-950">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  ★
                </span>
                <p className="leading-relaxed">{trick}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Langkah Pembuatan */}
        <div className="space-y-2 relative z-10">
          <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <ChefHat className="w-4 h-4 text-teal-600" />
            <span>Langkah-Langkah Pembuatan Bertahap</span>
          </h4>
          <div className="space-y-2">
            {selectedRecipe.steps.map((st, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <span className="w-5 h-5 rounded-md bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="leading-relaxed">{st}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION CHAT BIMBINGAN DENGAN PENJUAL (7 HARI AKTIF) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
        <div className="p-4 bg-teal-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="font-extrabold text-base">Chat Bimbingan Penjual</h4>
            </div>
            <p className="text-xs text-teal-100 mt-0.5">
              Masa pendampingan aktif: <strong>Hari ke-1 dari 7 Hari</strong>
            </p>
          </div>

          {/* WhatsApp Direct Action Button */}
          <button
            type="button"
            onClick={() =>
              alert(
                `Menghubungkan ke WhatsApp ${selectedRecipe.sellerPhone} (${selectedRecipe.sellerName}) untuk sesi pelatihan / video call santai...`
              )
            }
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Video className="w-4 h-4" />
            <span>Pelatihan Video Call via WhatsApp</span>
          </button>
        </div>

        {/* Pesan info adem sistem dana */}
        <div className="px-4 py-2 bg-emerald-50 text-[11px] text-emerald-900 border-b border-emerald-100 flex items-center justify-between">
          <span>
            💬 "Dana dijaga bersama sampai pelatihan selesai, biar sama-sama tenang."
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold hidden sm:inline">
            Pelatihan nyaman via WA
          </span>
        </div>

        {/* Chat message history */}
        <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
          {chatMessages.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-4">
              Belum ada pesan. Mulai tanya penjual seputar takaran atau teknik memasak di bawah ini.
            </p>
          ) : (
            chatMessages.map((msg) => {
              const isMe = msg.sender === 'buyer';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                    {msg.senderName} • {msg.time}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-teal-600 text-white rounded-br-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chat Input form */}
        <form onSubmit={handleSendChat} className="p-3 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Tanyakan takaran atau teknik ke penjual resep..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Button Back to Recipes */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => setCurrentStep('list')}
          className="text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
        >
          ← Kembali ke Daftar Resep
        </button>
      </div>
    </div>
  );
};
