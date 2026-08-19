// ─── Core Status Types ─────────────────────────────────────────────
export type TaskStatus = 'pending' | 'active' | 'completed' | 'skipped' | 'stuck';
export type FeedbackLevel = 'easy' | 'okay' | 'too_much';

// ─── Legacy Mood (kept for backward compat) ───────────────────────
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

// ─── Task Steps (Work Tasks tree) ─────────────────────────────────
export interface TaskStep {
  id: string;
  title: string;
  durationMinutes: number;
  status: TaskStatus;
  originalDuration?: number;
  originalTitle?: string;
  microStep?: string;
  notes?: string;
  effortRange?: string;
}

export interface StepGroup {
  label: string;
  emoji: string;
  steps: TaskStep[];
}

// ─── Focus Session ────────────────────────────────────────────────
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

// ─── Goal (legacy, kept for migration) ────────────────────────────
export interface Goal {
  id: string;
  title: string;
  sessions: FocusSession[];
  createdAt: string;
  archived: boolean;
}

// ─── User Profile ─────────────────────────────────────────────────
export interface UserProfile {
  preferredTaskDuration: number;
  totalSessions: number;
  totalStepsCompleted: number;
  commonPatterns: string[];
  recentFeedback: FeedbackLevel[];
  moodHistory: MoodEntry[];
}

// ─── Personalization ──────────────────────────────────────────────
export type AnimationIntensity = 'still' | 'soft' | 'balanced' | 'energizing';
export type ColorTheme = 'mist' | 'sage' | 'lavender' | 'sky' | 'sand' | 'rose';
export type InterfaceDensity = 'minimal' | 'comfortable' | 'detailed';
export type GuidanceStyle = 'next_step' | 'brief' | 'detailed';
export type CelebrationLevel = 'off' | 'subtle' | 'full';
export type SoundHaptics = 'off' | 'on';
export type ReducedMotionPref = 'follow_system' | 'always_on' | 'always_off';
export type AIAdaptation = 'off' | 'suggestions_only' | 'auto_adapt';
export type WorkRhythm = 'short_sprints' | 'moderate' | 'long_sessions' | 'flexible';
export type EncouragementStyle = 'encouragement' | 'neutral' | 'direct';

export interface UserPreferences {
  animationIntensity: AnimationIntensity;
  colorTheme: ColorTheme;
  density: InterfaceDensity;
  guidanceStyle: GuidanceStyle;
  celebrationEffects: CelebrationLevel;
  soundHaptics: SoundHaptics;
  reducedMotion: ReducedMotionPref;
  aiAdaptation: AIAdaptation;
  workRhythm: WorkRhythm;
  encouragementStyle: EncouragementStyle;
  dailyCheckInEnabled: boolean;
}

export const defaultPreferences: UserPreferences = {
  animationIntensity: 'soft',
  colorTheme: 'sage',
  density: 'comfortable',
  guidanceStyle: 'brief',
  celebrationEffects: 'subtle',
  soundHaptics: 'off',
  reducedMotion: 'follow_system',
  aiAdaptation: 'suggestions_only',
  workRhythm: 'flexible',
  encouragementStyle: 'neutral',
  dailyCheckInEnabled: true,
};

// ─── Daily Check-In ───────────────────────────────────────────────
export type ArrivalState =
  | 'calm_and_ready'
  | 'focused_low_energy'
  | 'restless'
  | 'overwhelmed'
  | 'unclear_mixed'
  | 'tired_gentle'
  | 'not_sure'
  | 'prefer_not_to_say';

export type SupportPreference =
  | 'choose_next_step'
  | 'break_down_task'
  | 'realistic_plan'
  | 'quiet_minimal'
  | 'encouragement'
  | 'no_guidance'
  | 'record_feeling';

export interface DailyCheckIn {
  id: string;
  userId: string;
  date: string;
  arrivalState: ArrivalState;
  supportPreference: SupportPreference;
  contextNote?: string;
  createdAt: string;
}

// ─── Work Task (persistent) ──────────────────────────────────────
export interface WorkTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  scheduledFor?: string;
  parentId?: string;
  sourceMilestoneId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Task Step (persistent, tree breakdown) ──────────────────────
export interface PersistedTaskStep {
  id: string;
  taskId: string;
  parentStepId?: string;
  title: string;
  instructions?: string;
  status: TaskStatus;
  position: number;
  effortRange?: string;
  durationMinutes?: number;
  microStep?: string;
  notes?: string;
}

// ─── Planning Mode ────────────────────────────────────────────────
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'paused';

export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapNode {
  id: string;
  projectId: string;
  title: string;
  outcome?: string;
  whyItMatters?: string;
  instructions?: string;
  checklist?: string[];
  position: number;
  status: MilestoneStatus;
  dependencies?: string[];
  suggestedTimeframe?: string;
  definitionOfDone?: string;
  potentialObstacles?: string;
  fallbackPath?: string;
  nextMilestoneId?: string;
  createdAt: string;
}

// ─── Focus Session (persistent) ──────────────────────────────────
export interface PersistedFocusSession {
  id: string;
  userId: string;
  taskId?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  status: 'active' | 'completed' | 'interrupted';
}

// ─── Daily Reflection ────────────────────────────────────────────
export interface DailyReflection {
  id: string;
  userId: string;
  date: string;
  completedSummary?: string;
  difficultyNote?: string;
  tomorrowNote?: string;
  createdAt: string;
}

// ─── AI Interaction Log ──────────────────────────────────────────
export interface AIInteraction {
  id: string;
  userId: string;
  contextType: string;
  requestSummary: string;
  responseSummary: string;
  createdAt: string;
}

// ─── Activity Tracking (Consent-Based) ───────────────────────────
export type ActivityConsentCategory =
  | 'interactionHistory'
  | 'aiPersonalization'
  | 'dailyCheckInContext'
  | 'conversationMemory'
  | 'technicalDiagnostics'
  | 'control';

export type ActivityEventName =
  | 'screen_viewed'
  | 'navigation_changed'
  | 'button_pressed'
  | 'task_created'
  | 'task_updated'
  | 'task_started'
  | 'task_completed'
  | 'task_postponed'
  | 'task_archived'
  | 'task_breakdown_generated'
  | 'task_step_accepted'
  | 'task_step_dismissed'
  | 'task_step_simplified'
  | 'task_marked_stuck'
  | 'roadmap_created'
  | 'roadmap_node_opened'
  | 'roadmap_node_converted_to_task'
  | 'focus_session_started'
  | 'focus_session_paused'
  | 'focus_session_resumed'
  | 'focus_session_completed'
  | 'focus_session_abandoned'
  | 'preference_changed'
  | 'daily_check_in_completed'
  | 'daily_check_in_skipped'
  | 'ai_request_created'
  | 'ai_suggestion_accepted'
  | 'ai_suggestion_edited'
  | 'ai_suggestion_dismissed'
  | 'activity_tracking_paused'
  | 'activity_history_deleted'
  | 'user_login';

export type ActivitySensitivity = 'standard' | 'personal' | 'emotional';

export interface ConsentContext {
  interactionHistory: boolean;
  aiPersonalization: boolean;
  dailyCheckInContext: boolean;
  conversationMemory: boolean;
}

export interface ConsentSettings {
  interactionHistory: boolean;
  aiPersonalization: boolean;
  dailyCheckInContext: boolean;
  conversationMemory: boolean;
  technicalDiagnostics: boolean;
  consentVersion: string;
  updatedAt: string;
}

export interface UserActivityEvent {
  id: string;
  userId: string;
  sessionId?: string;
  eventName: ActivityEventName;
  occurredAt: string;
  timezone?: string;
  source: 'web' | 'mobile' | 'server';
  screen?: string;
  objectType?: 'task' | 'task_step' | 'project' | 'roadmap_node' | 'focus_session' | 'preference' | 'ai_request';
  objectId?: string;
  properties: Record<string, string | number | boolean | null>;
  sensitivity: ActivitySensitivity;
  consentContext: ConsentContext;
}

// ─── Activity Event Registry ─────────────────────────────────────
export type EventPurpose =
  | 'navigation'
  | 'task_support'
  | 'planning_support'
  | 'session_support'
  | 'preference_support'
  | 'technical_diagnostics';

export interface ActivityEventDefinition {
  name: ActivityEventName;
  purpose: EventPurpose;
  sensitivity: ActivitySensitivity;
  allowedProperties: string[];
  requiresConsent: keyof ConsentSettings | null;
  aiEligible: boolean;
  maxAgeDays: number;
}

export interface UserActivityEvent {
  id: string;
  userId: string;
  sessionId?: string;
  eventName: ActivityEventName;
  occurredAt: string;
  timezone?: string;
  source: 'web' | 'mobile' | 'server';
  screen?: string;
  objectType?: 'task' | 'task_step' | 'project' | 'roadmap_node' | 'focus_session' | 'preference' | 'ai_request';
  objectId?: string;
  properties: Record<string, string | number | boolean | null>;
  sensitivity: ActivitySensitivity;
  consentContext: ConsentContext;
}

export interface AIPersonalizationProfile {
  preferredSessionMinutes?: number[];
  commonlyAcceptedGuidanceStyle?: 'next_step' | 'brief' | 'detailed';
  taskBreakdownPreference?: 'smaller_steps' | 'moderate_steps' | 'larger_steps';
  likelyHelpfulActions?: string[];
  commonlyDismissedSuggestions?: string[];
  preferredAnimationLevel?: 'still' | 'soft' | 'balanced' | 'energizing';
  preferredTheme?: string;
  preferredPlanningDepth?: 'light' | 'moderate' | 'detailed';
  commonRestartPattern?: 'resume_same_task' | 'choose_new_task' | 'needs_check_in' | 'unknown';
  confidenceByField: Record<string, number>;
  lastUpdatedAt: string;
  explanation: string;
}

// ─── Secure Context Assembly Engine ──────────────────────────────
export type RequestIntent =
  | 'task_breakdown'
  | 'make_task_easier'
  | 'planning'
  | 'focus_session_support'
  | 'reflection'
  | 'dashboard_guidance'
  | 'preference_help'
  | 'general_productivity_question'
  | 'unknown';

export interface AssembleContextRequest {
  userId: string;
  requestId: string;
  userMessage: string;
  conversationId?: string;
  currentScreen?: string;
  activeTaskId?: string;
  activeTaskStepId?: string;
  activeProjectId?: string;
  activeRoadmapNodeId?: string;
  clientTimestamp?: string;
}

export interface DerivedPreference {
  key: string;
  value: string | number | boolean;
  source: 'explicit_preference' | 'aggregated_activity';
  evidenceWindow: string;
  evidenceCount: number;
  confidence: number;
  lastUpdatedAt: string;
}

export interface SafeTaskContext {
  reference: string;
  title: string;
  status?: string;
  priority?: string;
}

export interface SafeTaskStepContext {
  reference: string;
  title: string;
  status?: string;
  durationMinutes?: number;
}

export interface SafeProjectContext {
  reference: string;
  title: string;
  status?: string;
}

export interface SafeRoadmapNodeContext {
  reference: string;
  title: string;
  status?: string;
}

export interface SafePreferenceContext {
  guidanceStyle?: string;
  animationIntensity?: string;
  density?: string;
  workRhythm?: string;
  encouragementStyle?: string;
  aiAdaptation?: string;
}

export interface SafeDailyContext {
  state?: string;
  supportPreference?: string;
}

export interface SafeActivitySummary {
  label: string;
  value: string | number;
  evidenceWindow: string;
  evidenceCount: number;
  confidence: number;
}

export interface SafeConversationTurn {
  reference: string;
  summary: string;
  role: 'user' | 'assistant';
}

export interface AIContextEnvelope {
  schemaVersion: '1.0';
  requestId: string;
  userContext: {
    userIdReference: string;
    timezone?: string;
  };
  request: {
    message: string;
    intent: RequestIntent;
  };
  currentContext: {
    screen?: string;
    activeTask?: SafeTaskContext;
    activeTaskStep?: SafeTaskStepContext;
    activeProject?: SafeProjectContext;
    activeRoadmapNode?: SafeRoadmapNodeContext;
  };
  explicitPreferences: SafePreferenceContext;
  approvedDailyContext?: SafeDailyContext;
  derivedPreferences?: DerivedPreference[];
  recentRelevantPatterns?: SafeActivitySummary[];
  approvedConversationMemory?: SafeConversationTurn[];
  consentApplied: string[];
  excludedCategories: string[];
  safetyDirectives: string[];
  budget: {
    maxInputTokens: number;
    estimatedInputTokens: number;
  };
}

export type AssemblyOutcome = 'success' | 'minimal_fallback' | 'blocked';

export interface AssemblyAuditRecord {
  requestId: string;
  userId: string;
  schemaVersion: string;
  intent: RequestIntent;
  consentApplied: string[];
  categoriesIncluded: string[];
  categoriesExcluded: string[];
  eventsConsidered: number;
  eventsIncluded: number;
  redactionsByCategory: Record<string, number>;
  estimatedTokens: number;
  outcome: AssemblyOutcome;
  failureCategory?: string;
  createdAt: string;
}

// ─── App Screens ──────────────────────────────────────────────────
export type Screen =
  | 'home'
  | 'breakdown'
  | 'focus'
  | 'reflection'
  | 'dashboard'
  | 'mood'
  | 'auth'
  | 'checkin'
  | 'work_tasks'
  | 'planning'
  | 'settings'
  | 'roadmap';

export type WorkspaceMode = 'work_tasks' | 'planning';

// ─── App State ────────────────────────────────────────────────────
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
