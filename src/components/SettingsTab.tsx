import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Volume2,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  Check,
  FileCode,
} from 'lucide-react';
import { SystemSettings } from '../types';
import { StorageService, DEFAULT_SYSTEM_PROMPT } from '../services/storage';

interface SettingsTabProps {
  onOpenStorage: () => void;
  onDataChanged: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onOpenStorage, onDataChanged }) => {
  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSettings());
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setSettings(StorageService.getSettings());
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    StorageService.saveSettings(settings);
    onDataChanged();
    showNotice('Settings and System Prompt saved successfully!');
  };

  const handleResetPrompt = () => {
    const updated = { ...settings, systemPrompt: DEFAULT_SYSTEM_PROMPT };
    setSettings(updated);
    StorageService.saveSettings(updated);
    onDataChanged();
    showNotice('System prompt reset to default Gemma 3n specification.');
  };

  const handleExportBackup = () => {
    const json = StorageService.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `boost-productivity-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Complete data backup exported.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = StorageService.importAllData(content);
      if (ok) {
        setSettings(StorageService.getSettings());
        onDataChanged();
        showNotice('Backup restored successfully!');
      } else {
        showNotice('Failed to parse backup file. Please verify JSON format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white tracking-tight">System & Engine Settings</h2>
        <p className="text-xs text-zinc-400">
          Configure Gemma 3n system prompt, Piper TTS voice parameters, and local data backups
        </p>
      </div>

      {notice && (
        <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* System Prompt Customizer Section */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Gemma 3n E2B System Prompt</span>
            </div>
            <button
              type="button"
              onClick={handleResetPrompt}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Default</span>
            </button>
          </div>

          <p className="text-[11px] text-zinc-500">
            Define the persona, tone, task decomposition rules, and constraints for the local LLM.
          </p>

          <textarea
            rows={9}
            value={settings.systemPrompt}
            onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-hidden focus:border-zinc-700"
          />

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
            >
              Save Prompt Changes
            </button>
          </div>
        </div>

        {/* Piper TTS Voice Tuning Settings */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Volume2 className="w-4 h-4 text-purple-400" />
            <span>Piper TTS Voice Engine Parameters</span>
          </div>

          {/* Speech Rate Slider */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-300">
              <span>Speech Rate (Piper Speed):</span>
              <span className="font-mono text-zinc-400">{settings.piperSpeechRate}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.05"
              value={settings.piperSpeechRate}
              onChange={(e) => setSettings({ ...settings, piperSpeechRate: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* Pitch Slider */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-300">
              <span>Pitch Tuning:</span>
              <span className="font-mono text-zinc-400">{settings.piperPitch}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={settings.piperPitch}
              onChange={(e) => setSettings({ ...settings, piperPitch: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
            >
              Save Voice Settings
            </button>
          </div>
        </div>

        {/* Offline & Storage Actions */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <HardDrive className="w-4 h-4 text-sky-400" />
              <span>Storage & Backup Vault</span>
            </div>
            <button
              type="button"
              onClick={onOpenStorage}
              className="px-3 py-1 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
            >
              Open Storage Manager
            </button>
          </div>

          <p className="text-[11px] text-zinc-500">
            Export a full JSON archive of all tasks, activity logs, plans, and chat transcripts for offline backup.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full JSON Backup</span>
            </button>

            <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore from Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};
