/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { ChatTab } from './components/ChatTab';
import { TasksTab } from './components/TasksTab';
import { PlanningTab } from './components/PlanningTab';
import { HistoryTab } from './components/HistoryTab';
import { HeatmapTab } from './components/HeatmapTab';
import { PersonalizeTab } from './components/PersonalizeTab';
import { SettingsTab } from './components/SettingsTab';
import { StorageGateModal } from './components/StorageGateModal';
import { StorageManagerModal } from './components/StorageManagerModal';
import { StorageService } from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('chat');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showStorageGate, setShowStorageGate] = useState(false);
  const [showStorageManager, setShowStorageManager] = useState(false);
  const [storageTotalMB, setStorageTotalMB] = useState<number>(18.5);
  const [uncompletedCount, setUncompletedCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const refreshAppData = async () => {
    const tasks = StorageService.getTasks();
    const pending = tasks.filter((t) => !t.completed).length;
    setUncompletedCount(pending);

    const breakdown = await StorageService.getStorageBreakdown();
    setStorageTotalMB(breakdown.totalMB);
  };

  useEffect(() => {
    // Check if initial AI model download gate has been completed
    const modelsReady = StorageService.areModelsDownloaded();
    if (!modelsReady) {
      setShowStorageGate(true);
    }

    refreshAppData();

    // Online/Offline status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-950 selection:text-emerald-200">
      {/* Top Header with Menu Button */}
      <Header
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenStorage={() => setShowStorageManager(true)}
        storageTotalMB={storageTotalMB}
      />

      {/* Drawer Menu Navigation */}
      <Navigation
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        uncompletedTasksCount={uncompletedCount}
        onOpenStorage={() => setShowStorageManager(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-8">
        {activeTab === 'chat' && (
          <ChatTab
            onDataChanged={refreshAppData}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksTab
            onDataChanged={refreshAppData}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'planning' && (
          <PlanningTab onDataChanged={refreshAppData} />
        )}

        {activeTab === 'history' && (
          <HistoryTab onDataChanged={refreshAppData} />
        )}

        {activeTab === 'heatmap' && <HeatmapTab />}

        {activeTab === 'personalize' && (
          <PersonalizeTab onDataChanged={refreshAppData} />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            onOpenStorage={() => setShowStorageManager(true)}
            onDataChanged={refreshAppData}
          />
        )}
      </main>

      {/* Initial AI Component Download Gate Modal */}
      <StorageGateModal
        isOpen={showStorageGate}
        onConfirm={() => {
          setShowStorageGate(false);
          refreshAppData();
        }}
      />

      {/* Detailed Storage Manager Modal */}
      <StorageManagerModal
        isOpen={showStorageManager}
        onClose={() => setShowStorageManager(false)}
        onStorageChanged={refreshAppData}
        onRequestDownload={() => {
          setShowStorageGate(true);
        }}
      />

      {/* Offline Toast Notification when disconnected */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Offline Mode: Operating 100% locally with Gemma 3n E2B.</span>
        </div>
      )}
    </div>
  );
}
