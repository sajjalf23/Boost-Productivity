import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle,
  Plus,
  Trash2,
  Search,
  Filter,
  BarChart2,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ActivityEntry, TaskCategory } from '../types';
import { StorageService } from '../services/storage';

interface HistoryTabProps {
  onDataChanged: () => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ onDataChanged }) => {
  const [history, setHistory] = useState<ActivityEntry[]>([]);
  const [activeView, setActiveView] = useState<'today' | 'weekly' | 'all' | 'per_task'>('today');
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);

  // Manual entry form
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualMinutes, setManualMinutes] = useState(60);
  const [manualCategory, setManualCategory] = useState<TaskCategory>('University work');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);

  const loadHistory = () => {
    setHistory(StorageService.getHistory());
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Today metrics
  const todayEntries = history.filter((h) => h.date === todayStr);
  const totalMinutesToday = todayEntries.reduce((sum, item) => sum + item.minutesSpent, 0);
  const totalHoursToday = (totalMinutesToday / 60).toFixed(1);

  // Weekly calculations (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateKey = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayEntries = history.filter((h) => h.date === dateKey);
    const dayMinutes = dayEntries.reduce((acc, curr) => acc + curr.minutesSpent, 0);
    const dayHours = Number((dayMinutes / 60).toFixed(1));
    return { dateKey, dayName, dayMinutes, dayHours };
  });

  const maxWeeklyHours = Math.max(...last7Days.map((d) => d.dayHours), 3);

  // Distinct task titles for per-task view
  const distinctTasks = Array.from(new Set(history.map((h) => h.title.trim())));

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    StorageService.addActivity({
      title: manualTitle.trim(),
      description: manualDescription.trim(),
      minutesSpent: Number(manualMinutes) || 30,
      category: manualCategory,
      date: manualDate,
    });

    setManualTitle('');
    setManualDescription('');
    setIsAddingManual(false);
    loadHistory();
    onDataChanged();
  };

  const handleDeleteEntry = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    StorageService.saveHistory(updated);
    setHistory(updated);
    onDataChanged();
  };

  // Filtered entries depending on view
  let displayedEntries = history;
  if (activeView === 'today') {
    displayedEntries = todayEntries;
  } else if (activeView === 'per_task') {
    if (selectedTaskTitle !== 'all') {
      displayedEntries = history.filter((h) => h.title.trim() === selectedTaskTitle);
    }
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayedEntries = displayedEntries.filter(
      (h) => h.title.toLowerCase().includes(q) || h.description.toLowerCase().includes(q)
    );
  }

  // Selected task stats
  const selectedTaskMinutes = displayedEntries.reduce((acc, curr) => acc + curr.minutesSpent, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Daily Activity & History
          </h2>
          <p className="text-xs text-zinc-400">
            Records of what you completed, session durations, and detailed accomplishment logs
          </p>
        </div>

        <button
          onClick={() => setIsAddingManual(!isAddingManual)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors border border-zinc-700"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAddingManual ? 'Close' : 'Add Manual Entry'}</span>
        </button>
      </div>

      {/* Manual Entry Form */}
      {isAddingManual && (
        <form
          onSubmit={handleAddManual}
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 animate-fade-in text-xs"
        >
          <h3 className="font-semibold text-zinc-200">Log Completed Activity</h3>
          <div>
            <label className="block text-zinc-400 mb-1">Task Title</label>
            <input
              type="text"
              required
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="e.g., DLD Class - State Machine Lab"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">
              Detailed Description of what was completed (Can be long)
            </label>
            <textarea
              rows={3}
              required
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              placeholder="Wrote state tables, solved Karnaugh map expressions, and tested breadboard 7400 gates."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Minutes Spent</label>
              <input
                type="number"
                min="5"
                step="5"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Category</label>
              <select
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value as TaskCategory)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-hidden"
              >
                <option value="University work">University work</option>
                <option value="Programming">Programming</option>
                <option value="Reading">Reading</option>
                <option value="Exercise">Exercise</option>
                <option value="Personal">Personal</option>
                <option value="Research">Research</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Date</label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingManual(false)}
              className="px-3 py-1.5 text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              Save to History
            </button>
          </div>
        </form>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
            Today's Productive Time
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{totalHoursToday}</span>
            <span className="text-xs text-zinc-400">hours ({totalMinutesToday} mins)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
            Tasks Completed Today
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {todayEntries.length}
            </span>
            <span className="text-xs text-zinc-400">logged sessions</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
            Total All-Time Logged
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-sky-400">
              {(history.reduce((a, b) => a + b.minutesSpent, 0) / 60).toFixed(1)}
            </span>
            <span className="text-xs text-zinc-400">hours ({history.length} records)</span>
          </div>
        </div>
      </div>

      {/* View Switcher Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('today')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeView === 'today'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Today's Activity
          </button>

          <button
            onClick={() => setActiveView('weekly')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeView === 'weekly'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Weekly Breakdown
          </button>

          <button
            onClick={() => setActiveView('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeView === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Historical List
          </button>

          <button
            onClick={() => setActiveView('per_task')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeView === 'per_task'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Per-Task History
          </button>
        </div>
      </div>

      {/* Weekly View Bar Chart */}
      {activeView === 'weekly' && (
        <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-200">Past 7 Days Productive Hours</span>
            <span className="text-zinc-500 font-mono">Max: {maxWeeklyHours}h</span>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-6 items-end h-44 border-b border-zinc-800 pb-2">
            {last7Days.map((d) => {
              const heightPercent = Math.max(8, Math.round((d.dayHours / maxWeeklyHours) * 100));
              const isToday = d.dateKey === todayStr;
              return (
                <div key={d.dateKey} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-mono text-zinc-400">{d.dayHours}h</span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[32px] rounded-t-md transition-all ${
                      isToday
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-950'
                        : d.dayHours > 0
                        ? 'bg-zinc-700 hover:bg-zinc-600'
                        : 'bg-zinc-800/40'
                    }`}
                  />
                  <span className={`text-[10px] font-medium ${isToday ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-Task Filter Header */}
      {activeView === 'per_task' && (
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Select Task to Inspect:</span>
            <select
              value={selectedTaskTitle}
              onChange={(e) => setSelectedTaskTitle(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden"
            >
              <option value="all">All Tasks Combined</option>
              {distinctTasks.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="text-zinc-400">
            Total Time Spent:{' '}
            <strong className="text-white font-mono">
              {(selectedTaskMinutes / 60).toFixed(1)} hrs
            </strong>{' '}
            across {displayedEntries.length} sessions
          </div>
        </div>
      )}

      {/* Search Input for All or Per-Task */}
      {(activeView === 'all' || activeView === 'per_task' || activeView === 'today') && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity title or accomplishment details..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-zinc-700"
          />
        </div>
      )}

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {displayedEntries.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-zinc-500 text-xs">
            No activity records found for this view. Completed tasks and conversational updates appear here.
          </div>
        ) : (
          displayedEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-100 tracking-tight">
                      {entry.title}
                    </h4>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-1 text-zinc-600 hover:text-rose-400 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Clean unboxed metadata */}
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                    <span>{entry.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{entry.minutesSpent} mins</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{entry.date}</span>
                  </div>

                  {/* Long description of what exactly was done */}
                  <p className="mt-2.5 text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-line bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/50">
                    {entry.description}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
