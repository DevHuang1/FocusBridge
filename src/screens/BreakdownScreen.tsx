import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TypingIndicator } from '../components/TypingIndicator';
import { Clock, ArrowRight, Minus, Plus, MoreHorizontal, ChevronLeft, Pencil } from 'lucide-react';
import { useState } from 'react';

export function BreakdownScreen() {
  const { currentSession, startStep, setScreen, aiTyping, updateStepTime, updateStepTitle } = useAppStore();
  const [editingStep, setEditingStep] = useState<string | null>(null);

  if (!currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => setScreen('home')}>Go back</Button>
      </div>
    );
  }

  const firstPendingIdx = currentSession.steps.findIndex(s => s.status === 'pending');

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-lg"
      >
        <button
          onClick={() => setScreen('home')}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-8 cursor-pointer"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-sm text-text-muted mb-2 uppercase tracking-wide font-medium">Your goal</p>
          <h1 className="font-serif text-3xl md:text-4xl text-text-primary leading-tight">
            {currentSession.goalTitle}
          </h1>
        </motion.div>

        {aiTyping ? (
          <TypingIndicator label="Breaking this down" />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sage-500 font-medium mb-6 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sage-400" />
              Let's make this smaller.
            </motion.p>

            <div className="space-y-3 mb-8">
              {currentSession.steps.map((step, i) => {
                const isCompleted = step.status === 'completed';
                const isStuck = step.status === 'stuck';
                const isSkipped = step.status === 'skipped';
                const isEditing = editingStep === step.id;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 * i + 0.4 }}
                  >
                    <Card
                      padding="sm"
                      className={`${isCompleted ? 'opacity-50' : ''} ${isStuck ? 'opacity-40' : ''} ${isSkipped ? 'opacity-30' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                          isCompleted ? 'bg-sage-100 text-sage-600' : 'bg-cream-100 text-text-muted'
                        }`}>
                          {isCompleted ? '\u2713' : i + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <input
                              autoFocus
                              defaultValue={step.title}
                              className="w-full bg-transparent text-sm font-medium text-text-primary focus:outline-none border-b border-sage-300 pb-0.5"
                              onBlur={(e) => {
                                updateStepTitle(step.id, e.target.value);
                                setEditingStep(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              }}
                            />
                          ) : (
                            <p className="text-sm font-medium text-text-primary truncate">
                              {step.title}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateStepTime(step.id, step.durationMinutes - 1)}
                                className="p-1 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"
                              >
                                <Minus size={14} className="text-text-muted" />
                              </button>
                              <span className="text-xs text-text-muted w-10 text-center">{step.durationMinutes} min</span>
                              <button
                                onClick={() => updateStepTime(step.id, step.durationMinutes + 1)}
                                className="p-1 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"
                              >
                                <Plus size={14} className="text-text-muted" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="flex items-center gap-1 text-xs text-text-muted bg-cream-100 px-2 py-1 rounded-full">
                                <Clock size={12} />
                                {step.durationMinutes} min
                              </span>
                              <button
                                onClick={() => setEditingStep(isEditing ? null : step.id)}
                                className="p-1 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"
                              >
                                {isEditing ? <MoreHorizontal size={14} className="text-text-muted" /> : <Pencil size={12} className="text-text-muted" />}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + currentSession.steps.length * 0.08 }}
              className="space-y-3"
            >
              {firstPendingIdx >= 0 && (
                <Button onClick={() => startStep(firstPendingIdx)} size="lg" className="w-full">
                  Start first step — {currentSession.steps[firstPendingIdx].durationMinutes} min
                  <ArrowRight size={18} />
                </Button>
              )}

              <div className="flex gap-3 justify-center">
                <Button variant="ghost" size="sm" onClick={() => useAppStore.getState().makeStepSmaller()}>
                  Make it smaller
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setScreen('home')}>
                  Start over
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
