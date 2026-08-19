import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConsentSettings } from '../types';

const safeDefaults: ConsentSettings = {
  interactionHistory: false,
  aiPersonalization: false,
  dailyCheckInContext: false,
  conversationMemory: false,
  technicalDiagnostics: true,
  consentVersion: '1.0',
  updatedAt: new Date().toISOString(),
};

interface ConsentState {
  consent: ConsentSettings;
  hasConsented: boolean;
  consentDismissed: boolean;

  setConsent: (consent: ConsentSettings) => void;
  setFlag: (key: keyof ConsentSettings, value: boolean) => void;
  markConsented: () => void;
  dismissConsent: () => void;
  resetConsent: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      consent: { ...safeDefaults },
      hasConsented: false,
      consentDismissed: false,

      setConsent: (consent) => set({ consent }),
      setFlag: (key, value) =>
        set((s) => ({ consent: { ...s.consent, [key]: value } })),
      markConsented: () => set({ hasConsented: true, consentDismissed: false }),
      dismissConsent: () => set({ consentDismissed: true }),
      resetConsent: () =>
        set({ consent: { ...safeDefaults }, hasConsented: false, consentDismissed: false }),
    }),
    {
      name: 'focusbridge-consent',
      partialize: (state) => ({
        consent: state.consent,
        hasConsented: state.hasConsented,
        consentDismissed: state.consentDismissed,
      }),
    }
  )
);