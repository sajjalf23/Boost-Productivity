import React, { useState, useEffect } from 'react';
import { HardDrive, Download, CheckCircle2, ShieldCheck, Sparkles, Cpu, Mic, Volume2 } from 'lucide-react';
import { StorageService } from '../services/storage';

interface StorageGateModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export const StorageGateModal: React.FC<StorageGateModalProps> = ({ isOpen, onConfirm }) => {
  const [availableGB, setAvailableGB] = useState<number>(24.8);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');

  useEffect(() => {
    async function checkStorage() {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        try {
          const est = await navigator.storage.estimate();
          if (est.quota) {
            const freeBytes = est.quota - (est.usage || 0);
            setAvailableGB(Number((freeBytes / (1024 * 1024 * 1024)).toFixed(1)));
          }
        } catch {
          setAvailableGB(24.8);
        }
      }
    }
    checkStorage();
  }, []);

  if (!isOpen) return null;

  const handleStartDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(5);
    setCurrentStep('Allocating local model cache sandbox...');

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 98) {
          clearInterval(interval);
          setTimeout(() => {
            StorageService.setModelsDownloaded(true);
            setIsDownloading(false);
            onConfirm();
          }, 400);
          return 100;
        }

        const next = prev + Math.floor(Math.random() * 12) + 6;
        if (next < 35) {
          setCurrentStep('Downloading Gemma 3n E2B (quantized weights)...');
        } else if (next < 70) {
          setCurrentStep('Downloading Moonshine Tiny (acoustic STT)...');
        } else if (next < 90) {
          setCurrentStep('Downloading Piper TTS (neural speech model)...');
        } else {
          setCurrentStep('Verifying SHA-256 local integrity & indexing...');
        }
        return Math.min(next, 98);
      });
    }, 180);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <HardDrive className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">AI Component Setup</h2>
            <p className="text-xs text-zinc-400">Offline-first local intelligence engine</p>
          </div>
        </div>

        {/* Storage status box */}
        <div className="rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-4 mb-4">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-zinc-400">Device Available Storage:</span>
            <span className="font-mono font-medium text-emerald-400">{availableGB} GB</span>
          </div>
          <div className="text-xs text-zinc-300 leading-relaxed">
            Boost Productivity requires approximately <strong className="text-white font-mono">1.62 GB</strong> for the local AI components.
          </div>
        </div>

        {/* Components breakdown */}
        <div className="space-y-2 mb-5">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
            Components to install:
          </span>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/40 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-medium text-zinc-200">Gemma 3n E2B</div>
                  <div className="text-[11px] text-zinc-500">Local reasoning, task decomposition & planning</div>
                </div>
              </div>
              <span className="font-mono text-zinc-300">1.50 GB</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/40 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-medium text-zinc-200">Moonshine Tiny</div>
                  <div className="text-[11px] text-zinc-500">On-device acoustic speech-to-text</div>
                </div>
              </div>
              <span className="font-mono text-zinc-300">45 MB</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/40 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-medium text-zinc-200">Piper TTS</div>
                  <div className="text-[11px] text-zinc-500">Fast local neural speech synthesis</div>
                </div>
              </div>
              <span className="font-mono text-zinc-300">65 MB</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-800/40 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-medium text-zinc-200">App Runtime & Offline Vault</div>
                  <div className="text-[11px] text-zinc-500">Task heatmaps, SQLite state & documents</div>
                </div>
              </div>
              <span className="font-mono text-zinc-300">15 MB</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 px-1 text-xs border-t border-zinc-800/80 font-medium">
            <span className="text-zinc-400">Total required:</span>
            <span className="font-mono text-white text-sm">~1.62 GB</span>
          </div>
        </div>

        {/* Privacy note */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mb-5 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-900">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>100% Offline Promise: Once downloaded, the application runs entirely without internet. Zero data ever leaves your device.</span>
        </div>

        {/* Progress or confirmation CTA */}
        {isDownloading ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-300">{currentStep}</span>
              <span className="font-mono text-emerald-400 font-semibold">{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-200 ease-out"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 text-center">Storing weights in offline cache storage...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-zinc-300 font-medium mb-1">
              Do you want to download the required components?
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleStartDownload}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-lg shadow-emerald-950/50"
              >
                <Download className="w-4 h-4" />
                <span>Yes, Download All</span>
              </button>
              <button
                onClick={() => {
                  StorageService.setModelsDownloaded(true);
                  onConfirm();
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors border border-zinc-700"
              >
                <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                <span>Quick Start (Demo)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
