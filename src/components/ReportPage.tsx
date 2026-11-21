import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Share2,
  Printer,
  ChevronLeft,
  ChevronRight,
  PieChart,
  DollarSign,
  FileDown,
  Building2,
  Archive,
  LineChart,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  X,
  Lightbulb,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction, ReportFilter } from '../types';
import {
  formatRupiah,
  getTodayDateString,
  formatDateIndo,
  formatDateFull,
} from '../utils/formatters';

interface ReportPageProps {
  transactions: Transaction[];
  businessName: string;
  ownerName?: string;
  isAuthenticated?: boolean;
  onRequireAuth?: (onSuccess?: () => void) => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  transactions,
  businessName,
  ownerName = 'Pemilik Warung',
  isAuthenticated = false,
  onRequireAuth,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<ReportFilter>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${m}`;
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isEduModalOpen, setIsEduModalOpen] = useState(false);

  // Date navigation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    if (filterPeriod === 'daily') {
      return transactions.filter((tx) => tx.date === selectedDate);
    } else if (filterPeriod === 'weekly') {
      const targetDate = new Date(selectedDate);
      const sevenDaysAgo = new Date(selectedDate);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      return transactions.filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate >= sevenDaysAgo && txDate <= targetDate;
      });
    } else {
      return transactions.filter((tx) => tx.date.startsWith(selectedMonth));
    }
  }, [transactions, filterPeriod, selectedDate, selectedMonth]);

  // Aggregate numbers
  const { totalIncome, totalExpense, incomeList, expenseList, categoryBreakdown } =
    useMemo(() => {
      let inc = 0;
      let exp = 0;
      const incL: Transaction[] = [];
      const expL: Transaction[] = [];
      const catMap: Record<string, { type: 'income' | 'expense'; total: number; count: number }> =
        {};

      filteredTransactions.forEach((tx) => {
        if (tx.type === 'income') {
          inc += tx.amount;
          incL.push(tx);
        } else {
          exp += tx.amount;
          expL.push(tx);
        }

        const cats = tx.category.split(',').map((s) => s.trim()).filter(Boolean);
        const splitAmount = cats.length > 0 ? tx.amount / cats.length : tx.amount;
        const categoriesToCount = cats.length > 0 ? cats : [tx.category];
        categoriesToCount.forEach((catName) => {
          if (!catMap[catName]) {
            catMap[catName] = { type: tx.type, total: 0, count: 0 };
          }
          catMap[catName].total += splitAmount;
          catMap[catName].count += 1;
        });
      });

      return {
        totalIncome: inc,
        totalExpense: exp,
        incomeList: incL,
        expenseList: expL,
        categoryBreakdown: Object.entries(catMap).map(([name, data]) => ({
          name,
          ...data,
        })),
      };
    }, [filteredTransactions]);

  const netProfit = totalIncome - totalExpense;
  const isProfit = netProfit >= 0;
  const profitMargin =
    totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

  // Period label for titles & PDF
  const periodLabel = useMemo(() => {
    if (filterPeriod === 'daily') {
      return `Harian (${formatDateFull(selectedDate)})`;
    } else if (filterPeriod === 'weekly') {
      return `7 Hari Terakhir (s/d ${formatDateIndo(selectedDate)})`;
    } else {
      return `Bulanan (${selectedMonth})`;
    }
  }, [filterPeriod, selectedDate, selectedMonth]);

  // Download PDF Report formatted for banks
  const handleDownloadPDF = () => {
    try {
      setIsGeneratingPdf(true);
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const todayPrintDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // 1. Header Bar
      doc.setFillColor(13, 148, 136); // Teal 600
      doc.rect(0, 0, 210, 10, 'F');

      // 2. Kop Laporan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('CuanUMKM - Laporan Keuangan UMKM', 14, 22);

      doc.setFontSize(12);
      doc.setTextColor(13, 148, 136);
      doc.text(businessName || 'Usaha UMKM', 14, 28);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Pemilik Usaha : ${ownerName}`, 14, 34);
      doc.text(`Periode Data  : ${periodLabel}`, 14, 39);
      doc.text(`Tanggal Cetak : ${todayPrintDate}`, 14, 44);

      // Line separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 48, 196, 48);

      // 3. Ringkasan Keuangan Box (Summary Card)
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, 52, 182, 30, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('RINGKASAN LABA RUGI USAHA', 18, 58);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Total Pemasukan', 18, 65);
      doc.text('Total Pengeluaran', 75, 65);
      doc.text('Laba Bersih (Untung/Rugi)', 132, 65);

      doc.setFontSize(11);
      doc.setTextColor(13, 148, 136); // Teal
      doc.text(formatRupiah(totalIncome), 18, 72);

      doc.setTextColor(234, 88, 12); // Orange
      doc.text(formatRupiah(totalExpense), 75, 72);

      if (isProfit) {
        doc.setTextColor(16, 185, 129); // Emerald
        doc.text(`${formatRupiah(netProfit)} (SURPLUS)`, 132, 72);
      } else {
        doc.setTextColor(225, 29, 72); // Rose
        doc.text(`${formatRupiah(netProfit)} (DEFISIT)`, 132, 72);
      }

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Jumlah Transaksi: ${filteredTransactions.length} kali | Margin Keuntungan: ${profitMargin}%`, 18, 78);

      // 4. Daftar Transaksi Sederhana (Tanggal, Keterangan, Masuk, Keluar)
      const tableRows = filteredTransactions.map((tx, idx) => {
        const typeLabel = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        const formattedTypeWithCat = `${typeLabel} (${tx.category})`;
        const keterangan = tx.notes
          ? `${formattedTypeWithCat} - ${tx.notes}`
          : formattedTypeWithCat;

        return [
          idx + 1,
          `${tx.date} ${tx.time || ''}`,
          keterangan,
          tx.type === 'income' ? formatRupiah(tx.amount) : '-',
          tx.type === 'expense' ? formatRupiah(tx.amount) : '-',
        ];
      });

      if (tableRows.length === 0) {
        tableRows.push(['-', '-', 'Belum ada transaksi pada periode ini', '-', '-']);
      }

      autoTable(doc, {
        startY: 86,
        head: [['No', 'Tanggal', 'Keterangan', 'Masuk (Rp)', 'Keluar (Rp)']],
        body: tableRows,
        foot: [
          [
            'TOTAL',
            '',
            `${filteredTransactions.length} Transaksi`,
            formatRupiah(totalIncome),
            formatRupiah(totalExpense),
          ],
        ],
        theme: 'striped',
        headStyles: {
          fillColor: [13, 148, 136],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left',
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 8.5,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 32 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 32, halign: 'right' },
          4: { cellWidth: 32, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });

      // 5. Kolom Tanda Tangan Resmi Pemilik (Bawah Tabel)
      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 180;
      
      // Check if signature fits on current page, otherwise add new page
      let sigY = finalY;
      if (sigY > 235) {
        doc.addPage();
        sigY = 25;
      }

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      // Keterangan Pengesahan
      doc.text(`Dinyatakan sah dan benar pada: ${todayPrintDate}`, 14, sigY);

      // Kolom Tanda Tangan Kiri: Pemilik Usaha
      doc.text('Pemilik Usaha / Pemohon:', 14, sigY + 7);
      doc.line(14, sigY + 28, 75, sigY + 28);
      doc.setFont('helvetica', 'bold');
      doc.text(ownerName, 14, sigY + 32);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(businessName || 'Usaha UMKM', 14, sigY + 36);

      // Kolom Tanda Tangan Kanan: Bank / Pihak Verifikator
      doc.setFontSize(8.5);
      doc.text('Diterima / Diverifikasi Oleh:', 130, sigY + 7);
      doc.line(130, sigY + 28, 195, sigY + 28);
      doc.setFont('helvetica', 'bold');
      doc.text('( Petugas Bank / Lembaga Modal )', 130, sigY + 32);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Tanda Tangan & Cap Lembaga', 130, sigY + 36);

      // Footer Resmi
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Dokumen ini dicetak otomatis dari aplikasi CuanUMKM sebagai rekaman keuangan usaha yang sah untuk keperluan pelaporan & perbankan.',
        14,
        287
      );

      // Save file
      const safeName = (businessName || 'Warung').replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Laporan_Keuangan_CuanUMKM_${safeName}_${filterPeriod}_${selectedDate}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Terjadi kendala saat membuat PDF. Silakan coba kembali.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Share text to WhatsApp
  const handleShareWhatsApp = () => {
    const text = `📊 *Laporan Keuangan CuanUMKM*
*${businessName || 'Usaha UMKM'}*
Periode: ${periodLabel}
---------------------------------
💰 *Pemasukan:* ${formatRupiah(totalIncome)} (${incomeList.length} tx)
💸 *Pengeluaran:* ${formatRupiah(totalExpense)} (${expenseList.length} tx)
---------------------------------
✨ *LABA BERSIH:* ${formatRupiah(netProfit)} ${isProfit ? '✅ (UNTUNG)' : '⚠️ (RUGI)'}
Margin Keuntungan: ${profitMargin}%
Total Transaksi: ${filteredTransactions.length}

_Dicatat otomatis dengan CuanUMKM_`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 pb-8">
      {/* 1. Header & Periode Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                Laporan Laba Rugi
              </h2>
              <button
                type="button"
                onClick={() => setIsEduModalOpen(true)}
                aria-label="Penting: Penjelasan Laporan Laba Rugi"
                title="Penting: Penjelasan Laporan Laba Rugi"
                className="w-6 h-6 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs"
              >
                <span className="text-xs font-black leading-none">!</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hitungan otomatis pemasukan dikurangi pengeluaran toko
            </p>
          </div>

          {/* Period Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setFilterPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPeriod === 'daily'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-teal-700'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setFilterPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPeriod === 'weekly'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-teal-700'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setFilterPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPeriod === 'monthly'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-teal-700'
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>

        {/* Date Filter Controls */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {filterPeriod === 'daily' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevDay}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
              />
              <button
                onClick={handleNextDay}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                ({formatDateIndo(selectedDate)})
              </span>
            </div>
          )}

          {filterPeriod === 'weekly' && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>
                7 Hari terakhir (s/d {formatDateIndo(selectedDate)})
              </span>
            </div>
          )}

          {filterPeriod === 'monthly' && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>
          )}

          {/* Action Buttons: WhatsApp & Print (Small CSV button removed per instructions) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Kirim ke WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xs:inline">Kirim WA</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer hidden sm:flex"
              title="Cetak Laporan"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Kartu Utama Laba Bersih Otomatis ("FORMULA OTOMATIS") */}
      <div
        className={`rounded-2xl p-6 shadow-md border transition-all text-white relative overflow-hidden ${
          isProfit
            ? 'bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 border-teal-600'
            : 'bg-gradient-to-br from-orange-600 via-orange-700 to-slate-900 border-orange-500'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-extrabold text-teal-200">
                Formula Otomatis
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono">
                Pemasukan - Pengeluaran
              </span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-1">
              {formatRupiah(netProfit)}
            </h3>
            <p className="text-xs sm:text-sm text-teal-100 font-medium mt-1">
              {isProfit
                ? 'Alhamdulillah, tokomu dalam kondisi CUAN (Untung Bersih)!'
                : 'Perhatian: Pengeluaran lebih besar dari pemasukan.'}
            </p>
          </div>

          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
              isProfit
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-rose-500/20 border-rose-400 text-rose-300'
            }`}
          >
            {isProfit ? (
              <TrendingUp className="w-8 h-8 stroke-[2.5]" />
            ) : (
              <TrendingDown className="w-8 h-8 stroke-[2.5]" />
            )}
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="mt-6 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-teal-200/90 block">Total Pemasukan:</span>
            <span className="font-extrabold text-white text-sm sm:text-base">
              {formatRupiah(totalIncome)}
            </span>
          </div>
          <div>
            <span className="text-orange-200/90 block">Total Pengeluaran:</span>
            <span className="font-extrabold text-white text-sm sm:text-base">
              {formatRupiah(totalExpense)}
            </span>
          </div>
          <div>
            <span className="text-teal-200/90 block">Margin Keuntungan:</span>
            <span className="font-extrabold text-white text-sm sm:text-base">
              {profitMargin}%
            </span>
          </div>
          <div>
            <span className="text-teal-200/90 block">Jumlah Transaksi:</span>
            <span className="font-extrabold text-white text-sm sm:text-base">
              {filteredTransactions.length} Kali
            </span>
          </div>
        </div>
      </div>

      {/* PENEMPATAN: DI ANTARA KARTU HIJAU FORMULA OTOMATIS & DAFTAR DETAIL TRANSAKSI */}
      {/* 3. Kartu Hijau Muda: "Kenapa Laporan Ini Penting?" */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50/80 rounded-2xl border border-emerald-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3.5 text-emerald-900">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
            Kenapa Laporan Ini Penting?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Poin 1: Bank */}
          <div className="bg-white/90 rounded-xl p-3.5 border border-emerald-100/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-emerald-800 font-bold text-xs sm:text-sm">
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span>Syarat Pinjaman Modal ke Bank</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bank biasanya minta bukti keuangan 3-6 bulan. Laporan rapi ini bisa jadi bukti kalau usaha sehat dan layak dapat modal.
              </p>
            </div>
          </div>

          {/* Poin 2: Arsip */}
          <div className="bg-white/90 rounded-xl p-3.5 border border-emerald-100/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-teal-800 font-bold text-xs sm:text-sm">
                <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Archive className="w-3.5 h-3.5" />
                </div>
                <span>Arsip Usaha Yang Rapi</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tidak perlu lagi cari kertas yang hilang. Semua tercatat rapi dan bisa dicetak kapan saja.
              </p>
            </div>
          </div>

          {/* Poin 3: Grafik */}
          <div className="bg-white/90 rounded-xl p-3.5 border border-emerald-100/90 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-emerald-800 font-bold text-xs sm:text-sm">
                <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <LineChart className="w-3.5 h-3.5" />
                </div>
                <span>Lihat Usaha Makin Maju</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bandingkan omzet bulan ini dengan bulan lalu.
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Besar Download Laporan PDF (Tepat di bawah kartu itu) */}
        <div className="mt-4 pt-3 border-t border-emerald-200/70">
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated && onRequireAuth) {
                onRequireAuth(() => handleDownloadPDF());
                return;
              }
              handleDownloadPDF();
            }}
            disabled={isGeneratingPdf}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white font-black text-sm sm:text-base shadow-lg shadow-teal-700/25 border border-teal-500/40 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <FileDown className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="text-left sm:text-center">
              <span>
                {isGeneratingPdf
                  ? 'Sedang Menyusun Dokumen PDF...'
                  : 'Download Laporan PDF (Siap Cetak / Siap ke Bank)'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Bar Visual Perbandingan & Kategori Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Perbandingan Pemasukan vs Pengeluaran */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-teal-600" />
            <span>Perbandingan Arus Kas</span>
          </h4>

          {totalIncome === 0 && totalExpense === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              Belum ada data pada periode ini
            </p>
          ) : (
            <div className="space-y-4">
              {/* Progress visual bar */}
              <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {totalIncome > 0 && (
                  <div
                    style={{
                      width: `${Math.round(
                        (totalIncome / (totalIncome + totalExpense)) * 100
                      )}%`,
                    }}
                    className="bg-teal-600 flex items-center justify-center text-[10px] font-bold text-white transition-all"
                  >
                    {Math.round((totalIncome / (totalIncome + totalExpense)) * 100)}%
                  </div>
                )}
                {totalExpense > 0 && (
                  <div
                    style={{
                      width: `${Math.round(
                        (totalExpense / (totalIncome + totalExpense)) * 100
                      )}%`,
                    }}
                    className="bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white transition-all"
                  >
                    {Math.round((totalExpense / (totalIncome + totalExpense)) * 100)}%
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    <span>Pemasukan</span>
                  </div>
                  <div className="text-sm font-black text-teal-900 mt-1">
                    {formatRupiah(totalIncome)}
                  </div>
                  <div className="text-[11px] text-teal-700 mt-0.5">
                    {incomeList.length} transaksi
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span>Pengeluaran</span>
                  </div>
                  <div className="text-sm font-black text-orange-900 mt-1">
                    {formatRupiah(totalExpense)}
                  </div>
                  <div className="text-[11px] text-orange-700 mt-0.5">
                    {expenseList.length} transaksi
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kategori Terbesar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-orange-500" />
            <span>Rincian per Kategori</span>
          </h4>

          {categoryBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              Belum ada transaksi di periode ini
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {categoryBreakdown
                .sort((a, b) => b.total - a.total)
                .map((cat) => {
                  const isInc = cat.type === 'income';
                  const baseTotal = isInc ? totalIncome : totalExpense;
                  const pct =
                    baseTotal > 0 ? Math.round((cat.total / baseTotal) * 100) : 0;

                  return (
                    <div
                      key={cat.name}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {cat.count}x transaksi • {pct}% dari total{' '}
                          {isInc ? 'masuk' : 'keluar'}
                        </div>
                      </div>
                      <div
                        className={`font-black text-sm text-right shrink-0 ${
                          isInc ? 'text-teal-700' : 'text-orange-600'
                        }`}
                      >
                        {formatRupiah(cat.total)}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Rincian Riwayat Transaksi di Periode Ini (Detail Transaksi) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800">
            Daftar Catatan Periode Ini ({filteredTransactions.length})
          </h4>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            Tidak ada transaksi pada filter ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 sm:px-5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800">
                      <span className={tx.type === 'income' ? 'text-teal-700' : 'text-orange-600'}>
                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>{' '}
                      <span className="text-slate-800">({tx.category})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {tx.date} {tx.time}
                    </span>
                  </div>
                  {tx.notes && (
                    <p className="text-slate-500 text-[11px] mt-0.5">{tx.notes}</p>
                  )}
                </div>

                <div
                  className={`font-bold text-sm tracking-tight ${
                    tx.type === 'income' ? 'text-teal-700' : 'text-orange-600'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pop-up Edukasi Laba Rugi */}
      {isEduModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setIsEduModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edu-report-title"
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-teal-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-gradient-to-r from-teal-800 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-200 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 id="edu-report-title" className="text-sm sm:text-base font-extrabold">
                  Info Penting Laporan Laba Rugi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEduModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Tutup jendela edukasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-amber-950 font-semibold leading-relaxed">
                  Penting: Pengeluaran lebih besar dari pemasukan hari ini belum tentu rugi—sering kali karena stok belanja baru yang akan terjual bertahap di hari-hari berikutnya.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEduModalOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
