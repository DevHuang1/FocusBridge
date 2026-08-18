import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { TextInput } from '../components/TextInput';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CheckInBanner } from '../components/CheckInBanner';
import { ProgressBar } from '../components/ProgressBar';
import { ArrowRight, Coffee, Zap, Target } from 'lucide-react';
import { format } from 'date-fns';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const { generateBreakdown, currentSession, checkInMessage, dismissCheckIn, profile, aiTyping } = useAppStore();

  const handleGoalSubmit = (goal: string) => {
    generateBreakdown(goal);
  };

  const completedSteps = currentSession?.steps.filter(s => s.status === 'completed').length ?? 0;
  const totalSteps = currentSession?.steps.length ?? 0;
  const pendingSteps = currentSession?.steps.filter(s => s.status === 'pending') ?? [];
  const hasActiveSession = currentSession && pendingSteps.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <CheckInBanner message={checkInMessage} onDismiss={dismissCheckIn} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 max-w-xl"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-sage-50 text-sage-500 rounded-full text-sm font-medium mb-6"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-sage-400" />
            Focus Bridge
          </motion.div>

          <h1 className="font-serif text-4xl md:text-5xl text-text-primary mb-4 leading-tight">
            {getGreeting()}.
          </h1>
          <p className="text-xl text-text-secondary">
            What's on your mind?
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-xl mb-12"
        >
          {aiTyping ? (
            <div className="bg-surface border-2 border-cream-200 rounded-3xl px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-sage-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <span className="text-text-muted">Let me think about that...</span>
              </div>
            </div>
          ) : (
            <TextInput onSubmit={handleGoalSubmit} />
          )}
        </motion.div>

        {hasActiveSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="w-full max-w-xl space-y-6"
          >
            <h2 className="text-lg font-medium text-text-primary flex items-center gap-2">
              <Target size={18} className="text-sage-500" />
              Today's Focus
            </h2>

            <Card>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-warm-50 rounded-xl shrink-0 mt-0.5">
                  <Zap size={18} className="text-warm-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-muted mb-1">
                    {format(new Date(), 'EEEE, MMMM d')}
                  </p>
                  <h3 className="text-lg font-medium text-text-primary truncate">
                    {currentSession!.goalTitle}
                  </h3>
                </div>
              </div>

              <ProgressBar progress={completedSteps / totalSteps} total={totalSteps} completed={completedSteps} className="mb-5" />

              <div className="space-y-2.5">
                {pendingSteps.slice(0, 3).map((step, i) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-center gap-3 px-4 py-3 bg-cream-50 rounded-xl"
                    >
                      <div className="w-5 h-5 rounded-full border-2 border-cream-300 shrink-0" />
                      <span className="flex-1 text-sm text-text-primary">{step.title}</span>
                      <span className="text-xs text-text-muted bg-cream-200 px-2 py-0.5 rounded-full">
                        {step.durationMinutes} min
                      </span>
                    </motion.div>
                ))}
                {pendingSteps.length > 3 && (
                  <p className="text-sm text-text-muted text-center py-1">
                    +{pendingSteps.length - 3} more steps
                  </p>
                )}
              </div>

              <div className="mt-5">
                <Button onClick={() => useAppStore.getState().startFocusSession()} className="w-full" size="lg">
                  Start next step
                  <ArrowRight size={18} />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {!hasActiveSession && !aiTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full max-w-xl"
          >
            <h2 className="text-lg font-medium text-text-primary mb-4 flex items-center gap-2">
              <Coffee size={18} className="text-warm-400" />
              Quick start
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { emoji: '📚', text: 'Study for an exam' },
                { emoji: '✍️', text: 'Write an essay' },
                { emoji: '🧹', text: 'Clean my room' },
                { emoji: '💻', text: 'Fix a bug' },
              ].map((suggestion) => (
                <Card key={suggestion.text} padding="sm" hover onClick={() => handleGoalSubmit(`I need to ${suggestion.text.toLowerCase()}`)}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{suggestion.emoji}</span>
                    <span className="text-sm font-medium text-text-primary">{suggestion.text}</span>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {profile.totalSessions > 0 && !hasActiveSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <button
              onClick={() => useAppStore.getState().setScreen('reflection')}
              className="text-sm text-text-muted hover:text-sage-500 transition-colors cursor-pointer"
            >
              View your progress →
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
