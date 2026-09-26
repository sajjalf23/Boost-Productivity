export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskCategory = 
  | 'University work' 
  | 'Programming' 
  | 'Reading' 
  | 'Exercise' 
  | 'Personal' 
  | 'Research';

export interface TaskItem {
  id: string;
  title: string;
  description: string; // Detailed description / subcomponents
  subcomponents?: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  category: TaskCategory;
  priority: TaskPriority;
  estimatedMinutes: number;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: string;
  title: string;
  description: string; // Long description of exactly what was done
  minutesSpent: number;
  category: TaskCategory;
  taskId?: string; // Optional link to specific task
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
}

export interface PlanItem {
  id: string;
  title: string;
  type: 'deadline' | 'study_session' | 'project_milestone' | 'daily_plan' | 'long_term_goal';
  dueDate: string;
  status: 'planned' | 'in_progress' | 'completed';
  notes?: string;
  category?: TaskCategory;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  modelBadge?: 'Gemma 3n E2B' | 'Moonshine Tiny' | 'Piper TTS';
  actionTaken?: {
    type: 'task_updated' | 'activity_logged' | 'plan_created';
    summary: string;
  };
}

export interface PersonalProfile {
  name: string;
  bio: string;
  visionAndGoals: string;
  currentFocusAreas: string; // e.g. DLD Class, RAG implementation
  dailyRoutines: string; // peak energy, morning/night habits
  preferencesAndConstraints: string; // Pomodoro, break durations
  updatedAt: string;
}

export interface SystemSettings {
  systemPrompt: string;
  temperature: number;
  offlineMode: boolean;
  autoReadAloud: boolean;
  piperVoice: 'en_US-lessac-medium' | 'en_US-ryan-medium' | 'en_GB-alan-medium';
  piperSpeechRate: number;
  piperPitch: number;
  modelsDownloaded: boolean;
}

export interface StorageBreakdown {
  appSizeMB: number;
  gemmaSizeMB: number;
  moonshineSizeMB: number;
  piperSizeMB: number;
  chatSizeKB: number;
  documentsSizeKB: number;
  tasksSizeKB: number;
  historySizeKB: number;
  totalMB: number;
  deviceAvailableGB: number;
}
