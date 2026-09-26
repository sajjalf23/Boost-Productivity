import React from 'react';
import { HardDrive, Menu } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onOpenStorage: () => void;
  storageTotalMB: number;
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenStorage, storageTotalMB, onOpenMenu }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Menu toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMenu}
            className="p-2 -ml-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-850 active:bg-zinc-800 transition-colors"
            title="Open navigation menu"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400 shadow-xs">
              <span className="font-bold text-sm tracking-tighter text-white">BP</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white">Boost Productivity</h1>
            </div>
          </div>
        </div>

        {/* Engine status & actions */}
        <div className="flex items-center gap-2">
          {/* Engine model indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Gemma 3n · Moonshine · Piper</span>
          </div>

          {/* Storage button */}
          <button
            onClick={onOpenStorage}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
            title="Inspect device storage usage and manage offline models"
          >
            <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-mono text-[11px]">
              {storageTotalMB > 1024 ? `${(storageTotalMB / 1024).toFixed(1)} GB` : `${Math.round(storageTotalMB)} MB`}
            </span>
          </button>

          {/* In-app PWA install button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
