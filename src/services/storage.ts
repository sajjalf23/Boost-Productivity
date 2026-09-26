import {
  TaskItem,
  ActivityEntry,
  PlanItem,
  ChatMessage,
  PersonalProfile,
  SystemSettings,
  StorageBreakdown,
} from '../types';

const STORAGE_KEYS = {
  TASKS: 'boost_tasks_v1',
  HISTORY: 'boost_history_v1',
  PLANS: 'boost_plans_v1',
  CHATS: 'boost_chats_v1',
  PROFILE: 'boost_profile_v1',
  SETTINGS: 'boost_settings_v1',
  MODELS_DOWNLOADED: 'boost_models_downloaded_v1',
};

export const DEFAULT_SYSTEM_PROMPT = `You are Boost Productivity, an intelligent offline productivity assistant running locally via Gemma 3n E2B with Moonshine Tiny STT and Piper TTS.
Your role:
1. Act as a personalized productivity coach deeply attuned to the user's goals, available time, and current energy level.
2. When asked what to do given a time window (e.g. 30 minutes) and energy, provide precise, actionable, split-time recommendations based on active tasks and personal priorities.
3. When asked about a specific course/project (e.g. "DLD class" or "RAG"), break down the task description into distinct actionable subcomponents.
4. When the user tells you they finished specific subcomponents (e.g. "I completed Karnaugh maps and counter, lab report is left"), acknowledge the accomplishment, log what was done to history, and update the active task description with only what remains.
5. Record accomplishments to the user's daily activity history with estimated time spent.
6. If asked what components you are made of, explain clearly: Gemma 3n E2B (local LLM), Moonshine Tiny (on-device STT), Piper TTS (local speech synthesis), and 100% private on-device storage.
7. Tone: Minimalist, clear, encouraging, structured, anti-fluff.`;

const DEFAULT_PROFILE: PersonalProfile = {
  name: 'Student & Builder',
  bio: 'Computer Engineering student working on local systems, AI architectures, and coursework.',
  visionAndGoals: `• Master Digital Logic Design (DLD) and computer architecture fundamentals.
• Build and ship local offline-first RAG and agent applications.
• Maintain consistent physical health with daily calisthenics or cardio.
• Read 20 pages of deep technical/systems engineering literature daily.`,
  currentFocusAreas: `• DLD Class: Combinational & sequential circuits, Karnaugh maps, state machine lab, counter breadboarding.
• RAG Implementation: Local vector embeddings, chunking strategy, SQLite vector store, evaluation bench.
• Exercise: 30-minute daily bodyweight workouts and stretching.
• Deep Reading: Operating Systems & Computer Architecture textbooks.`,
  dailyRoutines: `• 08:00 - 11:30: High Energy (Peak deep work, coding, difficult problem sets)
• 13:00 - 15:00: Medium Energy (Lectures, code reviews, lab assignments)
• 16:00 - 17:30: Low/Medium Energy (Exercise, active recovery)
• 20:00 - 22:00: Calm Focus (Reading, planning tomorrow's tasks, light review)`,
  preferencesAndConstraints: `• Prefer 25-minute Pomodoro sprints for heavy coursework.
• When low energy, prefer short review sessions or organization over heavy new logic.
• Keep tasks cleanly decomposed into 15-30 minute subcomponents.`,
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: SystemSettings = {
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  temperature: 0.3,
  offlineMode: true,
  autoReadAloud: false,
  piperVoice: 'en_US-lessac-medium',
  piperSpeechRate: 1.0,
  piperPitch: 1.0,
  modelsDownloaded: false,
};

// Seed tasks reflecting the user's context (e.g., DLD Class and RAG implementation)
const SEED_TASKS: TaskItem[] = [
  {
    id: 'task-dld-01',
    title: 'DLD Class - Lab 3 & State Machines',
    description: `- Review 4-variable Karnaugh Maps minimization
- Breadboard 4-bit synchronous binary counter
- Write lab report introduction and truth tables
- Verify propagation delay & clock cycle timing`,
    subcomponents: [
      { id: 'sub-1', text: 'Review 4-variable Karnaugh Maps minimization', completed: false },
      { id: 'sub-2', text: 'Breadboard 4-bit synchronous binary counter', completed: false },
      { id: 'sub-3', text: 'Write lab report introduction and truth tables', completed: false },
      { id: 'sub-4', text: 'Verify propagation delay & clock cycle timing', completed: false },
    ],
    category: 'University work',
    priority: 'high',
    estimatedMinutes: 60,
    completed: false,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-rag-02',
    title: 'Local RAG Implementation Pipeline',
    description: `- Benchmark local embedding quantization (int8 vs fp16)
- Test semantic chunking on technical PDFs
- Connect retrieval context to Gemma 3n prompt pipeline`,
    subcomponents: [
      { id: 'sub-rag-1', text: 'Benchmark local embedding quantization', completed: false },
      { id: 'sub-rag-2', text: 'Test semantic chunking on technical PDFs', completed: false },
      { id: 'sub-rag-3', text: 'Connect retrieval context to Gemma 3n prompt pipeline', completed: false },
    ],
    category: 'Programming',
    priority: 'high',
    estimatedMinutes: 90,
    completed: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-exercise-03',
    title: 'Core & Mobility Session',
    description: `- 10m dynamic hip and hamstring mobility
- 4x15 push-ups & pull-up progressions
- 5m cool-down stretch`,
    subcomponents: [
      { id: 'sub-ex-1', text: '10m dynamic mobility', completed: false },
      { id: 'sub-ex-2', text: 'Push-up & pull-up sets', completed: false },
    ],
    category: 'Exercise',
    priority: 'medium',
    estimatedMinutes: 30,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-read-04',
    title: 'Read Digital Design Principles (Ch. 5)',
    description: `- Read Flip-Flops and Sequential Logic Design
- Take handwritten notes on Master-Slave D flip-flop`,
    subcomponents: [
      { id: 'sub-rd-1', text: 'Read Flip-Flops and Sequential Logic Design', completed: false },
      { id: 'sub-rd-2', text: 'Take handwritten notes on Master-Slave D flip-flop', completed: false },
    ],
    category: 'Reading',
    priority: 'medium',
    estimatedMinutes: 40,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to generate past dates for realistic heatmaps
const getDaysAgoDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const SEED_HISTORY: ActivityEntry[] = [
  {
    id: 'hist-today-1',
    title: 'RAG Implementation & Testing',
    description: 'Completed local vector index setup, benchmarked retrieval with 50 test technical queries, and tuned prompt compression.',
    minutesSpent: 120,
    category: 'Programming',
    date: getDaysAgoDate(0),
    timestamp: new Date().toISOString(),
  },
  {
    id: 'hist-today-2',
    title: 'DLD Class - Logic Gate Simulation',
    description: 'Simulated 7400 series NAND gate propagation in circuit simulator and verified Boolean truth tables for Assignment 2.',
    minutesSpent: 60,
    category: 'University work',
    date: getDaysAgoDate(0),
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'hist-yesterday-1',
    title: 'University work - DLD Class',
    description: 'Worked on Karnaugh maps simplification for 3-input decoder assignment.',
    minutesSpent: 75,
    category: 'University work',
    date: getDaysAgoDate(1),
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'hist-yesterday-2',
    title: 'Cardio & Strength Training',
    description: '30-minute interval workout and post-study mobility.',
    minutesSpent: 30,
    category: 'Exercise',
    date: getDaysAgoDate(1),
    timestamp: new Date(Date.now() - 86400000 + 7200000).toISOString(),
  },
  {
    id: 'hist-d2-1',
    title: 'Reading Computer Systems',
    description: 'Read Chapter 3 on Machine-Level Representation of Programs (25 pages).',
    minutesSpent: 45,
    category: 'Reading',
    date: getDaysAgoDate(2),
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'hist-d3-1',
    title: 'RAG Implementation Architecture',
    description: 'Drafted architecture diagram for offline SQLite-vec embedding retrieval.',
    minutesSpent: 90,
    category: 'Programming',
    date: getDaysAgoDate(3),
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'hist-d4-1',
    title: 'DLD Class - Boolean Algebra',
    description: 'De Morgan law proofs and two-level logic minimization problems.',
    minutesSpent: 60,
    category: 'University work',
    date: getDaysAgoDate(4),
    timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'hist-d5-1',
    title: 'Programming - Python Vector Math',
    description: 'Implemented cosine similarity and dot product tests in pure NumPy.',
    minutesSpent: 45,
    category: 'Programming',
    date: getDaysAgoDate(5),
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'hist-d6-1',
    title: 'Exercise - 5k Jog',
    description: 'Outdoor morning run for endurance and cognitive focus.',
    minutesSpent: 35,
    category: 'Exercise',
    date: getDaysAgoDate(6),
    timestamp: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'hist-d8-1',
    title: 'DLD Class - Binary Arithmetic',
    description: 'Full adder design and 2s complement overflow detection.',
    minutesSpent: 80,
    category: 'University work',
    date: getDaysAgoDate(8),
    timestamp: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'hist-d10-1',
    title: 'Reading - Deep Work',
    description: 'Read Part 1: The Idea. Notes on attention residue and shallow vs deep work.',
    minutesSpent: 40,
    category: 'Reading',
    date: getDaysAgoDate(10),
    timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'hist-d12-1',
    title: 'RAG Implementation Data Prep',
    description: 'Wrote tokenizers and sentence segmenters for local context window.',
    minutesSpent: 110,
    category: 'Programming',
    date: getDaysAgoDate(12),
    timestamp: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'hist-d14-1',
    title: 'DLD Class - Logic Gate Fundamentals',
    description: 'Studied TTL vs CMOS voltage levels and noise margins.',
    minutesSpent: 50,
    category: 'University work',
    date: getDaysAgoDate(14),
    timestamp: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
];

const SEED_PLANS: PlanItem[] = [
  {
    id: 'plan-01',
    title: 'DLD Lab 3 Submission & Demonstration',
    type: 'deadline',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    status: 'in_progress',
    notes: 'Must demonstrate hardware counter on breadboard to TA with oscilloscope verification.',
    category: 'University work',
  },
  {
    id: 'plan-02',
    title: 'RAG Offline Prototype Milestone 1',
    type: 'project_milestone',
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    status: 'in_progress',
    notes: 'Verify 0-network end-to-end question answering with sub-second retrieval latency.',
    category: 'Programming',
  },
  {
    id: 'plan-03',
    title: 'Weekend 3-Hour Deep Work Study Session',
    type: 'study_session',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    status: 'planned',
    notes: 'Focus purely on sequential logic state graphs and Mealy/Moore models.',
    category: 'University work',
  },
  {
    id: 'plan-04',
    title: 'Daily Goal: 3.5+ Productive Hours without Distraction',
    type: 'daily_plan',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'planned',
    notes: 'Split across DLD Lab, RAG code, and 30m exercise.',
    category: 'Personal',
  },
];

const INITIAL_CHATS: ChatMessage[] = [
  {
    id: 'msg-welcome-01',
    sender: 'assistant',
    text: `Hello! I am Boost Productivity, your personalized, 100% offline assistant.

I run locally on your device powered by:
• **Gemma 3n E2B** — on-device reasoning and task orchestration
• **Moonshine Tiny** — real-time local speech-to-text
• **Piper TTS** — natural on-device voice synthesis
• **Zero-Cloud Storage** — your documents, tasks, and history never leave this device.

I'm here to understand your goals, available time, and energy levels. I can help you decide what to do right now, decompose complex coursework like your DLD class, log what you've accomplished, track your task heatmaps, and plan your days.

What are you tackling today, or how much time and energy do you have right now?`,
    timestamp: new Date().toISOString(),
    modelBadge: 'Gemma 3n E2B',
  },
];

export class StorageService {
  static getTasks(): TaskItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      this.saveTasks(SEED_TASKS);
      return SEED_TASKS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_TASKS;
    }
  }

  static saveTasks(tasks: TaskItem[]): void {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  static getHistory(): ActivityEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) {
      this.saveHistory(SEED_HISTORY);
      return SEED_HISTORY;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_HISTORY;
    }
  }

  static saveHistory(history: ActivityEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  static addActivity(entry: Omit<ActivityEntry, 'id' | 'timestamp'>): ActivityEntry {
    const history = this.getHistory();
    const newEntry: ActivityEntry = {
      ...entry,
      id: 'hist-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...history];
    this.saveHistory(updated);
    return newEntry;
  }

  static getPlans(): PlanItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PLANS);
    if (!raw) {
      this.savePlans(SEED_PLANS);
      return SEED_PLANS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_PLANS;
    }
  }

  static savePlans(plans: PlanItem[]): void {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  }

  static getChats(): ChatMessage[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHATS);
    if (!raw) {
      this.saveChats(INITIAL_CHATS);
      return INITIAL_CHATS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CHATS;
    }
  }

  static saveChats(chats: ChatMessage[]): void {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  }

  static getProfile(): PersonalProfile {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      this.saveProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  static saveProfile(profile: PersonalProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  static getSettings(): SystemSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      this.saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: SystemSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static areModelsDownloaded(): boolean {
    const flag = localStorage.getItem(STORAGE_KEYS.MODELS_DOWNLOADED);
    return flag === 'true';
  }

  static setModelsDownloaded(downloaded: boolean): void {
    localStorage.setItem(STORAGE_KEYS.MODELS_DOWNLOADED, downloaded ? 'true' : 'false');
    const settings = this.getSettings();
    settings.modelsDownloaded = downloaded;
    this.saveSettings(settings);
  }

  static async getStorageBreakdown(): Promise<StorageBreakdown> {
    let deviceAvailableGB = 22.4; // standard fallback
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        if (est.quota) {
          const used = est.usage || 0;
          deviceAvailableGB = Number(((est.quota - used) / (1024 * 1024 * 1024)).toFixed(1));
        }
      } catch {
        // use fallback
      }
    }

    const chatsRaw = localStorage.getItem(STORAGE_KEYS.CHATS) || '';
    const docsRaw = localStorage.getItem(STORAGE_KEYS.PROFILE) || '';
    const tasksRaw = localStorage.getItem(STORAGE_KEYS.TASKS) || '';
    const histRaw = localStorage.getItem(STORAGE_KEYS.HISTORY) || '';

    const chatSizeKB = Math.max(12, Number((new Blob([chatsRaw]).size / 1024).toFixed(1)));
    const documentsSizeKB = Math.max(8, Number((new Blob([docsRaw]).size / 1024).toFixed(1)));
    const tasksSizeKB = Math.max(6, Number((new Blob([tasksRaw]).size / 1024).toFixed(1)));
    const historySizeKB = Math.max(14, Number((new Blob([histRaw]).size / 1024).toFixed(1)));

    const modelsReady = this.areModelsDownloaded();
    const gemmaSizeMB = modelsReady ? 1536.0 : 0;
    const moonshineSizeMB = modelsReady ? 45.0 : 0;
    const piperSizeMB = modelsReady ? 65.0 : 0;
    const appSizeMB = 18.5;

    const dataMB = (chatSizeKB + documentsSizeKB + tasksSizeKB + historySizeKB) / 1024;
    const totalMB = Number((appSizeMB + gemmaSizeMB + moonshineSizeMB + piperSizeMB + dataMB).toFixed(1));

    return {
      appSizeMB,
      gemmaSizeMB,
      moonshineSizeMB,
      piperSizeMB,
      chatSizeKB,
      documentsSizeKB,
      tasksSizeKB,
      historySizeKB,
      totalMB,
      deviceAvailableGB,
    };
  }

  static clearChatHistory(): void {
    this.saveChats(INITIAL_CHATS);
  }

  static clearActivityHistory(): void {
    this.saveHistory([]);
  }

  static resetDocuments(): void {
    this.saveProfile(DEFAULT_PROFILE);
  }

  static deleteModelsCache(): void {
    this.setModelsDownloaded(false);
  }

  static exportAllData(): string {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      tasks: this.getTasks(),
      history: this.getHistory(),
      plans: this.getPlans(),
      chats: this.getChats(),
      profile: this.getProfile(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  static importAllData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.history) this.saveHistory(data.history);
      if (data.plans) this.savePlans(data.plans);
      if (data.chats) this.saveChats(data.chats);
      if (data.profile) this.saveProfile(data.profile);
      if (data.settings) this.saveSettings(data.settings);
      return true;
    } catch {
      return false;
    }
  }
}
