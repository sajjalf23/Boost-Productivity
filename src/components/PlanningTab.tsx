import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Bookmark,
  Target,
  BookOpen,
  FolderGit2,
  Check,
} from 'lucide-react';
import { PlanItem, TaskCategory } from '../types';
import { StorageService } from '../services/storage';

interface PlanningTabProps {
  onDataChanged: () => void;
}

export const PlanningTab: React.FC<PlanningTabProps> = ({ onDataChanged }) => {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New plan state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<PlanItem['type']>('deadline');
  const [newDueDate, setNewDueDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [newNotes, setNewNotes] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('University work');

  const loadPlans = () => {
    setPlans(StorageService.getPlans());
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newPlan: PlanItem = {
      id: 'plan-' + Date.now(),
      title: newTitle.trim(),
      type: newType,
      dueDate: newDueDate,
      status: 'planned',
      notes: newNotes.trim(),
      category: newCategory,
    };

    const updated = [newPlan, ...plans];
    StorageService.savePlans(updated);
    setPlans(updated);
    onDataChanged();

    setNewTitle('');
    setNewNotes('');
    setIsAdding(false);
  };

  const handleToggleStatus = (id: string) => {
    const updated = plans.map((p) => {
      if (p.id === id) {
        const nextStatus: PlanItem['status'] =
          p.status === 'completed' ? 'planned' : p.status === 'planned' ? 'in_progress' : 'completed';
        return { ...p, status: nextStatus };
      }
      return p;
    });
    StorageService.savePlans(updated);
    setPlans(updated);
    onDataChanged();
  };

  const handleDelete = (id: string) => {
    const updated = plans.filter((p) => p.id !== id);
    StorageService.savePlans(updated);
    setPlans(updated);
    onDataChanged();
  };

  const filteredPlans = plans.filter((p) => {
    if (filterType === 'all') return true;
    return p.type === filterType;
  });

  const getTypeIcon = (type: PlanItem['type']) => {
    switch (type) {
      case 'deadline':
        return <Clock className="w-4 h-4 text-rose-400" />;
      case 'study_session':
        return <BookOpen className="w-4 h-4 text-sky-400" />;
      case 'project_milestone':
        return <FolderGit2 className="w-4 h-4 text-emerald-400" />;
      case 'daily_plan':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'long_term_goal':
        return <Target className="w-4 h-4 text-purple-400" />;
      default:
        return <Bookmark className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Planning & Milestones</h2>
          <p className="text-xs text-zinc-400">
            Deadlines, study blocks, and projects actively tracked and synchronized by Gemma 3n
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Cancel' : 'New Plan'}</span>
        </button>
      </div>

      {/* New Plan Form */}
      {isAdding && (
        <form
          onSubmit={handleCreatePlan}
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 animate-fade-in text-xs"
        >
          <h3 className="font-semibold text-zinc-200">Create Planned Item</h3>

          <div>
            <label className="block text-zinc-400 mb-1">Plan Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., DLD Lab 3 Submission & Demonstration"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Plan Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-hidden"
              >
                <option value="deadline">Deadline</option>
                <option value="study_session">Study Session</option>
                <option value="project_milestone">Project Milestone</option>
                <option value="daily_plan">Daily Plan</option>
                <option value="long_term_goal">Long-term Goal</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
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
              <label className="block text-zinc-400 mb-1">Target / Due Date</label>
              <input
                type="date"
                required
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Notes / Instructions</label>
            <textarea
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Key requirements, lab partner tasks, or milestone checkpoints..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              Save Plan
            </button>
          </div>
        </form>
      )}

      {/* Type Filter Controls */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs">
        {[
          { key: 'all', label: 'All Plans' },
          { key: 'deadline', label: 'Deadlines' },
          { key: 'study_session', label: 'Study Sessions' },
          { key: 'project_milestone', label: 'Milestones' },
          { key: 'daily_plan', label: 'Daily Plans' },
          { key: 'long_term_goal', label: 'Goals' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterType === tab.key
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plans List */}
      <div className="space-y-3">
        {filteredPlans.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-zinc-500 text-xs">
            No planned items for this filter.
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const isCompleted = plan.status === 'completed';
            return (
              <div
                key={plan.id}
                className={`p-4 rounded-xl border transition-colors ${
                  isCompleted
                    ? 'bg-zinc-950/60 border-zinc-900 opacity-60'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleStatus(plan.id)}
                      className="mt-0.5 text-zinc-500 hover:text-emerald-400 transition-colors"
                      title={`Status: ${plan.status}. Click to cycle.`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-600 flex items-center justify-center">
                          {plan.status === 'in_progress' && (
                            <div className="w-2 h-2 rounded-full bg-sky-400" />
                          )}
                        </div>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(plan.type)}
                        <h4
                          className={`text-sm font-semibold tracking-tight ${
                            isCompleted ? 'line-through text-zinc-500' : 'text-zinc-100'
                          }`}
                        >
                          {plan.title}
                        </h4>
                      </div>

                      {/* Unboxed metadata line */}
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                        <span className="capitalize">{plan.type.replace('_', ' ')}</span>
                        <span aria-hidden="true">·</span>
                        <span>{plan.category || 'General'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">Due: {plan.dueDate}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize text-zinc-300 font-medium">
                          {plan.status.replace('_', ' ')}
                        </span>
                      </div>

                      {plan.notes && (
                        <p className="mt-2 text-xs text-zinc-300 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/40">
                          {plan.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-1 text-zinc-600 hover:text-rose-400 transition-colors"
                    title="Delete plan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
