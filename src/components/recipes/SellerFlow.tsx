import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  Lock,
  MapPin,
  Clock,
  DollarSign,
  AlertTriangle,
  Upload,
  ChefHat,
  Send,
  Sparkles,
  Phone,
  Store,
  Check,
  X,
  MessageCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import type { Recipe, RecipeOrder } from '../../types/recipe';
import { formatRupiah, parseRupiahInput } from '../../utils/formatters';

interface SellerFlowProps {
  onBack: () => void;
  onRecipeCreated: (recipe: Recipe) => void;
  sellerWarungName: string;
  sellerOwnerName: string;
  sellerPhone: string;
  sellerAddress: string;
  orders?: RecipeOrder[];
  onOrderDecision?: (orderId: string, decision: 'approved' | 'rejected') => void;
}

export const SellerFlow: React.FC<SellerFlowProps> = ({
  onBack,
  onRecipeCreated,
  sellerWarungName,
  sellerOwnerName,
  sellerPhone,
  sellerAddress,
  orders: externalOrders,
  onOrderDecision,
}) => {
  // Step: 'rules' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5_dashboard'
  const [currentStep, setCurrentStep] = useState<
    'rules' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5_dashboard'
  >('rules');

  // Rules agreement
  const [agreedToRules, setAgreedToRules] = useState(false);

  // Form Step 1: Info dasar & Omzet (bersih tanpa data dummy)
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Ayam & Unggas');
  const [price, setPrice] = useState<number>(0);
  const [priceStr, setPriceStr] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [omzetDesc, setOmzetDesc] = useState('');
  const [portionPerDay, setPortionPerDay] = useState(0);

  // Form Step 2: Detail Rahasia (TERKUNCI)
  const [ingredientsText, setIngredientsText] = useState('');
  const [secretTricksText, setSecretTricksText] = useState('');
  const [stepsText, setStepsText] = useState('');

  // Form Step 3: Alamat & Titik Maps Warung
  const [warungAddress, setWarungAddress] = useState(sellerAddress || '');
  const [city, setCity] = useState('');
  const [isMapConfirmed, setIsMapConfirmed] = useState(true);

  const [localOrders, setLocalOrders] = useState<RecipeOrder[]>([]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseRupiahInput(e.target.value);
    setPrice(parsed);
    setPriceStr(parsed > 0 ? parsed.toLocaleString('id-ID') : '');
  };

  const calculateCommission = (gross: number) => {
    const fee = Math.round(gross * 0.15); // 15%
    const sellerNet = gross - fee; // 85%
    return { fee, sellerNet };
  };

  const { fee: adminFee, sellerNet } = calculateCommission(price);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitToAdmin = () => {
    const newRecipe: Recipe = {
      id: `rcp_custom_${Date.now()}`,
      sellerId: 'user_current',
      sellerName: sellerOwnerName || 'Pemilik Usaha',
      sellerWarung: sellerWarungName || 'Usaha UMKM',
      sellerPhone: sellerPhone || '',
      sellerAddress: warungAddress.trim(),
      city: city.trim() || 'Indonesia',
      title: title.trim() || 'Resep Usaha Rahasia',
      category,
      price: price || 0,
      photoUrl,
      omzetDescription:
        omzetDesc.trim() ||
        (portionPerDay > 0
          ? `Terjual ${portionPerDay} porsi/hari.`
          : 'Resep racikan usaha UMKM.'),
      portionPerDay,
      rating: 5.0,
      reviewCount: 0,
      ingredients: ingredientsText
        .split('\n')
        .filter((l) => l.trim())
        .map((line) => {
          const parts = line.split(':');
          return {
            name: parts[0] || line,
            amount: parts[1] || 'Sesuai takaran resep',
          };
        }),
      secretTricks: secretTricksText.split('\n').filter((l) => l.trim()),
      steps: stepsText.split('\n').filter((l) => l.trim()),
      status: 'review',
      createdAt: new Date().toISOString(),
    };

    onRecipeCreated(newRecipe);
    setCurrentStep('step5_dashboard');
  };

  const displayedOrders = externalOrders ?? localOrders;

  const handleOrderDecision = (orderId: string, decision: 'approve' | 'reject') => {
    const mappedStatus = decision === 'approve' ? 'approved' : 'rejected';
    if (onOrderDecision) {
      onOrderDecision(orderId, mappedStatus);
      return;
    }
    setLocalOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          status: mappedStatus,
          rejectionReason:
            decision === 'reject'
              ? 'Jarak pembeli terlalu dekat (< 15 KM) dari warung penjual demi menjaga proteksi radius usaha.'
              : undefined,
        };
      })
    );
  };

  // ==========================================
  // VIEW: ATURAN PENJUAL
  // ==========================================
  if (currentStep === 'rules') {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* Header navigation */}
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
              Aturan Bagi Penjual Resep
            </h2>
            <p className="text-xs text-slate-500">
              Pahami 5 aturan kejujuran & saling berkah sebelum menjual resep
            </p>
          </div>
        </div>

        {/* Rules Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-teal-900">
                Prinsip: Berkah Bersama, Cuan Bersama
              </h4>
              <p className="text-xs text-teal-800 leading-relaxed mt-0.5">
                Resep yang dijual di CuanUMKM adalah resep sungguhan yang sudah menghidupi warung Anda. Kami menjaga hak penjual dan pembeli secara adil.
              </p>
            </div>
          </div>

          {/* 5 Rules Listed */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                  Resep Wajib ORISINIL Racikan Sendiri
                </h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sudah terbukti jualan dan laku di warung Anda. <strong>Dilarang keras menyalin (copy-paste) dari YouTube atau TikTok.</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                  Wajib Isi Alamat Warung + Titik Google Maps yang Benar
                </h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Ini penting untuk <strong>Proteksi Radius 15 KM</strong>, agar orang di dekat warung Anda tidak bisa membuka usaha yang sama persis di sebelah lapak Anda.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                  Wajib Bimbing Pembeli Sampai Bisa via Chat (Min. 7 Hari)
                </h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Jawab pertanyaan pembeli jika mereka bingung takaran atau teknik memasak. Pelatihan video call santai boleh lewat WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                4
              </span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-800">
                  Bagi Hasil Adil: Komisi Aplikasi 15%, Penjual Terima 85%
                </h5>
                <p className="text-xs text-slate-600 mt-0.5">
                  Misal resep dijual Rp 500.000, Anda menerima bersih Rp 425.000. Komisi 15% digunakan untuk operasional sistem, perlindungan dana, dan kurasi admin.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/80 border border-rose-200">
              <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                5
              </span>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-rose-900">
                  Sanksi Pemalsuan: Blokir Permanen
                </h5>
                <p className="text-xs text-rose-800 mt-0.5">
                  Jika terbukti resep asal comot dari internet atau palsu, dana ditahan dan akun diblokir secara permanen.
                </p>
              </div>
            </div>
          </div>

          {/* Sistem Dana Adem Info */}
          <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 mb-1 text-amber-950">
              <Info className="w-4 h-4 text-amber-600" />
              Sistem Dana Aman CuanUMKM
            </p>
            <p>
              "Dana dijaga bersama sampai pelatihan selesai, biar sama-sama tenang." Pembeli membayar di aplikasi, dana diteruskan ke penjual setelah bimbingan dasar selesai.
            </p>
          </div>

          {/* Mandatory Checkbox */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-teal-200 bg-teal-50/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="w-5 h-5 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Saya Setuju dengan 5 Aturan Penjual di Atas
              </span>
            </label>
          </div>

          {/* Action button */}
          <button
            type="button"
            disabled={!agreedToRules}
            onClick={() => setCurrentStep('step1')}
            className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-base shadow-lg shadow-teal-600/25 transition-all transform active:scale-98 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Lanjut Buat Resep (Langkah 1 dari 5) →
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: FORM UPLOAD 5 LANGKAH
  // ==========================================
  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-10">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (currentStep === 'step1') setCurrentStep('rules');
              else if (currentStep === 'step2') setCurrentStep('step1');
              else if (currentStep === 'step3') setCurrentStep('step2');
              else if (currentStep === 'step4') setCurrentStep('step3');
              else setCurrentStep('step4');
            }}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Form Jual Resep Rahasia
            </h2>
            <p className="text-xs text-slate-500">
              Langkah{' '}
              {currentStep === 'step1'
                ? '1: Info & Omzet'
                : currentStep === 'step2'
                ? '2: Resep Lengkap (Terkunci)'
                : currentStep === 'step3'
                ? '3: Titik Maps & Proteksi 15 KM'
                : currentStep === 'step4'
                ? '4: Ringkasan & Kirim Admin'
                : '5: Status Kurasi & Pesanan'}
            </p>
          </div>
        </div>

        {/* Progress pill */}
        <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-black">
          {currentStep === 'step1' && '1 / 5'}
          {currentStep === 'step2' && '2 / 5'}
          {currentStep === 'step3' && '3 / 5'}
          {currentStep === 'step4' && '4 / 5'}
          {currentStep === 'step5_dashboard' && '5 / 5'}
        </span>
      </div>

      {/* STEP 1: Info Dasar & Omzet */}
      {currentStep === 'step1' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-teal-600" />
              <span>Langkah 1: Informasi Dasar & Bukti Laku</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tulis nama masakan dan bukti omzet agar calon pembeli yakin resep ini terbukti laku
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Resep / Menu Andalan Warung
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Ayam Goreng Lengkuas Rempah Basah Renyah"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kategori Masakan
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 bg-white"
              >
                <option value="Ayam & Unggas">Ayam & Unggas</option>
                <option value="Bakso & Soto">Bakso & Soto</option>
                <option value="Sambal & Bumbu">Sambal & Bumbu</option>
                <option value="Minuman & Kopi">Minuman & Kopi</option>
                <option value="Gorengan & Camilan">Gorengan & Camilan</option>
                <option value="Nasi & Lauk Pauk">Nasi & Lauk Pauk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Harga Jual Resep (Rp)
              </label>
              <div className="relative">
                <span className="font-bold text-xs text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceStr}
                  onChange={handlePriceChange}
                  placeholder="250.000"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
              <p className="text-[10px] text-teal-700 font-medium mt-1">
                Anda menerima bersih 85%: <strong>{formatRupiah(sellerNet)}</strong>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Foto Asli Jualan Warung
            </label>
            <div className="flex items-center gap-3">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Foto Resep"
                  className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0">
                  <ChefHat className="w-6 h-6" />
                  <span className="text-[10px] font-semibold mt-0.5">Belum ada</span>
                </div>
              )}
              <div className="text-xs text-slate-500 space-y-2 flex-1">
                <p className="font-medium text-slate-700">Unggah foto asli makanan yang dijual</p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-[11px] font-bold text-teal-800 inline-flex items-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Foto dari Perangkat</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Deskripsi Omzet & Bukti Penjualan Harian
            </label>
            <textarea
              rows={2}
              value={omzetDesc}
              onChange={(e) => setOmzetDesc(e.target.value)}
              placeholder="Contoh: Laku 80-100 porsi per hari di Pasar Minggu. Omzet harian rata-rata Rp 2.000.000 - Rp 2.800.000."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setCurrentStep('step2')}
            className="w-full py-3.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Lanjut Langkah 2: Isi Detail Resep Terkunci →
          </button>
        </div>
      )}

      {/* STEP 2: Detail Resep Lengkap (TERKUNCI) */}
      {currentStep === 'step2' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                <span>Langkah 2: Detail Resep Lengkap (TERKUNCI)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bagian ini <strong>rahasia & terkunci gembok</strong>. Calon pembeli hanya bisa membaca setelah Anda menyetujui transaksinya.
              </p>
            </div>
            <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold flex items-center gap-1 shrink-0">
              <Lock className="w-3 h-3" />
              Terkunci
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Bahan & Takaran Gram Presisi (1 baris per bahan)
            </label>
            <textarea
              rows={5}
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder="10 kg Ayam Segar potong 8&#10;1.200 gram Lengkuas parut&#10;350 gram Bawang putih kating&#10;3 liter Air kelapa murni"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:border-teal-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              *Tuliskan takaran dalam satuan gram atau sendok agar pembeli mudah meniru dengan presisi.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5 text-amber-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Trik Rahasia / Kunci Rasa Penjual
            </label>
            <textarea
              rows={3}
              value={secretTricksText}
              onChange={(e) => setSecretTricksText(e.target.value)}
              placeholder="Contoh: Wajib gunakan air kelapa saat ungkep, suhu minyak saat menggoreng serundeng harus 160°C..."
              className="w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Langkah Pembuatan Bertahap
            </label>
            <textarea
              rows={4}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              placeholder="1. Haluskan bumbu rempah...&#10;2. Ungkep ayam...&#10;3. Goreng serundeng secara terpisah..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCurrentStep('step1')}
              className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep('step3')}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Lanjut Langkah 3: Konfirmasi Titik Maps Warung →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Konfirmasi Alamat & Titik Maps Warung */}
      {currentStep === 'step3' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              <span>Langkah 3: Konfirmasi Alamat + Titik Google Maps Warung</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Titik lokasi ini digunakan oleh sistem CuanUMKM untuk <strong>Proteksi Radius 15 KM</strong>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Alamat Lengkap Warung / Usaha Anda
            </label>
            <input
              type="text"
              value={warungAddress}
              onChange={(e) => setWarungAddress(e.target.value)}
              placeholder="Jl. Pasar Minggu Raya No. 45"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Kota / Wilayah
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Jakarta Selatan"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Simulated Google Maps Pin */}
          <div className="rounded-xl border border-teal-200 bg-slate-100 overflow-hidden relative p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600" />
                Titik Koordinat Google Maps Terkunci
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-800 rounded">
                Radius 15 KM Aktif
              </span>
            </div>

            <div className="h-32 bg-gradient-to-tr from-slate-200 via-teal-100/50 to-emerald-100/50 rounded-lg flex flex-col items-center justify-center border border-slate-300 relative text-center p-3">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 animate-bounce">
                <Store className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {sellerWarungName || 'Usaha Anda'}
              </p>
              <p className="text-[11px] text-slate-500">
                {warungAddress || 'Alamat belum diisi'}{city ? `, ${city}` : ''}
              </p>

              {/* Protective circular radar */}
              <div className="absolute inset-0 border-2 border-teal-500/30 rounded-lg pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              🛡️ <strong>Bagaimana Proteksi 15 KM Bekerja?</strong> Pembeli dengan jarak jualan di bawah 15 KM dari warung Anda akan diberi peringatan, dan Anda berhak menolak pesanan mereka agar tidak menjadi saingan dekat.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCurrentStep('step2')}
              className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep('step4')}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              Lanjut Langkah 4: Review Komisi & Kirim ke Admin →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Kirim ke Admin untuk Review (1x24 Jam) */}
      {currentStep === 'step4' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Send className="w-5 h-5 text-teal-600" />
              <span>Langkah 4: Kirim ke Admin untuk Di-Review (1x24 Jam)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin CuanUMKM akan memastikan resep orisinil dan layak tayang
            </p>
          </div>

          {/* Summary Preview Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center gap-3">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={title || 'Foto Resep'}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-300"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
                  <ChefHat className="w-7 h-7" />
                </div>
              )}
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{title || 'Resep Usaha Rahasia'}</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Usaha: {sellerWarungName || 'Usaha Anda'}{city ? ` • ${city}` : ''}
                </p>
                <span className="inline-block px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px] mt-1">
                  {category}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Harga Jual ke Pembeli:</span>
                <span className="font-bold text-slate-800">{formatRupiah(price)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Komisi Aplikasi CuanUMKM (15%):</span>
                <span className="font-bold text-slate-600">- {formatRupiah(adminFee)}</span>
              </div>
              <div className="flex justify-between text-teal-800 font-bold text-sm pt-1 border-t border-slate-200">
                <span>Penjual Bersih Terima (85%):</span>
                <span className="font-black text-teal-700">{formatRupiah(sellerNet)}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Apa yang Terjadi Setelah Dikirim?
            </p>
            <ul className="list-disc list-inside space-y-1 text-emerald-800 text-[11px]">
              <li>Admin meninjau kelengkapan takaran & foto asli dalam waktu 1x24 jam.</li>
              <li>Jika disetujui, resep Anda tayang di daftar resep terbukti laku.</li>
              <li>Saat ada calon pembeli, Anda dapat notifikasi untuk <strong>ACC / Tolak</strong> berdasarkan jarak 15 KM.</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCurrentStep('step3')}
              className="py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={handleSubmitToAdmin}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Kirim ke Admin Sekarang (Review 1x24 Jam)</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Status Dikirim & Simulasi Notifikasi Pembeli (Proteksi 15 KM) */}
      {currentStep === 'step5_dashboard' && (
        <div className="space-y-4">
          {/* Success Banner */}
          <div className="bg-gradient-to-br from-teal-700 to-emerald-800 text-white rounded-2xl p-5 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Check className="w-7 h-7 text-white stroke-[3]" />
              </div>
              <div>
                <h3 className="font-black text-lg">Resep Berhasil Dikirim!</h3>
                <p className="text-xs text-teal-100">
                  Status saat ini: <strong>Sedang Ditinjau Admin (1x24 Jam)</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Permintaan Beli Masuk */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <span>Permintaan Beli Masuk (Proteksi 15 KM)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar calon pembeli yang mengajukan pembelian resep Anda akan tampil di sini untuk di-ACC atau ditolak.
                </p>
              </div>
            </div>

            {displayedOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                Belum ada permintaan beli masuk saat ini.
              </div>
            ) : (
            <div className="space-y-3">
              {displayedOrders.map((ord) => {
                const isUnder15Km = ord.distanceKm < 15;
                return (
                  <div
                    key={ord.id}
                    className={`p-4 rounded-xl border transition-all ${
                      ord.status === 'approved'
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : ord.status === 'rejected'
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isUnder15Km
                        ? 'bg-orange-50/70 border-orange-300'
                        : 'bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-slate-800">{ord.buyerName}</h5>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isUnder15Km
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : 'bg-teal-100 text-teal-800 border border-teal-200'
                            }`}
                          >
                            Jarak: {ord.distanceKm} KM {isUnder15Km ? '(Peringatan: <15 KM)' : '(Aman: >15 KM)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Rencana jualan di: <strong>{ord.buyerAddress}</strong>
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Nominal Pembayaran: <strong>{formatRupiah(ord.price)}</strong> (Anda terima 85%: {formatRupiah(Math.round(ord.price * 0.85))})
                        </p>
                      </div>

                      {/* Status Badge */}
                      {ord.status === 'approved' && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shrink-0">
                          Sudah Di-ACC
                        </span>
                      )}
                      {ord.status === 'rejected' && (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-500 text-white text-xs font-bold shrink-0">
                          Ditolak (Refund 100%)
                        </span>
                      )}
                    </div>

                    {isUnder15Km && ord.status === 'waiting_approval' && (
                      <div className="mt-2.5 p-2 bg-orange-100/90 rounded-lg text-[11px] text-orange-900 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Perhatian:</strong> Lokasi pembeli hanya berjarak <strong>{ord.distanceKm} KM</strong> dari warung Anda. Anda disarankan menolak pesanan ini untuk melindungi omzet warung sendiri.
                        </span>
                      </div>
                    )}

                    {ord.status === 'waiting_approval' && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOrderDecision(ord.id, 'approve')}
                          className="flex-1 py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>ACC Penjualan Resep</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOrderDecision(ord.id, 'reject')}
                          className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak (Uang Kembali 100%)</span>
                        </button>
                      </div>
                    )}

                    {ord.status === 'approved' && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                        <span>Resep lengkap sudah terbuka untuk {ord.buyerName}.</span>
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `Membuka WhatsApp ke ${ord.buyerPhone} untuk bimbingan memasak santai...`
                            )
                          }
                          className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Mulai Chat Bimbingan 7 Hari</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* Button to go back */}
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs transition-colors cursor-pointer"
          >
            ← Kembali ke Halaman Utama Berbagi Resep
          </button>
        </div>
      )}
    </div>
  );
};
