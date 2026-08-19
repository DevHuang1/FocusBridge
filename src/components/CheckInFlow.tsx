import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { trackActivity } from '../lib/activity';
import type { ArrivalState, SupportPreference, DailyCheckIn } from '../types';
import { Check, ChevronRight, X } from 'lucide-react';

const arrivalOptions: { value: ArrivalState; label: string; emoji: string }[] = [
  { value: 'calm_and_ready', label: 'Calm and ready', emoji: '🌿' },
  { value: 'focused_low_energy', label: 'Focused but low on energy', emoji: '🔋' },
  { value: 'restless', label: 'Restless or having trouble settling in', emoji: '🌊' },
  { value: 'overwhelmed', label: 'Overwhelmed by everything on my list', emoji: '☁️' },
  { value: 'unclear_mixed', label: 'Unclear or emotionally mixed', emoji: '🌀' },
  { value: 'tired_gentle', label: 'Tired and needing a very gentle start', emoji: '🌙' },
  { value: 'not_sure', label: "I'm not sure yet", emoji: '🤔' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', emoji: '–' },
];

const supportOptions: { value: SupportPreference; label: string; emoji: string }[] = [
  { value: 'choose_next_step', label: 'Help me choose one small next step', emoji: '👉' },
  { value: 'break_down_task', label: 'Break down a task for me', emoji: '✂️' },
  { value: 'realistic_plan', label: 'Help me make a realistic plan', emoji: '📋' },
  { value: 'quiet_minimal', label: 'Keep things quiet and minimal', emoji: '🤫' },
  { value: 'encouragement', label: 'Give me a little encouragement', emoji: '💛' },
  { value: 'no_guidance', label: 'Let me work without extra guidance', emoji: '🧘' },
  { value: 'record_feeling', label: 'I only want to record how I feel', emoji: '📝' },
];

interface CheckInFlowProps {
  onComplete: (checkIn: DailyCheckIn) => void;
  onSkip: () => void;
}

export function CheckInFlow({ onComplete, onSkip }: CheckInFlowProps) {
  const [step, setStep] = useState<'arrival' | 'support' | 'context'>('arrival');
  const [arrival, setArrival] = useState<ArrivalState | null>(null);
  const [support, setSupport] = useState<SupportPreference | null>(null);
  const [contextNote, setContextNote] = useState('');

  const handleArrivalSelect = (value: ArrivalState) => { setArrival(value); setStep('support'); };
  const handleSupportSelect = (value: SupportPreference) => { setSupport(value); setStep('context'); };
  const handleSubmit = () => {
    if (!arrival || !support) return;
    trackActivity('daily_check_in_completed', {
      properties: { arrivalState: arrival, supportPreference: support },
    });
    onComplete({
      id: `ci-${Date.now()}`, userId: '', date: new Date().toISOString().slice(0, 10),
      arrivalState: arrival, supportPreference: support, contextNote: contextNote || undefined,
      createdAt: new Date().toISOString(),
    });
  };

  const getHour = () => new Date().getHours();
  const greeting = getHour() < 12 ? 'Good morning' : getHour() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="flex justify-end mb-4">
          <button onClick={() => { trackActivity('daily_check_in_skipped', {}); onSkip(); }} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer">
            Skip for today <X size={14} />
          </button>
        </div>

        {step === 'arrival' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-3">{greeting}.</h1>
              <p className="text-text-secondary text-lg leading-relaxed max-w-md mx-auto">Before we decide what to work on, how are you arriving today?</p>
              <p className="text-text-muted text-sm mt-2">You can choose the option that feels closest, or skip entirely. There is no right answer.</p>
            </div>
            <div className="space-y-2">
              {arrivalOptions.map((opt) => (
                <button key={opt.value} onClick={() => handleArrivalSelect(opt.value)} className="w-full p-4 rounded-2xl border-2 border-cream-200 hover:border-theme-primary text-left transition-all cursor-pointer flex items-center gap-3 group">
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="flex-1 text-sm font-medium text-text-primary">{opt.label}</span>
                  <ChevronRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'support' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl md:text-3xl text-text-primary mb-3">What kind of support would feel most useful right now?</h2>
            </div>
            <div className="space-y-2">
              {supportOptions.map((opt) => (
                <button key={opt.value} onClick={() => handleSupportSelect(opt.value)} className="w-full p-4 rounded-2xl border-2 border-cream-200 hover:border-theme-primary text-left transition-all cursor-pointer flex items-center gap-3 group">
                  <span className="text-lg">{opt.emoji}</span>
                  <span className="flex-1 text-sm font-medium text-text-primary">{opt.label}</span>
                  <ChevronRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'context' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="font-serif text-2xl md:text-3xl text-text-primary mb-3">Anything else about today?</h2>
              <p className="text-text-muted text-sm">Optional context that might help FocusBridge support you today.</p>
            </div>
            <Card className="mb-6">
              <textarea className="w-full bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none resize-none min-h-[100px]" placeholder="e.g., I have a deadline at 3pm, I didn't sleep well, I'm feeling motivated..." value={contextNote} onChange={(e) => setContextNote(e.target.value)} autoFocus />
            </Card>
            <div className="flex gap-3">
              <Button onClick={handleSubmit} className="flex-1"><Check size={16} />Start my day</Button>
              <Button variant="ghost" onClick={() => { trackActivity('daily_check_in_skipped', {}); onSkip(); }}>Skip</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CheckInSummary({ checkIn, onClear }: { checkIn: DailyCheckIn; onClear?: () => void }) {
  const arrivalLabel = arrivalOptions.find((o) => o.value === checkIn.arrivalState)?.label ?? checkIn.arrivalState;
  const arrivalEmoji = arrivalOptions.find((o) => o.value === checkIn.arrivalState)?.emoji ?? '';
  const supportLabel = supportOptions.find((o) => o.value === checkIn.supportPreference)?.label ?? checkIn.supportPreference;

  return (
    <Card padding="sm">
      <div className="flex items-start gap-3">
        <span className="text-lg">{arrivalEmoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{arrivalLabel}</p>
          <p className="text-xs text-text-muted mt-0.5">{supportLabel}</p>
          {checkIn.contextNote && <p className="text-xs text-text-secondary mt-1 italic">"{checkIn.contextNote}"</p>}
        </div>
        {onClear && <button onClick={onClear} className="p-1 rounded-lg hover:bg-cream-200 cursor-pointer"><X size={12} className="text-text-muted" /></button>}
      </div>
    </Card>
  );
}
