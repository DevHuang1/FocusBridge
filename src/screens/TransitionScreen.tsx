import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AnimatedItem } from '../components/CalmMotion';
import { ChevronLeft, Package, StickyNote, CheckCircle, ArrowRight, Coffee, ListRestart, X, NotebookPen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FOCUS_PRESETS, type FocusPresetId } from '../types';

export function TransitionScreen() {
  const transition = useAppStore((s) => s.transition);
  const currentSession = useAppStore((s) => s.currentSession);
  const beginFocusFromTransition = useAppStore((s) => s.beginFocusFromTransition);
  const setTransitionPreset = useAppStore((s) => s.setTransitionPreset);
  const finishAfterTransition = useAppStore((s) => s.finishAfterTransition);
  const cancelTransition = useAppStore((s) => s.cancelTransition);

  const [materials, setMaterials] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [rememberNote, setRememberNote] = useState('');

  useEffect(() => {
    setMaterials('');
    setThoughts('');
    setRememberNote('');
  }, [transition?.phase, transition?.stepIndex]);

  if (!transition || !currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => useAppStore.getState().setScreen('dashboard')}>Back</Button>
      </div>
    );
  }

  if (transition.phase === 'before') {
    const step = currentSession.steps[transition.stepIndex];
    if (!step) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Button onClick={() => useAppStore.getState().setScreen('dashboard')}>Back</Button>
        </div>
      );
    }

    const currentPresetId: FocusPresetId = transition.presetId ?? defaultPresetForMinutes(step.durationMinutes);

    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-8 md:py-12">
        <div className="w-full max-w-lg">
          <button onClick={cancelTransition} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-10 cursor-pointer">
            <ChevronLeft size={16} /> Back
          </button>

          <AnimatedItem>
            <p className="text-sm text-text-muted mb-2 uppercase tracking-wide font-medium">Getting ready</p>
            <h1 className="font-serif text-2xl md:text-3xl text-text-primary mb-2 leading-snug">{step.title}</h1>
            <p className="text-text-secondary mb-8">A quiet moment before you begin.</p>
          </AnimatedItem>

          <div className="space-y-4">
            <AnimatedItem index={1}>
              <Card padding="sm">
                <div className="flex items-center gap-3 mb-2">
                  <Package size={16} style={{ color: 'var(--color-theme-primary)' }} />
                  <label className="text-sm font-medium text-text-primary">What do you need?</label>
                </div>
                <input
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="The document, a pen, the app you need..."
                  className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-cream-200 pb-1.5 focus:border-[var(--color-theme-primary)] transition-colors"
                />
              </Card>
            </AnimatedItem>

            <AnimatedItem index={2}>
              <Card padding="sm">
                <div className="flex items-center gap-3 mb-2">
                  <StickyNote size={16} style={{ color: 'var(--color-theme-primary)' }} />
                  <label className="text-sm font-medium text-text-primary">Anything on your mind?</label>
                </div>
                <input
                  value={thoughts}
                  onChange={(e) => setThoughts(e.target.value)}
                  placeholder="Set it aside here for later..."
                  className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-cream-200 pb-1.5 focus:border-[var(--color-theme-primary)] transition-colors"
                />
              </Card>
            </AnimatedItem>

            <AnimatedItem index={3}>
              <Card padding="sm">
                <div className="flex items-center gap-3 mb-3">
                  <Coffee size={16} style={{ color: 'var(--color-theme-primary)' }} />
                  <label className="text-sm font-medium text-text-primary">Session length</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setTransitionPreset(p.id)}
                      title={p.desc}
                      className={`px-3.5 py-2 rounded-2xl border-2 text-xs font-medium transition-all cursor-pointer ${currentPresetId === p.id ? 'shadow-sm' : 'border-cream-200/70 hover:border-cream-300'}`}
                      style={currentPresetId === p.id ? { borderColor: 'var(--color-theme-primary)', backgroundColor: 'var(--color-theme-surface)', color: 'var(--color-theme-primary)' } : undefined}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </Card>
            </AnimatedItem>
          </div>

          <AnimatedItem index={4}>
            <div className="mt-8">
              <Button
                size="lg"
                className="w-full"
                onClick={() => beginFocusFromTransition({ materials, thoughts, presetId: currentPresetId })}
              >
                Begin quietly <ArrowRight size={18} />
              </Button>
              <p className="text-xs text-text-muted text-center mt-3">You can skip the fields — just begin.</p>
            </div>
          </AnimatedItem>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 md:py-12">
      <div className="w-full max-w-lg">
        <AnimatedItem>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl" style={{ backgroundColor: 'var(--color-theme-surface)' }}>
              <CheckCircle size={20} style={{ color: 'var(--color-theme-primary)' }} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{transition.completedTitle ?? 'Step complete'}</p>
              <p className="text-xs text-text-muted">
                {transition.allDone
                  ? 'This goal is done.'
                  : `${transition.remainingCount} step${transition.remainingCount === 1 ? '' : 's'} remaining`}
              </p>
            </div>
          </div>
        </AnimatedItem>

        <AnimatedItem index={1}>
          <Card padding="sm" className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <NotebookPen size={16} style={{ color: 'var(--color-theme-primary)' }} />
              <label className="text-sm font-medium text-text-primary">What should you remember for next time?</label>
            </div>
            <textarea
              value={rememberNote}
              onChange={(e) => setRememberNote(e.target.value)}
              placeholder="One short note, if useful..."
              rows={2}
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border-b border-cream-200 pb-1.5 resize-none focus:border-[var(--color-theme-primary)] transition-colors"
            />
          </Card>
        </AnimatedItem>

        <div className="space-y-3">
          {!transition.allDone && (
            <AnimatedItem index={2}>
              <Button onClick={() => finishAfterTransition('continue', rememberNote)} size="lg" className="w-full">
                Continue to the next step <ArrowRight size={18} />
              </Button>
            </AnimatedItem>
          )}
          {transition.allDone && (
            <AnimatedItem index={2}>
              <Button onClick={() => finishAfterTransition('continue', rememberNote)} size="lg" className="w-full">
                Reflect on this goal <ArrowRight size={18} />
              </Button>
            </AnimatedItem>
          )}
          <AnimatedItem index={3}>
            <Button variant="secondary" size="lg" className="w-full" onClick={() => finishAfterTransition('break', rememberNote)}>
              <Coffee size={18} /> Take a break
            </Button>
          </AnimatedItem>
          {!transition.allDone && (
            <AnimatedItem index={4}>
              <Button variant="secondary" size="lg" className="w-full" onClick={() => finishAfterTransition('switch', rememberNote)}>
                <ListRestart size={18} /> Switch tasks
              </Button>
            </AnimatedItem>
          )}
          <AnimatedItem index={5}>
            <Button variant="ghost" size="lg" className="w-full" onClick={() => finishAfterTransition('stop', rememberNote)}>
              <X size={18} /> Stop for now
            </Button>
          </AnimatedItem>
        </div>
      </div>
    </div>
  );
}

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