import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, TaskStep, FeedbackLevel, UserProfile, Goal, MoodEntry, MoodLevel, EnergyLevel, DistractionEntry, Screen, Project, RoadmapNode } from '../types';
import { aiService } from '../lib/ai';
import { trackActivity, getActiveUserId } from '../lib/activity';
import { logAIFeedback } from '../lib/data';

interface AppStore extends AppState {
  isBreakingDown: boolean;
  breakdownText: string;
  sessionSteps: TaskStep[];
  projects: Project[];
  milestones: RoadmapNode[];

  setScreen: (screen: Screen) => void;
  setGoalInput: (input: string) => void;
  setProjects: (projects: Project[]) => void;
  setMilestones: (milestones: RoadmapNode[]) => void;
  breakdownGoal: (goal: string) => Promise<void>;
  startStep: (index: number) => void;
  startFocusSession: () => void;
  completeStep: () => void;
  navigateAfterStep: () => Promise<void>;
  skipStep: () => void;
  markStuck: () => Promise<void>;
  provideFeedback: (feedback: FeedbackLevel) => void;
  makeStepSmaller: () => void;
  makeStepEasier: () => void;
  updateStepTime: (stepId: string, minutes: number) => void;
  updateStepTitle: (stepId: string, title: string) => void;
  drillDownStep: (stepId: string) => Promise<void>;
  dismissCheckIn: () => void;
  resetToHome: () => void;
  setSummary: (summary: string) => void;
  setMood: (mood: MoodLevel, energy: EnergyLevel) => void;
  logDistraction: (label: string) => void;
  resumeSession: (goalId: string, sessionId: string) => void;
  deleteGoal: (goalId: string) => void;
}

const defaultProfile: UserProfile = {
  preferredTaskDuration: 5,
  totalSessions: 0,
  totalStepsCompleted: 0,
  commonPatterns: [],
  recentFeedback: [],
  moodHistory: [],
};

function simulateTyping(text: string, set: any): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      if (i >= text.length) {
        set({ breakdownText: text });
        clearInterval(interval);
        setTimeout(resolve, 300);
      } else {
        set({ breakdownText: text.slice(0, i) });
      }
    }, 15);
  });
}

// ─── Recursive step helpers ──────────────────────────────────────
function mapStepById(steps: TaskStep[], id: string, fn: (s: TaskStep) => TaskStep): TaskStep[] {
  return steps.map(s => {
    if (s.id === id) return fn(s);
    if (s.children) return { ...s, children: mapStepById(s.children, id, fn) };
    return s;
  });
}

function flattenSteps(steps: TaskStep[]): TaskStep[] {
  const result: TaskStep[] = [];
  for (const s of steps) {
    result.push(s);
    if (s.children) result.push(...flattenSteps(s.children));
  }
  return result;
}

function findNextPendingIndex(steps: TaskStep[]): number {
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].status === 'pending') return i;
    if (steps[i].children) {
      const childIdx = findNextPendingIndex(steps[i].children!);
      if (childIdx >= 0) return i;
    }
  }
  return -1;
}

export const useAppStore = create<AppStore>()(persist((set, get) => ({
  screen: 'dashboard',
  goalInput: '',
  currentSession: null,
  profile: defaultProfile,
  checkInMessage: null,
  aiTyping: false,
  isBreakingDown: false,
  breakdownText: '',
  sessionSteps: [],
  goals: [],
  distractionLog: [],
  projects: [],
  milestones: [],

  setScreen: (screen) => set({ screen }),
  setGoalInput: (input) => set({ goalInput: input }),
  setProjects: (projects) => set({ projects }),
  setMilestones: (milestones) => set({ milestones }),

  setMood: (mood: MoodLevel, energy: EnergyLevel) => {
    const { profile, currentSession } = get();
    const entry: MoodEntry = { mood, energy, timestamp: new Date().toISOString() };

    const updatedSession = currentSession
      ? { ...currentSession, mood: entry }
      : null;

    set({
      profile: {
        ...profile,
        moodHistory: [...profile.moodHistory, entry].slice(-30),
      },
      currentSession: updatedSession,
    });
  },

  breakdownGoal: async (goal: string) => {
    set({
      isBreakingDown: true,
      breakdownText: '',
      sessionSteps: [],
      goalInput: goal,
      screen: 'work_tasks',
      currentSession: {
        id: `session-${Date.now()}`,
        goalTitle: goal,
        steps: [],
        groups: [],
        currentStepIndex: 0,
        feedback: [],
        startedAt: new Date().toISOString(),
        distractions: [],
      },
    });

    try {
      const rawResponse = await aiService.generateBreakdown(goal, get().profile);

      const parsed = aiService.extractJsonArray(rawResponse);

      let steps: TaskStep[] = [];
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        steps = parsed.map((step: any, i: number) => ({
          id: `step-${Date.now()}-${i}`,
          title: step.title || `Step ${i + 1}`,
          durationMinutes: Math.min(5, Math.max(1, step.durationMinutes || 5)),
          status: 'pending' as const,
        }));
      }

      if (steps.length === 0) {
        steps = [
          { id: `step-${Date.now()}-0`, title: "Open the relevant materials", durationMinutes: 2, status: 'pending' },
          { id: `step-${Date.now()}-1`, title: "Read or review the first section", durationMinutes: 5, status: 'pending' },
          { id: `step-${Date.now()}-2`, title: "Write down one key takeaway", durationMinutes: 3, status: 'pending' },
        ];
      }

      const groups = [{
        label: 'Getting started',
        emoji: '🌱',
        steps,
      }];

      await simulateTyping(rawResponse, set);

      const prev = get().currentSession!;
      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        title: goal,
        sessions: [{ ...prev, steps, groups }],
        createdAt: new Date().toISOString(),
        archived: false,
      };
      set({
        currentSession: { ...prev, steps, groups },
        sessionSteps: steps,
        isBreakingDown: false,
        goals: [...get().goals, newGoal],
      });
      trackActivity('ai_request_created', { properties: { type: 'breakdown' } });
      trackActivity('task_breakdown_generated', { properties: { stepCount: steps.length } });
    } catch (error) {
      console.error("AI breakdown failed:", error);
      const fallbackSteps: TaskStep[] = [
        { id: `step-${Date.now()}-0`, title: "Open the relevant materials", durationMinutes: 2, status: 'pending' },
        { id: `step-${Date.now()}-1`, title: "Read or review the first section", durationMinutes: 5, status: 'pending' },
        { id: `step-${Date.now()}-2`, title: "Write down one key takeaway", durationMinutes: 3, status: 'pending' },
      ];
      const prev = get().currentSession!;
      set({
        currentSession: { ...prev, steps: fallbackSteps, groups: [{ label: 'Getting started', emoji: '🌱', steps: fallbackSteps }] },
        sessionSteps: fallbackSteps,
        isBreakingDown: false,
      });
    }
  },

  startStep: (index: number) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const steps = [...currentSession.steps];
    steps[index] = { ...steps[index], status: 'active' };

    set({
      currentSession: { ...currentSession, steps, currentStepIndex: index },
      screen: 'focus',
    });

    trackActivity('task_started', {
      objectType: 'task_step',
      objectId: steps[index].id,
      properties: { stepIndex: index },
    });
    trackActivity('task_step_accepted', {
      objectType: 'task_step',
      objectId: steps[index].id,
      properties: { stepIndex: index, durationMinutes: steps[index].durationMinutes },
    });
    trackActivity('focus_session_started', {
      properties: { durationMinutes: steps[index].durationMinutes },
    });
  },

  startFocusSession: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const firstPending = findNextPendingIndex(currentSession.steps);
    if (firstPending >= 0) {
      get().startStep(firstPending);
    }
  },

  completeStep: () => {
    const { currentSession, profile } = get();
    if (!currentSession) return;

    const steps = [...currentSession.steps];
    const idx = currentSession.currentStepIndex;
    steps[idx] = { ...steps[idx], status: 'completed' };

    const allFlat = flattenSteps(steps);
    const completedCount = allFlat.filter(s => s.status === 'completed').length;
    const allDone = completedCount === allFlat.length;

    const nextPending = findNextPendingIndex(steps);
    const nextIdx = nextPending >= 0 ? nextPending : idx;

    set({
      currentSession: {
        ...currentSession,
        steps,
        currentStepIndex: nextIdx,
        completedAt: allDone ? new Date().toISOString() : undefined,
      },
      profile: {
        ...profile,
        totalSessions: allDone ? profile.totalSessions + 1 : profile.totalSessions,
        totalStepsCompleted: profile.totalStepsCompleted + 1,
      },
    });

    trackActivity('task_completed', {
      objectType: 'task_step',
      objectId: steps[idx].id,
      properties: { stepIndex: idx },
    });
    if (allDone) {
      trackActivity('focus_session_completed', {});
    }
  },

  navigateAfterStep: async () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const allFlat = flattenSteps(currentSession.steps);
    const completedCount = allFlat.filter(s => s.status === 'completed').length;
    const allDone = completedCount === allFlat.length;

    if (allDone) {
      set({ screen: 'reflection' });
    } else {
      set({ screen: 'dashboard', checkInMessage: aiService.getRandomEncouragement() });
    }
  },

  skipStep: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const steps = [...currentSession.steps];
    const idx = currentSession.currentStepIndex;
    steps[idx] = { ...steps[idx], status: 'skipped' };

    set({
      currentSession: { ...currentSession, steps },
      screen: 'dashboard',
    });

    trackActivity('task_postponed', {
      objectType: 'task_step',
      objectId: steps[idx].id,
      properties: { stepIndex: idx },
    });
    trackActivity('focus_session_abandoned', {});
  },

  markStuck: async () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const currentStep = currentSession.steps[currentSession.currentStepIndex];
    set({ checkInMessage: "Let me find a smaller way to do this..." });

    try {
      const rawResponse = await aiService.generateStuckAlternative(currentStep.title);

      let newStep: TaskStep = {
        id: `step-${Date.now()}-stuck`,
        title: `Just look at: ${currentStep.title.toLowerCase()}`,
        durationMinutes: 1,
        status: 'active',
      };

      const parsed = aiService.extractJsonObject(rawResponse);
      if (parsed && parsed.title && parsed.durationMinutes) {
        newStep = { ...newStep, title: parsed.title, durationMinutes: parsed.durationMinutes };
      }

      const steps = [...currentSession.steps];
      steps.splice(currentSession.currentStepIndex + 1, 0, newStep);
      steps[currentSession.currentStepIndex] = {
        ...steps[currentSession.currentStepIndex],
        status: 'stuck',
      };

      const newIdx = Math.min(currentSession.currentStepIndex + 1, steps.length - 1);
      set({
        currentSession: {
          ...currentSession,
          steps,
          currentStepIndex: newIdx,
        },
        checkInMessage: null,
      });

      trackActivity('task_marked_stuck', {
        objectType: 'task_step',
        objectId: currentStep.id,
        properties: { stepIndex: currentSession.currentStepIndex },
      });
    } catch (error) {
      console.error("Stuck AI failed:", error);
      const currentStep = get().currentSession!.steps[get().currentSession!.currentStepIndex];
      const originalTitle = currentStep.originalTitle ?? currentStep.title;
      const fallbackStep: TaskStep = {
        id: `step-${Date.now()}-stuck`,
        title: `Just look at: ${originalTitle.toLowerCase()}`,
        durationMinutes: 1,
        status: 'active',
      };

      const steps = [...get().currentSession!.steps];
      steps.splice(get().currentSession!.currentStepIndex + 1, 0, fallbackStep);
      steps[get().currentSession!.currentStepIndex] = {
        ...get().currentSession!.steps[get().currentSession!.currentStepIndex],
        status: 'stuck',
      };

      const newIdx = Math.min(get().currentSession!.currentStepIndex + 1, steps.length - 1);
      set({
        currentSession: {
          ...get().currentSession!,
          steps,
          currentStepIndex: newIdx,
        },
        checkInMessage: null,
      });
    }
  },

  provideFeedback: (feedback: FeedbackLevel) => {
    const { currentSession, profile } = get();
    if (!currentSession) return;

    const updatedFeedback = [...profile.recentFeedback, feedback].slice(-5);

    set({
      profile: {
        ...profile,
        recentFeedback: updatedFeedback,
        preferredTaskDuration:
          feedback === 'too_much'
            ? Math.max(2, profile.preferredTaskDuration - 2)
            : feedback === 'easy'
            ? Math.min(15, profile.preferredTaskDuration + 2)
            : profile.preferredTaskDuration,
      },
      checkInMessage: null,
    });

    const userId = getActiveUserId();
    if (userId) {
      const outcome = feedback === 'too_much' ? 'rejected' : 'accepted';
      void logAIFeedback(userId, { outcome, suggestionType: 'task_step', sourceEvent: 'feedback' });
    }
  },

  makeStepSmaller: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const steps = currentSession.steps.map(s => ({
      ...s,
      durationMinutes: Math.max(1, Math.round(s.durationMinutes * 0.5)),
      originalDuration: s.originalDuration ?? s.durationMinutes,
    }));

    set({
      currentSession: { ...currentSession, steps },
      sessionSteps: steps,
    });

    trackActivity('task_step_simplified', {
      objectType: 'task_step',
      properties: { stepIndex: currentSession.currentStepIndex },
    });
  },

  makeStepEasier: async () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const idx = currentSession.currentStepIndex;
    const step = currentSession.steps[idx];
    const originalTitle = step.originalTitle ?? step.title;

    set({ checkInMessage: "Let me simplify this..." });

    try {
      const rawResponse = await aiService.generateEasierAlternative(originalTitle);

      let newTitle = step.title;
      let newDuration = Math.max(1, Math.round(step.durationMinutes * 0.5));

      const parsed = aiService.extractJsonObject(rawResponse);
      if (parsed && parsed.title && parsed.durationMinutes) {
        newTitle = parsed.title;
        newDuration = parsed.durationMinutes;
      } else {
        newTitle = `Gently: ${originalTitle.toLowerCase()}`;
      }

      const steps = [...currentSession.steps];
      steps[idx] = {
        ...steps[idx],
        title: newTitle,
        durationMinutes: newDuration,
        originalTitle,
      };

      set({
        currentSession: { ...currentSession, steps },
        checkInMessage: null,
      });

      trackActivity('task_step_simplified', {
        objectType: 'task_step',
        objectId: steps[idx].id,
        properties: { stepIndex: idx },
      });
    } catch (error) {
      console.error("Easier AI failed:", error);
      const steps = [...currentSession.steps];
      steps[idx] = {
        ...steps[idx],
        durationMinutes: Math.max(1, Math.round(step.durationMinutes * 0.5)),
        originalTitle,
      };
      set({
        currentSession: { ...currentSession, steps },
        checkInMessage: null,
      });

      trackActivity('task_step_simplified', {
        objectType: 'task_step',
        objectId: steps[idx].id,
        properties: { stepIndex: idx },
      });
    }
  },

  updateStepTime: (stepId: string, minutes: number) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const steps = mapStepById(currentSession.steps, stepId, s => ({
      ...s,
      durationMinutes: Math.max(1, minutes),
    }));

    set({ currentSession: { ...currentSession, steps } });
    trackActivity('task_updated', { objectType: 'task_step', objectId: stepId, properties: { field: 'durationMinutes' } });
  },

  updateStepTitle: (stepId: string, title: string) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const steps = mapStepById(currentSession.steps, stepId, s => ({
      ...s,
      title,
    }));

    set({ currentSession: { ...currentSession, steps } });
    trackActivity('task_updated', { objectType: 'task_step', objectId: stepId, properties: { field: 'title' } });
  },

  drillDownStep: async (stepId: string) => {
    const { currentSession } = get();
    if (!currentSession) return;

    function setDrilling(steps: TaskStep[], id: string, drilling: boolean): TaskStep[] {
      return steps.map(s => {
        if (s.id === id) return { ...s, isDrilling: drilling };
        if (s.children) return { ...s, children: setDrilling(s.children, id, drilling) };
        return s;
      });
    }

    function replaceChildren(steps: TaskStep[], id: string, children: TaskStep[]): TaskStep[] {
      return steps.map(s => {
        if (s.id === id) return { ...s, children, isDrilling: false };
        if (s.children) return { ...s, children: replaceChildren(s.children, id, children) };
        return s;
      });
    }

    function findStep(steps: TaskStep[], id: string): TaskStep | undefined {
      for (const s of steps) {
        if (s.id === id) return s;
        if (s.children) {
          const found = findStep(s.children, id);
          if (found) return found;
        }
      }
      return undefined;
    }

    const step = findStep(currentSession.steps, stepId);
    if (!step || step.children || step.isDrilling) return;

    set({ currentSession: { ...currentSession, steps: setDrilling(currentSession.steps, stepId, true) } });

    try {
      const rawResponse = await aiService.generateStepBreakdown(step.title, currentSession.goalTitle);
      const parsed = aiService.extractJsonArray(rawResponse);

      let children: TaskStep[] = [];
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        children = parsed.map((child: any, i: number) => ({
          id: `step-${Date.now()}-${i}`,
          title: child.title || `Sub-step ${i + 1}`,
          durationMinutes: Math.min(5, Math.max(1, child.durationMinutes || 3)),
          status: 'pending' as const,
        }));
      }

      if (children.length === 0) {
        children = [
          { id: `step-${Date.now()}-0`, title: `Look at: ${step.title.toLowerCase()}`, durationMinutes: 2, status: 'pending' },
          { id: `step-${Date.now()}-1`, title: `Do the first part of: ${step.title.toLowerCase()}`, durationMinutes: 3, status: 'pending' },
        ];
      }

      set({ currentSession: { ...currentSession, steps: replaceChildren(currentSession.steps, stepId, children) } });
      trackActivity('task_step_drilled_down', { objectType: 'task_step', objectId: stepId, properties: { childCount: children.length } });
    } catch (error) {
      console.error("Drill-down AI failed:", error);
      const fallback: TaskStep[] = [
        { id: `step-${Date.now()}-0`, title: `Start with: ${step.title.toLowerCase()}`, durationMinutes: 2, status: 'pending' },
        { id: `step-${Date.now()}-1`, title: `Continue: ${step.title.toLowerCase()}`, durationMinutes: 3, status: 'pending' },
      ];
      set({ currentSession: { ...currentSession, steps: replaceChildren(currentSession.steps, stepId, fallback) } });
    }
  },

  setSummary: (summary: string) => {
    const { currentSession } = get();
    if (!currentSession) return;
    set({ currentSession: { ...currentSession, summary } });
  },

  logDistraction: (label: string) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const entry: DistractionEntry = {
      id: `dist-${Date.now()}`,
      label,
      timestamp: new Date().toISOString(),
    };

    const distractions = [...currentSession.distractions, entry];
    set({
      currentSession: { ...currentSession, distractions },
      distractionLog: [...get().distractionLog, entry],
    });
  },

  resumeSession: (goalId: string, sessionId: string) => {
    const { goals } = get();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const session = goal.sessions.find(s => s.id === sessionId);
    if (!session) return;

    set({ currentSession: session, screen: 'work_tasks' });
  },

  deleteGoal: (goalId: string) => {
    const { goals } = get();
    set({ goals: goals.filter(g => g.id !== goalId) });
  },

  dismissCheckIn: () => set({ checkInMessage: null }),

  resetToHome: () => set({
    screen: 'dashboard',
    goalInput: '',
    currentSession: null,
    checkInMessage: null,
  }),
}), {
  name: 'focusbridge-storage',
  partialize: (state) => ({
    currentSession: state.currentSession,
    sessionSteps: state.sessionSteps,
    profile: state.profile,
    goals: state.goals,
    projects: state.projects,
    milestones: state.milestones,
  }),
}));
