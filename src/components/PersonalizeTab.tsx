import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Sparkles,
  Check,
  Cpu,
  Clock,
  Zap,
  Target,
} from 'lucide-react';
import { PersonalProfile } from '../types';
import { StorageService } from '../services/storage';

interface PersonalizeTabProps {
  onDataChanged: () => void;
}

export const PersonalizeTab: React.FC<PersonalizeTabProps> = ({ onDataChanged }) => {
  const [profile, setProfile] = useState<PersonalProfile>(StorageService.getProfile());
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setProfile(StorageService.getProfile());
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: PersonalProfile = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveProfile(updated);
    setProfile(updated);
    onDataChanged();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const applyPreset = (preset: 'student' | 'builder' | 'researcher') => {
    if (preset === 'student') {
      setProfile((prev) => ({
        ...prev,
        bio: 'Computer Engineering student focusing on Digital Logic Design (DLD), Systems Architecture, and RAG.',
        visionAndGoals: `• Master sequential and combinational logic circuits in DLD class.
• Build end-to-end local offline RAG systems on edge devices.
• Maintain a 30-minute daily exercise habit for high cognitive stamina.
• Read 25 pages of engineering and systems literature daily.`,
        currentFocusAreas: `• DLD Class: Karnaugh maps, synchronous counters, state machines, timing diagrams.
• Local RAG Implementation: Vector quantization, chunking, and embedding retrieval.
• Health: Calisthenics and cardio.`,
        dailyRoutines: `• 08:00 - 11:30: High Focus (Peak logic design, hardware labs, hard code)
• 13:00 - 15:30: Medium Focus (Lectures, problem sets, team sync)
• 16:00 - 17:00: Physical Exercise
• 20:00 - 22:00: Calm Deep Reading & Planning`,
      }));
    } else if (preset === 'builder') {
      setProfile((prev) => ({
        ...prev,
        bio: 'Software engineer building edge AI tools, high-performance engines, and developer tooling.',
        visionAndGoals: `• Ship reliable offline-first local productivity and AI applications.
• Master memory-efficient data structures and low-level optimization.
• Protect 4 hours of uninterrupted deep work every single weekday.`,
        currentFocusAreas: `• Production runtime tuning and local neural weights optimization.
• Documentation and developer experience.`,
        dailyRoutines: `• 07:00 - 11:00: Deep Code Sprint (Zero notifications)
• 14:00 - 16:00: Bug triage, code reviews, and testing`,
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        bio: 'Academic researcher working on edge intelligence and cognitive productivity.',
        visionAndGoals: `• Publish high-impact research papers on quantized language models.
• Read 3 major literature papers weekly and write critical annotations.`,
        currentFocusAreas: `• Edge inference latency benchmarking and knowledge graph modeling.`,
        dailyRoutines: `• 09:00 - 12:00: Paper reading and mathematical analysis
• 14:00 - 17:00: Empirical experiments and benchmarks`,
      }));
    }
  };

  // Approximate token length
  const tokenEstimate = Math.round(
    (profile.visionAndGoals.length +
      profile.currentFocusAreas.length +
      profile.dailyRoutines.length +
      profile.preferencesAndConstraints.length) /
      4
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Personalization Context</h2>
          <p className="text-xs text-zinc-400">
            This personal document informs Gemma 3n E2B of your goals, routines, and constraints
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>Personal document saved and updated in Gemma 3n E2B local memory!</span>
        </div>
      )}

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-zinc-500 font-medium">Quick Presets:</span>
        <button
          onClick={() => applyPreset('student')}
          className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
        >
          Engineering Student (DLD & RAG)
        </button>
        <button
          onClick={() => applyPreset('builder')}
          className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
        >
          Deep Work Builder
        </button>
        <button
          onClick={() => applyPreset('researcher')}
          className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
        >
          Researcher
        </button>
      </div>

      {/* Token Context Indicator */}
      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span>Active Context Size: ~{tokenEstimate} tokens</span>
        </div>
        <span className="text-[11px] text-zinc-500">Injected into Gemma 3n reasoning prompts</span>
      </div>

      {/* Editable Document Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* Goals & Vision */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Vision & Long-Term Goals</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            What are your core objectives for this semester, year, or career?
          </p>
          <textarea
            rows={4}
            value={profile.visionAndGoals}
            onChange={(e) => setProfile({ ...profile, visionAndGoals: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-700 font-mono leading-relaxed"
          />
        </div>

        {/* Current Focus Areas */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Current Focus Areas & Coursework</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Specific classes, projects, or topics you are currently enrolled in (e.g. DLD Class, RAG).
          </p>
          <textarea
            rows={4}
            value={profile.currentFocusAreas}
            onChange={(e) => setProfile({ ...profile, currentFocusAreas: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-700 font-mono leading-relaxed"
          />
        </div>

        {/* Daily Routines & Peak Energy Times */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Daily Routines & Energy Waves</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            When is your focus highest? When do you prefer workouts, meetings, or downtime?
          </p>
          <textarea
            rows={4}
            value={profile.dailyRoutines}
            onChange={(e) => setProfile({ ...profile, dailyRoutines: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-700 font-mono leading-relaxed"
          />
        </div>

        {/* Preferences & Constraints */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>Working Preferences & Constraints</span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Pomodoro length, break duration, and preferred study styles.
          </p>
          <textarea
            rows={3}
            value={profile.preferencesAndConstraints}
            onChange={(e) => setProfile({ ...profile, preferencesAndConstraints: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden focus:border-zinc-700 font-mono leading-relaxed"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Personal Document</span>
          </button>
        </div>
      </form>
    </div>
  );
};
