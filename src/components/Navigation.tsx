import React, { useEffect } from 'react';
import {
  MessageSquare,
  CheckSquare,
  Calendar,
  History,
  Grid,
  FileText,
  Settings,
  X,
  HardDrive,
} from 'lucide-react';

export type TabKey =
  | 'chat'
  | 'tasks'
  | 'planning'
  | 'history'
  | 'heatmap'
  | 'personalize'
  | 'settings';

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  uncompletedTasksCount: number;
  onOpenStorage?: () => void;
}

interface TabItem {
  key: TabKey;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  uncompletedTasksCount,
  onOpenStorage,
}) => {
  const tabs: TabItem[] = [
    {
      key: 'chat',
      label: 'Chat',
      description: 'Conversational assistant, task advice & audio',
      icon: MessageSquare,
    },
    {
      key: 'tasks',
      label: 'Tasks',
      description: 'Decomposed to-do items, editable details & subcomponents',
      icon: CheckSquare,
      badge: uncompletedTasksCount,
    },
    {
      key: 'planning',
      label: 'Planning',
      description: 'Deadlines, study sessions, milestones & goals',
      icon: Calendar,
    },
    {
      key: 'history',
      label: 'Activity',
      description: 'Accomplishment timeline, hours logged & per-task history',
      icon: History,
    },
    {
      key: 'heatmap',
      label: 'Heatmap',
      description: 'Consistency grid, streaks & task focus intensity',
      icon: Grid,
    },
    {
      key: 'personalize',
      label: 'Personalize',
      description: 'Personal goals, routines & Gemma 3n context document',
      icon: FileText,
    },
    {
      key: 'settings',
      label: 'Settings',
      description: 'Gemma 3n system prompt, Piper speech rate & backup',
      icon: Settings,
    },
  ];

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Slide-over Drawer / Menu */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 sm:w-80 bg-zinc-950 border-r border-zinc-800 p-4 flex flex-col shadow-2xl transition-transform duration-250 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-emerald-400 font-bold text-sm tracking-tight">
              BP
            </div>
            <div>
              <div className="text-sm font-semibold text-white tracking-tight">Menu</div>
              <div className="text-[11px] text-zinc-400">Boost Productivity</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Items List */}
        <nav className="flex-1 overflow-y-auto space-y-1 pr-1 py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  onTabChange(tab.key);
                  onClose();
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                  isActive
                    ? 'bg-zinc-900 border border-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 border border-transparent'
                }`}
              >
                <div
                  className={`mt-0.5 p-1.5 rounded-lg ${
                    isActive
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-zinc-200'}`}>
                      {tab.label}
                    </span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-800 text-emerald-400 border border-zinc-700">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        {onOpenStorage && (
          <div className="pt-3 border-t border-zinc-800/80 mt-2">
            <button
              onClick={() => {
                onClose();
                onOpenStorage();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Storage & Models</span>
              </div>
              <span className="text-[11px] text-zinc-500">Manage</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
