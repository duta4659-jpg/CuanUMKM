import React from 'react';
import { WifiOff, HardDriveDownload } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-2 text-xs font-semibold"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="truncate">
            Mode Offline Aktif — Pencatatan tetap berjalan &amp; tersimpan aman di perangkat.
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 shrink-0">
          <HardDriveDownload className="w-3.5 h-3.5" />
          <span>Tersimpan Lokal</span>
        </span>
      </div>
    </div>
  );
};
