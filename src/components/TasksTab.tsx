import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit3,
  Search,
  Check,
  Split,
  ChevronDown,
  ChevronUp,
  X,
  Save,
} from 'lucide-react';
import { TaskItem, TaskCategory, TaskPriority } from '../types';
import { StorageService } from '../services/storage';

interface TasksTabProps {
  onDataChanged: () => void;
  onNavigateToTab?: (tab: any) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({ onDataChanged, onNavigateToTab }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('University work');
  const [newPriority, setNewPriority] = useState<TaskPriority>('high');
  const [newMinutes, setNewMinutes] = useState<number>(45);

  // Editing task state
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<TaskCategory>('University work');
  const [editPriority, setEditPriority] = useState<TaskPriority>('high');
  const [editMinutes, setEditMinutes] = useState<number>(45);

  // Feedback message
  const [notice, setNotice] = useState<string | null>(null);

  const loadTasks = () => {
    setTasks(StorageService.getTasks());
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Split multi-line description into subcomponents
    const subcomponents = newDescription
      .split('\n')
      .map((line) => line.trim().replace(/^[-*•\d\.]+\s*/, ''))
      .filter(Boolean)
      .map((text, idx) => ({
        id: 'sub-' + Date.now() + '-' + idx,
        text,
        completed: false,
      }));

    const newTask: TaskItem = {
      id: 'task-' + Date.now(),
      title: newTitle.trim(),
      description: newDescription.trim(),
      subcomponents,
      category: newCategory,
      priority: newPriority,
      estimatedMinutes: Number(newMinutes) || 30,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    StorageService.saveTasks(updated);
    setTasks(updated);
    onDataChanged();

    // Reset
    setNewTitle('');
    setNewDescription('');
    setIsAdding(false);
    showNotice(`Created task "${newTask.title}"`);
  };

  // Open Edit Modal for a task
  const handleStartEdit = (task: TaskItem) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditCategory(task.category);
    setEditPriority(task.priority);
    setEditMinutes(task.estimatedMinutes);
  };

  // Save Task Edits
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    // Recompute subcomponents from edited description
    const lines = editDescription
      .split('\n')
      .map((line) => line.trim().replace(/^[-*•\d\.]+\s*/, ''))
      .filter(Boolean);

    const subcomponents = lines.map((text, idx) => {
      // Preserve existing completion state if matching
      const existing = (editingTask.subcomponents || []).find(
        (s) => s.text.toLowerCase() === text.toLowerCase()
      );
      return {
        id: existing?.id || 'sub-' + Date.now() + '-' + idx,
        text,
        completed: existing?.completed || false,
      };
    });

    const updatedTasks = tasks.map((t) => {
      if (t.id === editingTask.id) {
        return {
          ...t,
          title: editTitle.trim(),
          description: editDescription.trim(),
          category: editCategory,
          priority: editPriority,
          estimatedMinutes: Number(editMinutes) || 30,
          subcomponents,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    StorageService.saveTasks(updatedTasks);
    setTasks(updatedTasks);
    onDataChanged();
    setEditingTask(null);
    showNotice(`Updated "${editTitle.trim()}" successfully!`);
  };

  const handleToggleTaskCompleted = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextState = !t.completed;
        if (nextState) {
          // If marking entire task complete, log to daily history!
          StorageService.addActivity({
            title: t.title,
            description: `Full completion: ${t.description.split('\n').join(', ')}`,
            minutesSpent: t.estimatedMinutes,
            category: t.category,
            taskId: t.id,
            date: new Date().toISOString().split('T')[0],
          });
          showNotice(`Completed and logged ${t.estimatedMinutes}m to Daily Activity!`);
        }
        return { ...t, completed: nextState, updatedAt: new Date().toISOString() };
      }
      return t;
    });

    StorageService.saveTasks(updated);
    setTasks(updated);
    onDataChanged();
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    StorageService.saveTasks(updated);
    setTasks(updated);
    onDataChanged();
    showNotice('Task deleted.');
  };

  // Subcomponent individual check / uncheck
  const handleToggleSubcomponent = (taskId: string, subId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const subList = (t.subcomponents || []).map((s) =>
          s.id === subId ? { ...s, completed: !s.completed } : s
        );
        return { ...t, subcomponents: subList, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    StorageService.saveTasks(updated);
    setTasks(updated);
    onDataChanged();
  };

  // Convert checked subcomponents into a completed Daily History entry
  // and update task description with only what remains
  const handleLogCompletedSubcomponents = (task: TaskItem) => {
    const checked = (task.subcomponents || []).filter((s) => s.completed);
    const remaining = (task.subcomponents || []).filter((s) => !s.completed);

    if (checked.length === 0) {
      showNotice('Check off at least one subcomponent first.');
      return;
    }

    const completedText = checked.map((c) => c.text).join('; ');
    const estMinutes = Math.max(
      15,
      Math.round((checked.length / (task.subcomponents?.length || 1)) * task.estimatedMinutes)
    );

    // 1. Add to Daily Activity History
    StorageService.addActivity({
      title: task.title,
      description: `Completed: ${completedText}`,
      minutesSpent: estMinutes,
      category: task.category,
      taskId: task.id,
      date: new Date().toISOString().split('T')[0],
    });

    // 2. Update task with remaining items
    const remainingDescription = remaining.map((r) => `- ${r.text}`).join('\n');
    const updatedTasks = tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          description: remainingDescription || 'All planned subcomponents completed',
          subcomponents: remaining,
          estimatedMinutes: Math.max(15, t.estimatedMinutes - estMinutes),
          completed: remaining.length === 0,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    StorageService.saveTasks(updatedTasks);
    setTasks(updatedTasks);
    onDataChanged();
    showNotice(`Logged ${estMinutes}m to Daily Activity! Remaining subcomponents updated.`);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories: TaskCategory[] = [
    'University work',
    'Programming',
    'Reading',
    'Exercise',
    'Personal',
    'Research',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">To-Do Tasks</h2>
          <p className="text-xs text-zinc-400">
            Decomposed subcomponents accessible to Gemma 3n for reasoning and planning
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Cancel' : 'New Task'}</span>
        </button>
      </div>

      {notice && (
        <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* New Task Inline Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateTask}
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-md animate-fade-in"
        >
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
            Create Decomposed Task
          </h3>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., DLD Class - Lab 4 Sequential Logic"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-700"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] text-zinc-400">
                Detailed Description & Subcomponents (Line-by-line)
              </label>
              <span className="text-[10px] text-zinc-500">
                Gemma 3n reads each line as a subtask
              </span>
            </div>
            <textarea
              rows={4}
              required
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="- Build State Transition Diagram for 3-bit pattern detector&#10;- Calculate Flip-Flop excitation equations&#10;- Wire circuit on breadboard and verify clock timing&#10;- Write conclusion in lab notebook"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-700 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Est. Minutes</label>
              <input
                type="number"
                min="5"
                step="5"
                value={newMinutes}
                onChange={(e) => setNewMinutes(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Edit Task Modal / Popover */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100 flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Edit Task Info</h3>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Task Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-zinc-700"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-zinc-400 font-medium">
                    Task Description & Subcomponents (Line-by-line)
                  </label>
                  <span className="text-[10px] text-zinc-500">Each line is a subtask</span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-xs font-mono leading-relaxed focus:outline-hidden focus:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as TaskCategory)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Est. Minutes</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={editMinutes}
                    onChange={(e) => setEditMinutes(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3.5 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Task Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks or subcomponents..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-zinc-700"
          />
        </div>

        {/* Category Filter Controls */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-zinc-500 text-xs">
            No tasks found. Click "New Task" or ask Gemma in Chat to create one.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const subList = task.subcomponents || [];
            const completedCount = subList.filter((s) => s.completed).length;

            return (
              <div
                key={task.id}
                className={`rounded-xl border transition-colors ${
                  task.completed
                    ? 'bg-zinc-950/60 border-zinc-900 opacity-60'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700/80'
                }`}
              >
                {/* Main Task Header */}
                <div className="p-4 flex items-start gap-3">
                  <button
                    onClick={() => handleToggleTaskCompleted(task.id)}
                    className="mt-0.5 text-zinc-500 hover:text-emerald-400 transition-colors"
                    title={task.completed ? 'Mark incomplete' : 'Mark task completed'}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-sm font-semibold tracking-tight ${
                          task.completed ? 'line-through text-zinc-500' : 'text-zinc-100'
                        }`}
                      >
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-1.5">
                        {/* Edit task button */}
                        <button
                          onClick={() => handleStartEdit(task)}
                          className="p-1 text-zinc-400 hover:text-emerald-400 transition-colors"
                          title="Edit task title, description and parameters"
                          aria-label="Edit task"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                          className="p-1 text-zinc-400 hover:text-white"
                          title="Toggle subcomponents"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Unboxed Metadata Line with typographic separators */}
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                      <span>{task.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{task.priority} Priority</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{task.estimatedMinutes} mins</span>
                      {subList.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">
                            {completedCount}/{subList.length} subtasks
                          </span>
                        </>
                      )}
                    </div>

                    {/* Description preview */}
                    <div className="mt-2 text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
                      {task.description}
                    </div>

                    {/* Subcomponent Interactive Decomposition View */}
                    {subList.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium mb-1">
                          <span>Subcomponents Checklist:</span>
                          {completedCount > 0 && (
                            <button
                              type="button"
                              onClick={() => handleLogCompletedSubcomponents(task)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                              title="Moves completed items into History and updates remaining task description"
                            >
                              <Split className="w-3 h-3" />
                              <span>Log {completedCount} Done to History</span>
                            </button>
                          )}
                        </div>

                        {subList.map((sub) => (
                          <div
                            key={sub.id}
                            onClick={() => handleToggleSubcomponent(task.id, sub.id)}
                            className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                              sub.completed
                                ? 'bg-zinc-950 text-zinc-500 line-through'
                                : 'bg-zinc-950/50 hover:bg-zinc-800/60 text-zinc-300'
                            }`}
                          >
                            <div className="mt-0.5">
                              {sub.completed ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-sm border border-zinc-600" />
                              )}
                            </div>
                            <span className="flex-1">{sub.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
