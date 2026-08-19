import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserPreferences,
  AnimationIntensity,
  ColorTheme,
  InterfaceDensity,
  GuidanceStyle,
  CelebrationLevel,
  SoundHaptics,
  ReducedMotionPref,
  AIAdaptation,
  WorkRhythm,
  EncouragementStyle,
  DailyCheckIn,
} from '../types';
import { defaultPreferences } from '../types';
import { trackActivity } from '../lib/activity';

function trackPrefChange(field: string, value: unknown): void {
  trackActivity('preference_changed', { properties: { field, value: String(value) } });
}

interface PersonalizationState {
  preferences: UserPreferences;
  todayCheckIn: DailyCheckIn | null;
  checkInDismissed: boolean;
  pendingCheckIn: boolean;
  adaptationNote: string | null;

  // Preferences actions
  setAnimationIntensity: (v: AnimationIntensity) => void;
  setColorTheme: (v: ColorTheme) => void;
  setDensity: (v: InterfaceDensity) => void;
  setGuidanceStyle: (v: GuidanceStyle) => void;
  setCelebrationEffects: (v: CelebrationLevel) => void;
  setSoundHaptics: (v: SoundHaptics) => void;
  setReducedMotion: (v: ReducedMotionPref) => void;
  setAIAdaptation: (v: AIAdaptation) => void;
  setWorkRhythm: (v: WorkRhythm) => void;
  setEncouragementStyle: (v: EncouragementStyle) => void;
  setDailyCheckInEnabled: (v: boolean) => void;
  setSoftStartEnabled: (v: boolean) => void;
  setTransitionBridgeEnabled: (v: boolean) => void;
  resetPreferences: () => void;
  applyPartialPreferences: (partial: Partial<UserPreferences>) => void;

  // Check-in actions
  setTodayCheckIn: (checkIn: DailyCheckIn) => void;
  setPendingCheckIn: (value: boolean) => void;
  dismissCheckIn: () => void;
  clearTodayCheckIn: () => void;

  // Adaptation
  setAdaptationNote: (note: string | null) => void;

  // Theme application
  applyThemeToDOM: () => void;
}

export const usePersonalizationStore = create<PersonalizationState>()(
  persist(
    (set, get) => ({
      preferences: { ...defaultPreferences },
      todayCheckIn: null,
      checkInDismissed: false,
      pendingCheckIn: false,
      adaptationNote: null,

      setAnimationIntensity: (v) => {
        set((s) => ({ preferences: { ...s.preferences, animationIntensity: v } }));
        trackPrefChange('animationIntensity', v);
        get().applyThemeToDOM();
      },
      setColorTheme: (v) => {
        set((s) => ({ preferences: { ...s.preferences, colorTheme: v } }));
        trackPrefChange('colorTheme', v);
        get().applyThemeToDOM();
      },
      setDensity: (v) => {
        set((s) => ({ preferences: { ...s.preferences, density: v } }));
        trackPrefChange('density', v);
      },
      setGuidanceStyle: (v) => {
        set((s) => ({ preferences: { ...s.preferences, guidanceStyle: v } }));
        trackPrefChange('guidanceStyle', v);
      },
      setCelebrationEffects: (v) => {
        set((s) => ({ preferences: { ...s.preferences, celebrationEffects: v } }));
        trackPrefChange('celebrationEffects', v);
      },
      setSoundHaptics: (v) => {
        set((s) => ({ preferences: { ...s.preferences, soundHaptics: v } }));
        trackPrefChange('soundHaptics', v);
      },
      setReducedMotion: (v) => {
        set((s) => ({ preferences: { ...s.preferences, reducedMotion: v } }));
        trackPrefChange('reducedMotion', v);
        get().applyThemeToDOM();
      },
      setAIAdaptation: (v) => {
        set((s) => ({ preferences: { ...s.preferences, aiAdaptation: v } }));
        trackPrefChange('aiAdaptation', v);
      },
      setWorkRhythm: (v) => {
        set((s) => ({ preferences: { ...s.preferences, workRhythm: v } }));
        trackPrefChange('workRhythm', v);
      },
      setEncouragementStyle: (v) => {
        set((s) => ({ preferences: { ...s.preferences, encouragementStyle: v } }));
        trackPrefChange('encouragementStyle', v);
      },
      setDailyCheckInEnabled: (v) => {
        set((s) => ({ preferences: { ...s.preferences, dailyCheckInEnabled: v } }));
        trackPrefChange('dailyCheckInEnabled', v);
      },
      setSoftStartEnabled: (v) => {
        set((s) => ({ preferences: { ...s.preferences, softStartEnabled: v } }));
        trackPrefChange('softStartEnabled', v);
      },
      setTransitionBridgeEnabled: (v) => {
        set((s) => ({ preferences: { ...s.preferences, transitionBridgeEnabled: v } }));
        trackPrefChange('transitionBridgeEnabled', v);
      },

      resetPreferences: () => {
        set({ preferences: { ...defaultPreferences } });
        get().applyThemeToDOM();
      },

      applyPartialPreferences: (partial) => {
        set((s) => ({ preferences: { ...s.preferences, ...partial } }));
        get().applyThemeToDOM();
      },

      setTodayCheckIn: (checkIn) => set({ todayCheckIn: checkIn, checkInDismissed: false }),
      setPendingCheckIn: (value) => set({ pendingCheckIn: value }),
      dismissCheckIn: () => set({ checkInDismissed: true }),
      clearTodayCheckIn: () => set({ todayCheckIn: null, checkInDismissed: false }),

      setAdaptationNote: (note) => set({ adaptationNote: note }),

      applyThemeToDOM: () => {
        const { preferences } = get();
        const root = document.documentElement;

        // Apply color theme
        root.setAttribute('data-theme', preferences.colorTheme);

        // Apply reduced motion
        const shouldReduceMotion =
          preferences.reducedMotion === 'always_on' ||
          (preferences.reducedMotion === 'follow_system' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        root.setAttribute('data-reduced-motion', shouldReduceMotion ? 'on' : 'off');
      },
    }),
    {
      name: 'focusbridge-prefs',
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);

// Helper: resolve effective animation duration based on preference
export function getMotionDuration(level: AnimationIntensity, base: number): number {
  switch (level) {
    case 'still': return 0;
    case 'soft': return base * 0.6;
    case 'balanced': return base;
    case 'energizing': return base * 1.3;
    default: return base;
  }
}

// Helper: get density-based spacing class
export function getDensityClass(density: InterfaceDensity): string {
  switch (density) {
    case 'minimal': return 'gap-3 space-y-3';
    case 'comfortable': return 'gap-4 space-y-4';
    case 'detailed': return 'gap-5 space-y-5';
    default: return 'gap-4 space-y-4';
  }
}
