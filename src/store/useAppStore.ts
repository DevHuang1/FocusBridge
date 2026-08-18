import { create } from 'zustand';
import type { AppState, FocusSession, FeedbackLevel, UserProfile } from '../types';
import { aiService } from '../lib/ai';

interface AppStore extends AppState {
  setScreen: (screen: AppState['screen']) => void;
  setGoalInput: (input: string) => void;
  generateBreakdown: (goal: string) => void;
  startStep: (index: number) => void;
  completeStep: () => void;
  skipStep: () => void;
  markStuck: () => void;
  provideFeedback: (feedback: FeedbackLevel) => void;
  makeStepSmaller: () => void;
  makeStepEasier: () => void;
  updateStepTime: (stepId: string, minutes: number) => void;
  updateStepTitle: (stepId: string, title: string) => void;
  dismissCheckIn: () => void;
  resetToHome: () => void;
  startFocusSession: () => void;
}

const defaultProfile: UserProfile = {
  preferredTaskDuration: 5,
  totalSessions: 0,
  totalStepsCompleted: 0,
  commonPatterns: [],
  recentFeedback: [],
};

export const useAppStore = create<AppStore>((set, get) => ({
  screen: 'home',
  goalInput: '',
  currentSession: null,
  profile: defaultProfile,
  checkInMessage: null,
  aiTyping: false,

  setScreen: (screen) => set({ screen }),
  setGoalInput: (input) => set({ goalInput: input }),

  generateBreakdown: (goal: string) => {
    set({ aiTyping: true, goalInput: goal });

    setTimeout(() => {
      const result = aiService.generateBreakdown(goal);
      const session: FocusSession = {
        id: `session-${Date.now()}`,
        goalTitle: goal,
        steps: result.steps,
        currentStepIndex: 0,
        feedback: [],
        startedAt: new Date().toISOString(),
      };

      set({
        currentSession: session,
        screen: 'breakdown',
        aiTyping: false,
      });
    }, 1200);
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

  markStuck: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const currentStep = currentSession.steps[currentSession.currentStepIndex];
    const { message, step } = aiService.generateStuckAlternative(currentStep);

    const steps = [...currentSession.steps];
    steps.splice(currentSession.currentStepIndex + 1, 0, step);
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
      checkInMessage: message,
    });
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

    const steps = [...currentSession.steps];
    const idx = currentSession.currentStepIndex;
    steps[idx] = aiService.generateSmallerStep(steps[idx]);

    set({
      currentSession: { ...currentSession, steps },
    });
  },

  makeStepEasier: () => {
    const { currentSession } = get();
    if (!currentSession) return;

    const steps = [...currentSession.steps];
    const idx = currentSession.currentStepIndex;
    steps[idx] = {
      ...steps[idx],
      durationMinutes: Math.max(1, Math.round(steps[idx].durationMinutes * 0.5)),
      title: `Just look at: ${steps[idx].title.toLowerCase()}`,
    };

    set({
      currentSession: { ...currentSession, steps },
    });
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

  dismissCheckIn: () => set({ checkInMessage: null }),

  resetToHome: () => set({
    screen: 'home',
    goalInput: '',
    currentSession: null,
    checkInMessage: null,
  }),
}));
