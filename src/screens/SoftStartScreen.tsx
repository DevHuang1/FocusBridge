import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AnimatedItem } from '../components/CalmMotion';
import { CircularProgress } from '../components/CircularProgress';
import { useTimer } from '../components/useTimer';
import { trackActivity } from '../lib/activity';
import { ChevronLeft, FolderOpen, Package, PenLine, Pause, Play, CheckCircle, ArrowRight, X, Minimize2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SoftStartAlternative, SoftStartType } from '../types';

const typeMeta: Record<SoftStartType, { label: string; icon: React.ReactNode }> = {
  open: { label: 'Open', icon: <FolderOpen size={18} /> },
  prepare: { label: 'Prepare', icon: <Package size={18} /> },
  touch: { label: 'Touch the task', icon: <PenLine size={18} /> },
};

export function SoftStartScreen() {
  const softStart = useAppStore((s) => s.softStart);
  const chooseSoftStartAction = useAppStore((s) => s.chooseSoftStartAction);
  const continueAfterSoftStart = useAppStore((s) => s.continueAfterSoftStart);
  const stopSoftStartWithCredit = useAppStore((s) => s.stopSoftStartWithCredit);
  const makeSoftStartSmaller = useAppStore((s) => s.makeSoftStartSmaller);
  const cancelSoftStart = useAppStore((s) => s.cancelSoftStart);
  const startStep = useAppStore((s) => s.startStep);

  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    if (softStart?.phase === 'question') setShowSkip(false);
  }, [softStart?.phase]);

  if (!softStart) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={cancelSoftStart}>Back</Button>
      </div>
    );
  }

  const onBack = () => {
    if (softStart.phase === 'starter') {
      useAppStore.setState({ softStart: { ...softStart, phase: 'question', chosenLabel: null } });
    } else {
      cancelSoftStart();
    }
  };

  const goToResult = () => {
    useAppStore.setState({ softStart: { ...softStart, phase: 'result' } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 md:py-12">
      <div className="w-full max-w-lg">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-10 cursor-pointer">
          <ChevronLeft size={16} /> Back
        </button>

        {softStart.phase === 'question' && (
          <QuestionPhase
            stepTitle={softStart.stepTitle}
            alternatives={softStart.alternatives}
            onChoose={chooseSoftStartAction}
            onSkip={() => { trackSoftStartSkip(); startStep(softStart.stepIndex); }}
            showSkip={showSkip}
            setShowSkip={setShowSkip}
          />
        )}

        {softStart.phase === 'starter' && (
          <StarterPhase
            label={softStart.chosenLabel ?? softStart.stepTitle}
            minutes={softStart.starterMinutes}
            onDone={goToResult}
            onStop={stopSoftStartWithCredit}
            onSmaller={makeSoftStartSmaller}
          />
        )}

        {softStart.phase === 'result' && (
          <ResultPhase
            label={softStart.chosenLabel ?? softStart.stepTitle}
            stepTitle={softStart.stepTitle}
            onContinue={continueAfterSoftStart}
            onStop={stopSoftStartWithCredit}
            onSmaller={makeSoftStartSmaller}
          />
        )}
      </div>
    </div>
  );
}

function trackSoftStartSkip() {
  trackActivity('soft_start_completed', { properties: { outcome: 'skip', starterMinutes: 0 } });
}

function QuestionPhase({
  stepTitle,
  alternatives,
  onChoose,
  onSkip,
  showSkip,
  setShowSkip,
}: {
  stepTitle: string;
  alternatives: SoftStartAlternative[];
  onChoose: (a: SoftStartAlternative) => void;
  onSkip: () => void;
  showSkip: boolean;
  setShowSkip: (v: boolean) => void;
}) {
  return (
    <div>
      <AnimatedItem>
        <p className="text-sm text-text-muted mb-2 uppercase tracking-wide font-medium">Starting gently</p>
        <h1 className="font-serif text-2xl md:text-3xl text-text-primary mb-2 leading-snug">{stepTitle}</h1>
        <p className="text-text-secondary mb-8">What is the smallest visible action that gets this moving?</p>
      </AnimatedItem>

      <div className="space-y-3">
        {alternatives.length === 0 ? (
          <div className="flex items-center gap-3 p-5 rounded-[1.25rem] bg-surface border border-cream-200/50">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full animate-pulse-soft" style={{ backgroundColor: 'var(--color-theme-primary)', animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
            <span className="text-sm text-text-muted">Thinking of a tiny first move...</span>
          </div>
        ) : (
          alternatives.map((alt, i) => (
            <AnimatedItem key={alt.type} index={i + 1}>
              <Card padding="sm" hover onClick={() => onChoose(alt)}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-theme-surface)', color: 'var(--color-theme-primary)' }}>
                    {typeMeta[alt.type].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-muted mb-0.5">{typeMeta[alt.type].label}</p>
                    <p className="text-sm font-medium text-text-primary leading-snug">{alt.label}</p>
                  </div>
                  <span className="text-xs text-text-muted bg-cream-100 px-2.5 py-1 rounded-full shrink-0">{alt.minutes} min</span>
                </div>
              </Card>
            </AnimatedItem>
          ))
        )}
      </div>

      <div className="mt-8 text-center">
        {showSkip ? (
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Start the full timer now <ArrowRight size={14} />
          </Button>
        ) : (
          <button onClick={() => setShowSkip(true)} className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
            I'd rather just start the full timer
          </button>
        )}
      </div>
    </div>
  );
}

function StarterPhase({
  label,
  minutes,
  onDone,
  onStop,
  onSmaller,
}: {
  label: string;
  minutes: number;
  onDone: () => void;
  onStop: () => void;
  onSmaller: () => void;
}) {
  const timer = useTimer(minutes);

  useEffect(() => {
    if (timer.isComplete) {
      onDone();
    }
  }, [timer.isComplete]);

  return (
    <div className="text-center">
      <AnimatedItem>
        <p className="text-sm text-text-muted mb-2 uppercase tracking-wide font-medium">Just this tiny thing</p>
        <h2 className="font-serif text-2xl md:text-3xl text-text-primary mb-10 leading-snug px-4">{label}</h2>
      </AnimatedItem>

      <AnimatedItem index={1}>
        <div className="relative inline-block mb-8">
          <CircularProgress progress={timer.progress} size={150} strokeWidth={5} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-light text-text-primary tabular-nums">{timer.formatted}</span>
            <span className="text-xs text-text-muted mt-1">{minutes} min starter</span>
          </div>
        </div>
      </AnimatedItem>

      <AnimatedItem index={2}>
        <p className="text-text-muted text-sm mb-8">No pressure. Just begin.</p>

        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            className="min-w-[160px]"
            onClick={() => {
              if (timer.isRunning) {
                timer.pause();
              } else {
                timer.start();
              }
            }}
          >
            {timer.isRunning ? <><Pause size={18} />Pause</> : <><Play size={18} />{timer.elapsedFormatted === '0:00' ? 'Start' : 'Resume'}</>}
          </Button>

          <Button variant="secondary" size="lg" onClick={onDone}>
            <CheckCircle size={18} />That's enough for now
          </Button>

          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="ghost" size="sm" onClick={onSmaller}><Minimize2 size={14} />Make it smaller</Button>
            <Button variant="ghost" size="sm" onClick={onStop}><X size={14} />Stop — I began</Button>
          </div>
        </div>
      </AnimatedItem>
    </div>
  );
}

function ResultPhase({
  label,
  stepTitle,
  onContinue,
  onStop,
  onSmaller,
}: {
  label: string;
  stepTitle: string;
  onContinue: () => void;
  onStop: () => void;
  onSmaller: () => void;
}) {
  return (
    <div>
      <AnimatedItem>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-theme-surface)', color: 'var(--color-theme-primary)' }}>
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">You got moving.</p>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        </div>
        <p className="text-text-secondary mb-8">What would you like to do now?</p>
      </AnimatedItem>

      <div className="space-y-3">
        <AnimatedItem index={1}>
          <Button onClick={onContinue} size="lg" className="w-full">
            Continue — start the full step <ArrowRight size={18} />
          </Button>
        </AnimatedItem>
        <AnimatedItem index={2}>
          <Button variant="secondary" size="lg" className="w-full" onClick={onSmaller}>
            <Minimize2 size={18} />Make it smaller first
          </Button>
        </AnimatedItem>
        <AnimatedItem index={3}>
          <Button variant="ghost" size="lg" className="w-full" onClick={onStop}>
            <X size={18} />Stop here — I already began
          </Button>
        </AnimatedItem>
      </div>

      <p className="text-xs text-text-muted text-center mt-6">Stopping counts too. You started "{stepTitle}", and that is real progress.</p>
    </div>
  );
}