export type TaskStatus = 'pending' | 'active' | 'completed' | 'skipped' | 'stuck';

export type FeedbackLevel = 'easy' | 'okay' | 'too_much';

export interface TaskStep {
  id: string;
  title: string;
  durationMinutes: number;
  status: TaskStatus;
  originalDuration?: number;
  originalTitle?: string;
}

export interface FocusSession {
  id: string;
  goalTitle: string;
  steps: TaskStep[];
  currentStepIndex: number;
  feedback: FeedbackLevel[];
  startedAt: string;
  completedAt?: string;
  summary?: string;
}

export interface UserProfile {
  preferredTaskDuration: number;
  totalSessions: number;
  totalStepsCompleted: number;
  commonPatterns: string[];
  recentFeedback: FeedbackLevel[];
}

export type Screen = 'home' | 'breakdown' | 'focus' | 'reflection';

export interface AppState {
  screen: Screen;
  goalInput: string;
  currentSession: FocusSession | null;
  profile: UserProfile;
  checkInMessage: string | null;
  aiTyping: boolean;
}
