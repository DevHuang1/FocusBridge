import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { useConsentStore } from '../store/useConsentStore';
import { useAuth } from '../contexts/AuthContext';
import { saveConsentStatus } from '../lib/data';
import { getActiveUserId, flushQueue } from '../lib/activity';
import type { ConsentSettings } from '../types';
import { Shield, Check } from 'lucide-react';

const consentOptions: { key: keyof ConsentSettings; label: string; desc: string }[] = [
  { key: 'interactionHistory', label: 'Interaction history', desc: 'Remember which screens and buttons you use' },
  { key: 'aiPersonalization', label: 'Use history to personalize AI', desc: 'Let FocusBridge shape suggestions from your activity' },
  { key: 'dailyCheckInContext', label: 'Use daily check-in context', desc: 'Use your self-reported check-in to adapt the workspace' },
  { key: 'conversationMemory', label: 'Remember AI conversations', desc: 'Keep context about accepted, edited, or dismissed suggestions' },
  { key: 'technicalDiagnostics', label: 'Anonymous technical diagnostics', desc: 'Error and reliability data to keep the app working' },
];

export function ConsentCard() {
  const consent = useConsentStore((s) => s.consent);
  const setFlag = useConsentStore((s) => s.setFlag);
  const markConsented = useConsentStore((s) => s.markConsented);
  const dismissConsent = useConsentStore((s) => s.dismissConsent);
  const user = useAuth((s) => s.user);
  const [saving, setSaving] = useState(false);

  const persist = async () => {
    const userId = getActiveUserId() ?? user?.id ?? null;
    if (userId) {
      try {
        await saveConsentStatus(userId, consent, true);
      } catch {}
    }
    markConsented();
    void flushQueue();
  };

  const handleContinue = async () => {
    setSaving(true);
    await persist();
    setSaving(false);
  };

  const handleSkip = async () => {
    setSaving(true);
    const userId = getActiveUserId() ?? user?.id ?? null;
    if (userId) {
      try {
        await saveConsentStatus(userId, consent, true);
      } catch {}
    }
    dismissConsent();
    setSaving(false);
  };

  return (
    <Card className="w-full max-w-xl mx-auto animate-fade-in-up">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-2xl shrink-0" style={{ backgroundColor: 'var(--color-theme-surface)' }}>
          <Shield size={20} style={{ color: 'var(--color-theme-primary)' }} />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-text-primary">Make FocusBridge more personal?</h2>
          <p className="text-xs text-text-muted">Your choice, any time. Change it in Settings.</p>
        </div>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mb-5">
        FocusBridge can remember how you use the app — such as which guidance you accept, which
        task views you open, and which session lengths you complete. This helps the AI offer more
        relevant suggestions over time. FocusBridge will never record passwords, private browsing,
        raw keystrokes, microphone data, or camera data. You can choose what is remembered, change
        your settings later, or use FocusBridge without activity-based personalization.
      </p>

      <div className="space-y-2.5 mb-6">
        {consentOptions.map((opt) => (
          <div key={opt.key} className="flex items-center justify-between gap-3 p-3.5 rounded-[1.25rem] border-2 border-cream-200/70">
            <div>
              <p className="text-sm font-medium text-text-primary">{opt.label}</p>
              <p className="text-xs text-text-muted">{opt.desc}</p>
            </div>
            <button
              onClick={() => setFlag(opt.key, !consent[opt.key])}
              role="switch"
              aria-checked={Boolean(consent[opt.key])}
              className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer shrink-0 ${consent[opt.key] ? 'bg-sage-500' : 'bg-cream-300'}`}
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${consent[opt.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleContinue} disabled={saving} className="flex-1">
          <Check size={16} /> Continue with selected settings
        </Button>
        <Button variant="ghost" onClick={handleSkip} disabled={saving}>
          Use FocusBridge without personalization
        </Button>
      </div>
      <p className="text-xs text-text-muted mt-3 text-center">
        Your tasks and projects always work, with or without tracking.
      </p>
    </Card>
  );
}