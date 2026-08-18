export type TaskStatus = 'pending' | 'active' | 'completed' | 'skipped' | 'stuck';

export type FeedbackLevel = 'easy' | 'okay' | 'too_much';

export type MoodLevel = 'drained' | 'low' | 'okay' | 'good' | 'great';

export type EnergyLevel = 'exhausted' | 'low' | 'medium' | 'high' | 'wired';

export interface MoodEntry {
  mood: MoodLevel;
  energy: EnergyLevel;
  timestamp: string;
}

export interface DistractionEntry {
  id: string;
  label: string;
  timestamp: string;
}

export interface TaskStep {
  id: string;
  title: string;
  durationMinutes: number;
  status: TaskStatus;
  originalDuration?: number;
  originalTitle?: string;
}

export interface StepGroup {
  label: string;
  emoji: string;
  steps: TaskStep[];
}

export interface FocusSession {
  id: string;
  goalTitle: string;
  steps: TaskStep[];
  groups: StepGroup[];
  currentStepIndex: number;
  feedback: FeedbackLevel[];
  startedAt: string;
  completedAt?: string;
  summary?: string;
  mood?: MoodEntry;
  distractions: DistractionEntry[];
}

export interface Goal {
  id: string;
  title: string;
  sessions: FocusSession[];
  createdAt: string;
  archived: boolean;
}

export interface UserProfile {
  preferredTaskDuration: number;
  totalSessions: number;
  totalStepsCompleted: number;
  commonPatterns: string[];
  recentFeedback: FeedbackLevel[];
  moodHistory: MoodEntry[];
}

export type Screen = 'home' | 'breakdown' | 'focus' | 'reflection' | 'dashboard' | 'mood' | 'auth';

export interface AppState {
  screen: Screen;
  goalInput: string;
  currentSession: FocusSession | null;
  profile: UserProfile;
  checkInMessage: string | null;
  aiTyping: boolean;
  goals: Goal[];
  distractionLog: DistractionEntry[];
}
