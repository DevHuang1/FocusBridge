import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/Button';
import { FeedbackPrompt } from '../components/FeedbackPrompt';
import { DistractionButton } from '../components/DistractionButton';
import { useTimer } from '../components/useTimer';
import { CircularProgress } from '../components/CircularProgress';
import { trackActivity } from '../lib/activity';
import { ChevronLeft, Pause, Play, CheckCircle, HelpCircle, Minimize2, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';

export function FocusScreen() {
  const currentSession = useAppStore((s) => s.currentSession);
  const completeStep = useAppStore((s) => s.completeStep);
  const navigateAfterStep = useAppStore((s) => s.navigateAfterStep);
  const skipStep = useAppStore((s) => s.skipStep);
  const markStuck = useAppStore((s) => s.markStuck);
  const makeStepSmaller = useAppStore((s) => s.makeStepSmaller);
  const makeStepEasier = useAppStore((s) => s.makeStepEasier);
  const provideFeedback = useAppStore((s) => s.provideFeedback);
  const setScreen = useAppStore((s) => s.setScreen);
  const logDistraction = useAppStore((s) => s.logDistraction);

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
      onFeedback={async (f) => { provideFeedback(f); setShowFeedback(false); await navigateAfterStep(); }}
      showFeedback={showFeedback}
      showOptions={showOptions}
      onToggleOptions={() => setShowOptions(!showOptions)}
      onLogDistraction={logDistraction}
    />
  );
}

interface FocusContentProps {
  step: { id: string; title: string; durationMinutes: number; status: string };
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
}

function FocusContent({ step, onComplete, onStuck, onSkip, onMakeSmaller, onMakeEasier, onFeedback, showFeedback, showOptions, onToggleOptions, onLogDistraction }: FocusContentProps) {
  const setScreen = useAppStore((s) => s.setScreen);
  const timer = useTimer(step.durationMinutes);

  useEffect(() => {
    if (timer.isComplete) onComplete();
  }, [timer.isComplete]);

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
              <span className="text-xs text-text-muted mt-1">{step.durationMinutes} min</span>
            </div>
          </div>

          <h2 className="font-serif text-2xl md:text-3xl text-text-primary mb-2 leading-snug px-4">{step.title}</h2>
          <p className="text-text-muted text-sm mb-10">Just focus on this one thing.</p>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <Button onClick={() => {
                if (timer.isRunning) {
                  trackActivity('focus_session_paused', { properties: { elapsedSeconds: Math.round(timer.elapsedSeconds) } });
                  timer.pause();
                } else {
                  trackActivity('focus_session_resumed', {});
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

            <DistractionButton onLog={onLogDistraction} />
          </div>
        </div>
      )}
    </div>
  );
}
