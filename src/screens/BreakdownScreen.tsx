import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/Button';
import { TypingIndicator } from '../components/TypingIndicator';
import { TreeBreakdown } from '../components/TreeBreakdown';
import { ArrowRight, ChevronLeft, Sparkles } from 'lucide-react';

export function BreakdownScreen() {
  const { currentSession, startStep, setScreen, isBreakingDown, breakdownText, breakdownGoal, goalInput } = useAppStore();

  if (!currentSession && !isBreakingDown) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-xl text-text-primary mb-6 font-serif">What are you working on?</h2>
        <div className="w-full max-w-lg space-y-4">
          <textarea 
            className="w-full p-4 rounded-2xl bg-cream-50 border border-cream-200 text-text-primary focus:outline-none focus:ring-2 focus:ring-sage-300 resize-none"
            rows={3}
            placeholder="e.g. Write a research paper on climate change..."
            value={goalInput}
            onChange={(e) => useAppStore.getState().setGoalInput(e.target.value)}
          />
          <Button 
            size="lg" 
            className="w-full" 
            onClick={() => goalInput && breakdownGoal(goalInput)}
          >
            <Sparkles size={18} className="mr-2" />
            Break it down
          </Button>
        </div>
      </div>
    );
  }

  if (!currentSession) return null;

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

        {isBreakingDown ? (
          <div className="space-y-4">
            <TypingIndicator label="Thinking" />
            <div className="p-4 bg-cream-50/50 rounded-2xl border border-cream-100 min-h-[100px]">
              <p className="text-sm text-text-secondary font-mono whitespace-pre-wrap leading-relaxed">
                {breakdownText}<span className="animate-pulse text-sage-400">|</span>
              </p>
            </div>
          </div>
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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <TreeBreakdown
                goalTitle={currentSession.goalTitle}
                steps={currentSession.steps}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + currentSession.steps.length * 0.1 }}
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
