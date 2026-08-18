import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/Button';
import { FeedbackPrompt } from '../components/FeedbackPrompt';
import { useTimer } from '../components/useTimer';
import { CircularProgress } from '../components/CircularProgress';
import { ChevronLeft, Pause, Play, CheckCircle, HelpCircle, Minimize2, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';

export function FocusScreen() {
  const { currentSession, completeStep, skipStep, markStuck, makeStepSmaller, makeStepEasier, provideFeedback, setScreen } = useAppStore();
  const [showFeedback, setShowFeedback] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => setScreen('home')}>Go back</Button>
      </div>
    );
  }

  const step = currentSession.steps[currentSession.currentStepIndex];

  if (!step || step.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => setScreen('home')}>Go back</Button>
      </div>
    );
  }

  return (
    <FocusContent
      step={step}
      onComplete={() => {
        completeStep();
        setShowFeedback(true);
      }}
      onStuck={() => {
        markStuck();
        setShowOptions(false);
      }}
      onSkip={skipStep}
      onMakeSmaller={() => { makeStepSmaller(); setShowOptions(false); }}
      onMakeEasier={() => { makeStepEasier(); setShowOptions(false); }}
      onFeedback={(f) => { provideFeedback(f); setShowFeedback(false); }}
      showFeedback={showFeedback}
      showOptions={showOptions}
      onToggleOptions={() => setShowOptions(!showOptions)}
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
}

function FocusContent({ step, onComplete, onStuck, onSkip, onMakeSmaller, onMakeEasier, onFeedback, showFeedback, showOptions, onToggleOptions }: FocusContentProps) {
  const { setScreen } = useAppStore();
  const timer = useTimer(step.durationMinutes);

  useEffect(() => {
    if (timer.isComplete) {
      onComplete();
    }
  }, [timer.isComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <AnimatePresence mode="wait">
        {showFeedback ? (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <FeedbackPrompt onFeedback={onFeedback} />
          </motion.div>
        ) : (
          <motion.div
            key="focus"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-lg text-center"
          >
            <button
              onClick={() => setScreen('home')}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-12 cursor-pointer mx-auto"
            >
              <ChevronLeft size={16} />
              Back
            </button>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="relative inline-block mb-8"
            >
              <CircularProgress progress={timer.progress} size={160} strokeWidth={6} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-light text-text-primary tabular-nums">{timer.formatted}</span>
                <span className="text-xs text-text-muted mt-1">{step.durationMinutes} min</span>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-serif text-2xl md:text-3xl text-text-primary mb-2 leading-snug px-4"
            >
              {step.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-text-muted text-sm mb-10"
            >
              Just focus on this one thing.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex items-center gap-4">
                <Button
                  onClick={timer.isRunning ? timer.pause : timer.start}
                  size="lg"
                  className="min-w-[160px]"
                >
                  {timer.isRunning ? (
                    <>
                      <Pause size={18} />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      {timer.elapsedFormatted === '0:00' ? 'Start' : 'Resume'}
                    </>
                  )}
                </Button>

                <Button
                  onClick={onComplete}
                  variant="secondary"
                  size="lg"
                >
                  <CheckCircle size={18} />
                  Done
                </Button>
              </div>

              <Button
                onClick={onStuck}
                variant="soft"
                size="lg"
                className="w-full max-w-xs"
              >
                <HelpCircle size={18} />
                I'm stuck
              </Button>

              <div className="relative">
                <Button
                  onClick={onToggleOptions}
                  variant="ghost"
                  size="sm"
                >
                  <MoreHorizontal size={16} />
                  More options
                </Button>

                <AnimatePresence>
                  {showOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2 mt-2 justify-center">
                        <Button variant="ghost" size="sm" onClick={onMakeSmaller}>
                          <Minimize2 size={14} />
                          Make smaller
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onMakeEasier}>
                          Make easier
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onSkip}>
                          Skip
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
