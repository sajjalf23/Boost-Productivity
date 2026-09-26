import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  Filter,
  Flame,
  Award,
  Clock,
  Calendar,
  CheckCircle,
  Info,
} from 'lucide-react';
import { ActivityEntry, TaskCategory } from '../types';
import { StorageService } from '../services/storage';

export const HeatmapTab: React.FC = () => {
  const [history, setHistory] = useState<ActivityEntry[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'category' | 'task'>('all');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('University work');
  const [selectedTaskTitle, setSelectedTaskTitle] = useState<string>('');
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    minutes: number;
    entries: ActivityEntry[];
  } | null>(null);

  useEffect(() => {
    const data = StorageService.getHistory();
    setHistory(data);
    const firstTask = data[0]?.title || '';
    setSelectedTaskTitle(firstTask);
  }, []);

  const categories: TaskCategory[] = [
    'University work',
    'Programming',
    'Reading',
    'Exercise',
    'Personal',
    'Research',
  ];

  // Distinct task titles present in history
  const distinctTasks = useMemo(() => {
    return Array.from(new Set(history.map((h) => h.title.trim()))).filter(Boolean);
  }, [history]);

  // Filter history entries based on current selection
  const filteredHistory = useMemo(() => {
    if (filterType === 'category') {
      return history.filter((h) => h.category === selectedCategory);
    }
    if (filterType === 'task') {
      return history.filter((h) => h.title.trim().toLowerCase() === selectedTaskTitle.trim().toLowerCase());
    }
    return history;
  }, [history, filterType, selectedCategory, selectedTaskTitle]);

  // Map dates to entries
  const dateMap = useMemo(() => {
    const map = new Map<string, { totalMinutes: number; entries: ActivityEntry[] }>();
    for (const item of filteredHistory) {
      const existing = map.get(item.date) || { totalMinutes: 0, entries: [] };
      existing.totalMinutes += item.minutesSpent;
      existing.entries.push(item);
      map.set(item.date, existing);
    }
    return map;
  }, [filteredHistory]);

  // Generate grid for past 24 weeks (~168 days)
  const gridWeeks = useMemo(() => {
    const weeks: { dateStr: string; dayOfWeek: number; monthName: string }[][] = [];
    const today = new Date();
    
    // Total days to display: 24 weeks = 168 days
    const totalDays = 24 * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);

    let currentWeek: { dateStr: string; dayOfWeek: number; monthName: string }[] = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); // 0 is Sunday
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });

      currentWeek.push({ dateStr, dayOfWeek, monthName });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    return weeks;
  }, []);

  // Intensity color calculator
  const getCellColor = (minutes: number) => {
    if (!minutes || minutes === 0) return 'bg-zinc-900 border border-zinc-800/60';
    if (minutes <= 30) return 'bg-emerald-950 border border-emerald-800/80 text-emerald-300';
    if (minutes <= 60) return 'bg-emerald-800/90 border border-emerald-700 text-emerald-100';
    if (minutes <= 120) return 'bg-emerald-600 border border-emerald-500 text-white';
    return 'bg-emerald-400 border border-emerald-300 text-zinc-950';
  };

  // Streak & Total calculations
  const totalMinutes = useMemo(() => {
    return filteredHistory.reduce((sum, item) => sum + item.minutesSpent, 0);
  }, [filteredHistory]);

  const activeDaysCount = useMemo(() => {
    return dateMap.size;
  }, [dateMap]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const key = checkDate.toISOString().split('T')[0];
      if (dateMap.has(key) && (dateMap.get(key)?.totalMinutes || 0) > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today is empty, check if yesterday had activity before ending streak
        if (streak === 0 && checkDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayKey = checkDate.toISOString().split('T')[0];
          if (dateMap.has(yesterdayKey) && (dateMap.get(yesterdayKey)?.totalMinutes || 0) > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }
    return streak;
  }, [dateMap]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-white tracking-tight">Task Activity Heatmap</h2>
        <p className="text-xs text-zinc-400">
          Track consistency, streaks, and focus intensity for any specific task or category over time
        </p>
      </div>

      {/* Main Task / Category Selector Bar */}
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-zinc-300">View Heatmap For:</span>
          
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Activities
            </button>

            <button
              onClick={() => setFilterType('category')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterType === 'category'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              By Category
            </button>

            <button
              onClick={() => setFilterType('task')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterType === 'task'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Specific Task
            </button>
          </div>
        </div>

        {/* Category Dropdown/Pills */}
        {filterType === 'category' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            <span className="text-[11px] text-zinc-500 mr-1">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Task Selection Dropdown */}
        {filterType === 'task' && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-zinc-400">Select Task:</span>
            <select
              value={selectedTaskTitle}
              onChange={(e) => setSelectedTaskTitle(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-hidden max-w-sm"
            >
              {distinctTasks.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 uppercase font-medium">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Total Focused</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-white">
            {(totalMinutes / 60).toFixed(1)}h
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 uppercase font-medium">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Days</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
            {activeDaysCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 uppercase font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Current Streak</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-amber-400">
            {currentStreak} days
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 uppercase font-medium">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span>Sessions</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-purple-400">
            {filteredHistory.length}
          </div>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-zinc-200">
            {filterType === 'all'
              ? 'All Productive Output'
              : filterType === 'category'
              ? `Category: ${selectedCategory}`
              : `Task: ${selectedTaskTitle}`}
          </span>
          
          {/* Legend */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-xs bg-zinc-900 border border-zinc-800" />
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-950 border border-emerald-800" />
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-800" />
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
            <div className="w-2.5 h-2.5 rounded-xs bg-emerald-400" />
            <span>More</span>
          </div>
        </div>

        {/* Grid Scrollable Wrapper */}
        <div className="overflow-x-auto scrollbar-none pb-2">
          <div className="flex gap-1 min-w-[680px]">
            {gridWeeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day) => {
                  const dayData = dateMap.get(day.dateStr);
                  const mins = dayData?.totalMinutes || 0;
                  const isHovered = hoveredDay?.date === day.dateStr;

                  return (
                    <div
                      key={day.dateStr}
                      onMouseEnter={() =>
                        setHoveredDay({
                          date: day.dateStr,
                          minutes: mins,
                          entries: dayData?.entries || [],
                        })
                      }
                      onClick={() =>
                        setHoveredDay({
                          date: day.dateStr,
                          minutes: mins,
                          entries: dayData?.entries || [],
                        })
                      }
                      className={`w-3.5 h-3.5 rounded-xs transition-all cursor-pointer ${getCellColor(
                        mins
                      )} ${isHovered ? 'ring-2 ring-white scale-110 z-10' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Selected / Hovered Day Detail Card */}
        {hoveredDay ? (
          <div className="mt-3 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white font-mono">{hoveredDay.date}</span>
              <span className="font-mono text-emerald-400">
                {hoveredDay.minutes > 0 ? `${hoveredDay.minutes} minutes logged` : 'No activity logged'}
              </span>
            </div>

            {hoveredDay.entries.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-zinc-900">
                {hoveredDay.entries.map((e) => (
                  <div key={e.id} className="text-[11px] text-zinc-300">
                    <strong className="text-zinc-200">[{e.category}] {e.title}</strong> — {e.minutesSpent}m
                    <div className="text-zinc-500 font-sans text-[10px] pl-2 line-clamp-2">
                      {e.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Info className="w-3.5 h-3.5" />
            <span>Hover or tap any square on the grid to inspect details and logged accomplishments.</span>
          </div>
        )}
      </div>
    </div>
  );
};
