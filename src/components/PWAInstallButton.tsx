import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;
  if (!isInstallable && !isIOS) return null;

  const handleClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    await promptInstall();
  };

  return (
    <>
      {variant === 'card' ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full p-4 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100/80 hover:to-emerald-100/80 text-left flex items-center justify-between gap-3 shadow-xs transition-all active:scale-99 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-teal-950 leading-snug">
                Pasang Aplikasi CuanUMKM
              </h3>
              <p className="text-[11px] text-teal-800/80 mt-0.5 leading-snug">
                Buka langsung dari layar utama &amp; catat kasir tetap jalan saat offline
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs">
            <Download className="w-3.5 h-3.5" />
            <span>Pasang</span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          title="Pasang aplikasi CuanUMKM ke layar utama"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-bold transition-colors active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Pasang App</span>
        </button>
      )}

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800">
                  Pasang CuanUMKM di iPhone / iPad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                aria-label="Tutup panduan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  Ketuk tombol <strong className="inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 text-teal-600 inline" /> Bagikan (Share)</strong> di bilah Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  Pilih menu <strong className="inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-teal-600 inline" /> Tambah ke Layar Utama</strong> (Add to Home Screen).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>
                  Ketuk <strong>Tambah</strong> di pojok kanan atas untuk membuka CuanUMKM layar penuh secara offline.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
