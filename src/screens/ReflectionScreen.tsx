import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ChevronLeft, CheckCircle2, Clock, TrendingUp, Heart, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { aiService } from '../lib/ai';
import { SoftConfetti } from '../components/SoftConfetti';

export function ReflectionScreen() {
  const { currentSession, profile, setScreen, resetToHome, setSummary } = useAppStore();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const completedSteps = useMemo(() => currentSession?.steps.filter(s => s.status === 'completed') ?? [], [currentSession]);
  const isSessionDone = currentSession?.completedAt;
  const stuckSteps = useMemo(() => currentSession?.steps.filter(s => s.status === 'stuck') ?? [], [currentSession]);
  const totalMinutes = useMemo(() => completedSteps.reduce((sum, s) => sum + s.durationMinutes, 0), [completedSteps]);

  const recentEasy = profile.recentFeedback.filter(f => f === 'easy').length;
  const recentOkay = profile.recentFeedback.filter(f => f === 'okay').length;
  const recentHard = profile.recentFeedback.filter(f => f === 'too_much').length;

  useEffect(() => {
    if (currentSession && !currentSession.summary && !summaryLoading && isSessionDone) {
      setSummaryLoading(true);
      aiService.generateSessionSummary(currentSession)
        .then((summary) => {
          setSummary(summary);
          setAiSummary(summary);
        })
        .catch((e) => {
          console.error("Failed to generate summary", e);
        })
        .finally(() => {
          setSummaryLoading(false);
        });
    }
  }, [currentSession?.id]);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 md:py-16">
      <SoftConfetti active={!!isSessionDone} />
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-sage-50 rounded-3xl mb-5"
          >
            {isSessionDone ? (
              <Sparkles size={28} className="text-sage-500" />
            ) : (
              <Heart size={28} className="text-warm-400" />
            )}
          </motion.div>

          <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-3">
            {isSessionDone ? 'You did it.' : 'Good work today.'}
          </h1>

          {summaryLoading ? (
            <div className="flex justify-center gap-1.5 py-2">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-sage-300"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-text-secondary text-lg leading-relaxed"
            >
              {aiSummary || currentSession?.summary}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-8"
        >
          <h2 className="text-lg font-medium text-text-primary">This session</h2>

          <div className="grid grid-cols-3 gap-3">
            <Card padding="sm" className="text-center">
              <CheckCircle2 size={20} className="text-sage-500 mx-auto mb-2" />
              <p className="text-2xl font-serif text-text-primary">{completedSteps.length}</p>
              <p className="text-xs text-text-muted">completed</p>
            </Card>
            <Card padding="sm" className="text-center">
              <Clock size={20} className="text-warm-400 mx-auto mb-2" />
              <p className="text-2xl font-serif text-text-primary">{totalMinutes}</p>
              <p className="text-xs text-text-muted">minutes</p>
            </Card>
            <Card padding="sm" className="text-center">
              <TrendingUp size={20} className="text-sage-500 mx-auto mb-2" />
              <p className="text-2xl font-serif text-text-primary">{stuckSteps.length}</p>
              <p className="text-xs text-text-muted">adapted</p>
            </Card>
          </div>
        </motion.div>

        {completedSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <h2 className="text-lg font-medium text-text-primary mb-4">Win wall</h2>
            <div className="grid grid-cols-2 gap-2">
              {completedSteps.map((step, i) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * i + 0.3 }}
                >
                  <div className="bg-sage-50 border border-sage-100 rounded-2xl p-3 text-center">
                    <CheckCircle2 size={16} className="text-sage-400 mx-auto mb-1.5" />
                    <p className="text-xs text-text-primary leading-snug line-clamp-2">{step.title}</p>
                    <p className="text-xs text-text-muted mt-1">{step.durationMinutes}m</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {currentSession && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card>
              <p className="text-sm text-text-muted mb-3">What you worked on</p>
              <p className="font-medium text-text-primary mb-4">{currentSession.goalTitle}</p>
              <div className="space-y-2">
                {completedSteps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 size={14} className="text-sage-400 shrink-0" />
                    <span className="text-text-primary">{step.title}</span>
                    <span className="text-text-muted ml-auto">{step.durationMinutes}m</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {currentSession && currentSession.distractions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <h2 className="text-lg font-medium text-text-primary mb-4">Distractions this session</h2>
            <Card>
              <div className="space-y-2">
                {(() => {
                  const counts: Record<string, number> = {};
                  currentSession!.distractions.forEach(d => {
                    counts[d.label] = (counts[d.label] || 0) + 1;
                  });
                  return Object.entries(counts).map(([label, count]) => (
                    <div key={label} className="flex items-center gap-3">
                      <AlertCircle size={14} className="text-warm-400 shrink-0" />
                      <span className="text-sm text-text-primary flex-1">{label}</span>
                      <span className="text-xs text-text-muted">×{count}</span>
                    </div>
                  ));
                })()}
              </div>
            </Card>
          </motion.div>
        )}

        {profile.recentFeedback.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-lg font-medium text-text-primary mb-4">How tasks have been feeling</h2>
            <Card>
              <div className="space-y-3">
                {recentEasy > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">😊</span>
                    <div className="flex-1">
                      <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(recentEasy / profile.recentFeedback.length) * 100}%` }}
                          className="h-full bg-sage-300 rounded-full"
                        />
                      </div>
                    </div>
                    <span className="text-sm text-text-muted">Easy</span>
                  </div>
                )}
                {recentOkay > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">😐</span>
                    <div className="flex-1">
                      <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(recentOkay / profile.recentFeedback.length) * 100}%` }}
                          className="h-full bg-warm-300 rounded-full"
                        />
                      </div>
                    </div>
                    <span className="text-sm text-text-muted">Okay</span>
                  </div>
                )}
                {recentHard > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg">😣</span>
                    <div className="flex-1">
                      <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(recentHard / profile.recentFeedback.length) * 100}%` }}
                          className="h-full bg-warm-400 rounded-full"
                        />
                      </div>
                    </div>
                    <span className="text-sm text-text-muted">Too much</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-lg font-medium text-text-primary mb-4">Your patterns</h2>
          <div className="space-y-3">
            <Card padding="sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-sage-50 rounded-xl shrink-0">
                  <Clock size={16} className="text-sage-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Preferred task duration</p>
                  <p className="text-sm text-text-secondary">Around {profile.preferredTaskDuration} minutes feels right</p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-sage-50 rounded-xl shrink-0">
                  <CheckCircle2 size={16} className="text-sage-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Total steps completed</p>
                  <p className="text-sm text-text-secondary">{profile.totalStepsCompleted} small actions taken</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-3"
        >
          <Button onClick={resetToHome} size="lg" className="w-full">
            Start something new
            <ArrowRight size={18} />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
