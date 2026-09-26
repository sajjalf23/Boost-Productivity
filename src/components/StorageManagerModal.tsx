import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Trash2,
  X,
  FileText,
  MessageSquare,
  Activity,
  Cpu,
  DownloadCloud,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { StorageBreakdown } from '../types';
import { StorageService } from '../services/storage';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStorageChanged: () => void;
  onRequestDownload: () => void;
}

export const StorageManagerModal: React.FC<StorageManagerModalProps> = ({
  isOpen,
  onClose,
  onStorageChanged,
  onRequestDownload,
}) => {
  const [stats, setStats] = useState<StorageBreakdown | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refreshStats = async () => {
    const s = await StorageService.getStorageBreakdown();
    setStats(s);
  };

  useEffect(() => {
    if (isOpen) {
      refreshStats();
      setFeedback(null);
      setConfirmDelete(null);
    }
  }, [isOpen]);

  if (!isOpen || !stats) return null;

  const showNotice = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDeleteChat = () => {
    StorageService.clearChatHistory();
    refreshStats();
    onStorageChanged();
    showNotice('Chat history cleared.');
  };

  const handleDeleteActivity = () => {
    StorageService.clearActivityHistory();
    refreshStats();
    onStorageChanged();
    showNotice('Activity history cleared.');
  };

  const handleResetDocuments = () => {
    StorageService.resetDocuments();
    refreshStats();
    onStorageChanged();
    showNotice('Personal documents reset to template.');
  };

  const handleDeleteModels = () => {
    StorageService.deleteModelsCache();
    refreshStats();
    onStorageChanged();
    showNotice('AI models cache removed.');
  };

  const modelsReady = StorageService.areModelsDownloaded();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-white">Boost Productivity Storage</h2>
              <p className="text-xs text-zinc-400">Total: {stats.totalMB > 1024 ? `${(stats.totalMB / 1024).toFixed(2)} GB` : `${stats.totalMB} MB`}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedback && (
          <div className="my-3 px-3 py-2 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Breakdown List */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Storage Breakdown
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">App Runtime & UI:</span>
              <span className="font-mono text-zinc-200">{stats.appSizeMB.toFixed(1)} MB</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-zinc-300">Gemma 3n E2B (LLM):</span>
              </div>
              <span className="font-mono text-zinc-200">{stats.gemmaSizeMB > 0 ? `${(stats.gemmaSizeMB / 1024).toFixed(2)} GB` : 'Not cached'}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-300">Moonshine Tiny (STT):</span>
              </div>
              <span className="font-mono text-zinc-200">{stats.moonshineSizeMB > 0 ? `${stats.moonshineSizeMB} MB` : 'Not cached'}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-300">Piper TTS (Voice):</span>
              </div>
              <span className="font-mono text-zinc-200">{stats.piperSizeMB > 0 ? `${stats.piperSizeMB} MB` : 'Not cached'}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-zinc-300">Chat History:</span>
              </div>
              <span className="font-mono text-zinc-200">{stats.chatSizeKB} KB</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-zinc-300">Personal Documents:</span>
              </div>
              <span className="font-mono text-zinc-200">{stats.documentsSizeKB} KB</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-zinc-300">Tasks & Activity History:</span>
              </div>
              <span className="font-mono text-zinc-200">{(stats.tasksSizeKB + stats.historySizeKB).toFixed(1)} KB</span>
            </div>
          </div>
        </div>

        {/* Granular Management Actions */}
        <div className="mt-5 space-y-2 text-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Granular Data Cleanup
          </div>

          <div className="space-y-1.5">
            <button
              onClick={handleDeleteChat}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            >
              <span>Delete Chat History</span>
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              onClick={handleDeleteActivity}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            >
              <span>Delete Old Activity & Heatmap Data</span>
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              onClick={handleResetDocuments}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
            >
              <span>Reset Personal Goals Document</span>
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* AI Models Cache Controls */}
        <div className="mt-5 pt-4 border-t border-zinc-800 space-y-2 text-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            AI Model Cache Management
          </div>

          {modelsReady ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-rose-950/20 border border-rose-900/40">
              <div>
                <div className="font-medium text-rose-300">Delete AI Models Cache (~1.61 GB)</div>
                <div className="text-[11px] text-zinc-400">Cleans models without deleting your personal tasks or history.</div>
              </div>
              <button
                onClick={handleDeleteModels}
                className="px-2.5 py-1.5 rounded-md bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-medium transition-colors"
              >
                Delete Models
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
              <div>
                <div className="font-medium text-emerald-300">AI Models Not Downloaded</div>
                <div className="text-[11px] text-zinc-400">Download Gemma, Moonshine, & Piper now.</div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onRequestDownload();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-5 text-[11px] text-zinc-500 text-center">
          Available device storage: <span className="font-mono text-zinc-400">{stats.deviceAvailableGB} GB</span>
        </div>
      </div>
    </div>
  );
};
