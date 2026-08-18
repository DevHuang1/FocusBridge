import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, FocusSession, TaskStep, FeedbackLevel, UserProfile } from '../types';
import { aiService } from '../lib/ai';

interface AppStore extends AppState {
  isBreakingDown: boolean;
  breakdownText: string;
  sessionSteps: TaskStep[];
  
  setScreen: (screen: AppState['screen']) => void;
  setGoalInput: (input: string) => void;
  breakdownGoal: (goal: string) => Promise<void>;
  startStep: (index: number) => void;
  startFocusSession: () => void;
  completeStep: () => void;
  skipStep: () => void;
  markStuck: () => Promise<void>;
  provideFeedback: (feedback: FeedbackLevel) => void;
  makeStepSmaller: () => void;
  makeStepEasier: () => void;
  updateStepTime: (stepId: string, minutes: number) => void;
  updateStepTitle: (stepId: string, title: string) => void;
  dismissCheckIn: () => void;
  resetToHome: () => void;
  setSummary: (summary: string) => void;
}

const defaultProfile: UserProfile = {
  preferredTaskDuration: 5,
  totalSessions: 0,
  totalStepsCompleted: 0,
  commonPatterns: [],
  recentFeedback: [],
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

export const useAppStore = create<AppStore>()(persist((set, get) => ({
  screen: 'home',
  goalInput: '',
  currentSession: null,
  profile: defaultProfile,
  checkInMessage: null,
  aiTyping: false,
  isBreakingDown: false,
  breakdownText: '',
  sessionSteps: [],

  setScreen: (screen) => set({ screen }),
  setGoalInput: (input) => set({ goalInput: input }),

  breakdownGoal: async (goal: string) => {
    set({
      isBreakingDown: true,
      breakdownText: '',
      sessionSteps: [],
      goalInput: goal,
      screen: 'breakdown',
      currentSession: {
        id: `session-${Date.now()}`,
        goalTitle: goal,
        steps: [],
        currentStepIndex: 0,
        feedback: [],
        startedAt: new Date().toISOString(),
      },
    });

    try {
      const rawResponse = await aiService.generateBreakdown(goal, get().profile);
      console.log("AI raw response:", rawResponse);

      const parsed = aiService.extractJsonArray(rawResponse);
      console.log("Parsed steps:", parsed);

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
        console.warn("No valid steps parsed, using fallback");
        steps = [
          { id: `step-${Date.now()}-0`, title: "Open the relevant materials", durationMinutes: 2, status: 'pending' },
          { id: `step-${Date.now()}-1`, title: "Read or review the first section", durationMinutes: 5, status: 'pending' },
          { id: `step-${Date.now()}-2`, title: "Write down one key takeaway", durationMinutes: 3, status: 'pending' },
        ];
      }

      await simulateTyping(rawResponse, set);

      const prev = get().currentSession!;
      set({
        currentSession: { ...prev, steps },
        sessionSteps: steps,
        isBreakingDown: false,
      });
    } catch (error) {
      console.error("AI breakdown failed:", error);
      const fallbackSteps: TaskStep[] = [
        { id: `step-${Date.now()}-0`, title: "Open the relevant materials", durationMinutes: 2, status: 'pending' },
        { id: `step-${Date.now()}-1`, title: "Read or review the first section", durationMinutes: 5, status: 'pending' },
        { id: `step-${Date.now()}-2`, title: "Write down one key takeaway", durationMinutes: 3, status: 'pending' },
      ];
      const prev = get().currentSession!;
      set({
        currentSession: { ...prev, steps: fallbackSteps },
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
  },

  startFocusSession: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const firstPending = currentSession.steps.findIndex(s => s.status === 'pending');
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

    const completedCount = steps.filter(s => s.status === 'completed').length;
    const allDone = completedCount === steps.length;

    const updatedSession: FocusSession = {
      ...currentSession,
      steps,
      completedAt: allDone ? new Date().toISOString() : undefined,
    };

    if (allDone) {
      set({
        currentSession: updatedSession,
        screen: 'reflection',
        profile: {
          ...profile,
          totalSessions: profile.totalSessions + 1,
          totalStepsCompleted: profile.totalStepsCompleted + completedCount,
        },
      });
    } else {
      const checkIn = aiService.generateCheckIn(completedCount, steps.length, profile.recentFeedback);
      set({
        currentSession: updatedSession,
        screen: 'home',
        checkInMessage: checkIn,
        profile: {
          ...profile,
          totalSessions: profile.totalSessions + 1,
          totalStepsCompleted: profile.totalStepsCompleted + 1,
        },
      });
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
      screen: 'home',
    });
  },

  markStuck: async () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const currentStep = currentSession.steps[currentSession.currentStepIndex];
    set({ checkInMessage: "Let me find a smaller way to do this..." });

    try {
      const rawResponse = await aiService.generateStuckAlternative(currentStep.title);
      console.log("Stuck AI response:", rawResponse);

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

      set({
        currentSession: {
          ...currentSession,
          steps,
          currentStepIndex: currentSession.currentStepIndex + 1,
        },
        checkInMessage: null,
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
        ...steps[get().currentSession!.currentStepIndex],
        status: 'stuck',
      };

      set({
        currentSession: {
          ...get().currentSession!,
          steps,
          currentStepIndex: get().currentSession!.currentStepIndex + 1,
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
      console.log("Easier AI response:", rawResponse);

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
    }
  },

  updateStepTime: (stepId: string, minutes: number) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const steps = currentSession.steps.map(s =>
      s.id === stepId ? { ...s, durationMinutes: Math.max(1, minutes) } : s
    );

    set({ currentSession: { ...currentSession, steps } });
  },

  updateStepTitle: (stepId: string, title: string) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const steps = currentSession.steps.map(s =>
      s.id === stepId ? { ...s, title } : s
    );

    set({ currentSession: { ...currentSession, steps } });
  },

  setSummary: (summary: string) => {
    const { currentSession } = get();
    if (!currentSession) return;
    set({ currentSession: { ...currentSession, summary } });
  },

  dismissCheckIn: () => set({ checkInMessage: null }),

  resetToHome: () => set({
    screen: 'home',
    goalInput: '',
    currentSession: null,
    checkInMessage: null,
  }),
}), {
  name: 'focusbridge-storage',
  partialize: (state) => ({
    currentSession: state.currentSession,
    profile: state.profile,
  }),
}));
