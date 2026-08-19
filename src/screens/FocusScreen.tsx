import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/Button';
import { FeedbackPrompt } from '../components/FeedbackPrompt';
import { DistractionButton } from '../components/DistractionButton';
import { useTimer } from '../components/useTimer';
import { CircularProgress } from '../components/CircularProgress';
import { trackActivity } from '../lib/activity';
import { ChevronLeft, Pause, Play, CheckCircle, HelpCircle, Minimize2, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { FOCUS_PRESETS, type FocusPresetId, type ParkedStatus } from '../types';

function defaultPresetForMinutes(minutes: number): FocusPresetId {
  const countdown = FOCUS_PRESETS.filter((p) => p.mode === 'countdown');
  let best = countdown[0];
  let bestDiff = Infinity;
  for (const p of countdown) {
    const diff = Math.abs(p.minutes - minutes);
    if (diff < bestDiff) { bestDiff = diff; best = p; }
  }
  return best.id;
}

export function FocusScreen() {
  const currentSession = useAppStore((s) => s.currentSession);
  const completeStep = useAppStore((s) => s.completeStep);
  const showAfterTransition = useAppStore((s) => s.showAfterTransition);
  const skipStep = useAppStore((s) => s.skipStep);
  const markStuck = useAppStore((s) => s.markStuck);
  const makeStepSmaller = useAppStore((s) => s.makeStepSmaller);
  const makeStepEasier = useAppStore((s) => s.makeStepEasier);
  const provideFeedback = useAppStore((s) => s.provideFeedback);
  const setScreen = useAppStore((s) => s.setScreen);
  const logDistraction = useAppStore((s) => s.logDistraction);
  const parkDistraction = useAppStore((s) => s.parkDistraction);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => setScreen('dashboard')}>Go back</Button>
      </div>
    );
  }

  const step = currentSession.steps[currentSession.currentStepIndex];

  if (!step || step.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => setScreen('dashboard')}>Go back</Button>
      </div>
    );
  }

  return (
    <FocusContent
      step={step}
      onComplete={async () => { await completeStep(); setShowFeedback(true); }}
      onStuck={() => { markStuck(); setShowOptions(false); }}
      onSkip={skipStep}
      onMakeSmaller={() => { makeStepSmaller(); setShowOptions(false); }}
      onMakeEasier={() => { makeStepEasier(); setShowOptions(false); }}
      onFeedback={async (f) => { provideFeedback(f); setShowFeedback(false); showAfterTransition(); }}
      showFeedback={showFeedback}
      showOptions={showOptions}
      onToggleOptions={() => setShowOptions(!showOptions)}
      onLogDistraction={logDistraction}
      onParkDistraction={parkDistraction}
    />
  );
}

interface FocusContentProps {
  step: { id: string; title: string; durationMinutes: number; status: 'pending' | 'active' | 'completed' | 'skipped' | 'stuck' };
  onComplete: () => void;
  onStuck: () => void;
  onSkip: () => void;
  onMakeSmaller: () => void;
  onMakeEasier: () => void;
  onFeedback: (f: any) => void;
  showFeedback: boolean;
  showOptions: boolean;
  onToggleOptions: () => void;
  onLogDistraction: (label: string) => void;
  onParkDistraction: (label: string, status: ParkedStatus) => void;
}

function FocusContent({ step, onComplete, onStuck, onSkip, onMakeSmaller, onMakeEasier, onFeedback, showFeedback, showOptions, onToggleOptions, onLogDistraction, onParkDistraction }: FocusContentProps) {
  const setScreen = useAppStore((s) => s.setScreen);
  const transitionPreset = useAppStore((s) => s.transition?.presetId);
  const [presetId, setPresetId] = useState<FocusPresetId>(() => transitionPreset ?? defaultPresetForMinutes(step.durationMinutes));
  const preset = FOCUS_PRESETS.find((p) => p.id === presetId) ?? FOCUS_PRESETS[0];
  const timer = useTimer(preset.minutes, preset.mode);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    if (timer.isComplete) onComplete();
  }, [timer.isComplete]);

  const logAndRecover = (label: string) => {
    onLogDistraction(label);
    setShowRecovery(true);
  };

  const parkAndRecover = (label: string, status: ParkedStatus) => {
    onParkDistraction(label, status);
    setShowRecovery(true);
  };

  useEffect(() => {
    if (timer.isComplete) onComplete();
  }, [timer.isComplete]);

  const selectPreset = (id: FocusPresetId) => {
    const p = FOCUS_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    timer.reset();
    trackActivity('focus_preset_selected', {
      properties: { preset: p.id, minutes: p.minutes, mode: p.mode },
    });
  };

  const isBeforeStart = timer.elapsedFormatted === '0:00' && !timer.isRunning;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {showFeedback ? (
        <FeedbackPrompt onFeedback={onFeedback} />
      ) : (
        <div className="w-full max-w-lg text-center">
          <button onClick={() => setScreen('dashboard')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-12 cursor-pointer mx-auto">
            <ChevronLeft size={16} /> Back
          </button>

          <div className="relative inline-block mb-8">
            <CircularProgress progress={timer.progress} size={160} strokeWidth={6} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-light text-text-primary tabular-nums">{timer.formatted}</span>
              <span className="text-xs text-text-muted mt-1">
                {preset.mode === 'countup'
                  ? (preset.id === 'until_done' ? 'until done' : 'flexible')
                  : `${preset.minutes} min`}
              </span>
            </div>
          </div>

          <h2 className="font-serif text-2xl md:text-3xl text-text-primary mb-2 leading-snug px-4">{step.title}</h2>
          <p className="text-text-muted text-sm mb-10">Just focus on this one thing.</p>

          {isBeforeStart && (
            <div className="mb-8">
              <p className="text-xs text-text-muted mb-3 uppercase tracking-wide font-medium">Choose a focus length</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {FOCUS_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPreset(p.id)}
                    title={p.desc}
                    className={`px-3.5 py-2 rounded-2xl border-2 text-xs font-medium transition-all cursor-pointer ${presetId === p.id ? 'shadow-sm' : 'border-cream-200/70 hover:border-cream-300'}`}
                    style={presetId === p.id ? { borderColor: 'var(--color-theme-primary)', backgroundColor: 'var(--color-theme-surface)', color: 'var(--color-theme-primary)' } : undefined}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showRecovery && (
            <div className="mb-8 animate-fade-in-up">
              <div className="bg-cream-50/70 border border-cream-200 rounded-2xl p-4 max-w-sm mx-auto">
                <p className="text-sm text-text-primary font-medium mb-1">You're back. That's okay.</p>
                <p className="text-xs text-text-muted mb-3">Would you like to return to this step, make it smaller, or switch to another step?</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button size="sm" onClick={() => setShowRecovery(false)}>Return to this step</Button>
                  <Button size="sm" variant="soft" onClick={() => { onMakeSmaller(); setShowRecovery(false); }}><Minimize2 size={14} />Make it smaller</Button>
                  <Button size="sm" variant="soft" onClick={() => { setScreen('work_tasks'); }}>Pick another step</Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <Button onClick={() => {
                if (timer.isRunning) {
                  trackActivity('focus_session_paused', { properties: { elapsedSeconds: Math.round(timer.elapsedSeconds) } });
                  timer.pause();
                } else {
                  if (isBeforeStart) {
                    trackActivity('focus_session_started', { properties: { durationMinutes: preset.mode === 'countup' ? 0 : preset.minutes } });
                  } else {
                    trackActivity('focus_session_resumed', {});
                  }
                  timer.start();
                }
              }} size="lg" className="min-w-[160px]">
                {timer.isRunning ? <><Pause size={18} />Pause</> : <><Play size={18} />{timer.elapsedFormatted === '0:00' ? 'Start' : 'Resume'}</>}
              </Button>
              <Button onClick={onComplete} variant="secondary" size="lg"><CheckCircle size={18} />Done</Button>
            </div>

            <Button onClick={onStuck} variant="soft" size="lg" className="w-full max-w-xs"><HelpCircle size={18} />I'm stuck</Button>

            <div className="relative">
              <Button onClick={onToggleOptions} variant="ghost" size="sm"><MoreHorizontal size={16} />More options</Button>
              {showOptions && (
                <div className="flex gap-2 mt-2 justify-center flex-wrap">
                  <Button variant="ghost" size="sm" onClick={onMakeSmaller}><Minimize2 size={14} />Make smaller</Button>
                  <Button variant="ghost" size="sm" onClick={onMakeEasier}>Make easier</Button>
                  <Button variant="ghost" size="sm" onClick={onSkip}>Skip</Button>
                </div>
              )}
            </div>

            <DistractionButton onLog={logAndRecover} onPark={parkAndRecover} />
          </div>
        </div>
      )}
    </div>
  );
}
