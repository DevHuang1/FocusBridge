import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { ArrowRight, Plus, Target, Trash2, Clock, CheckCircle2, Zap, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

export function DashboardScreen() {
  const { goals, profile, setScreen, setGoalInput } = useAppStore();

  const activeGoals = goals.filter(g => !g.archived);
  const completedGoals = goals.filter(g => {
    const lastSession = g.sessions[g.sessions.length - 1];
    return lastSession?.completedAt;
  });

  const allCompletedSteps = goals.reduce(
    (sum, g) => sum + g.sessions.reduce((s, sess) => s + sess.steps.filter(st => st.status === 'completed').length, 0),
    0
  );
  const allDistractions = goals.reduce(
    (sum, g) => sum + g.sessions.reduce((s, sess) => s + sess.distractions.length, 0),
    0
  );
  const totalTime = goals.reduce(
    (sum, g) => sum + g.sessions.reduce((s, sess) => s + sess.steps.filter(st => st.status === 'completed').reduce((ss, st) => ss + st.durationMinutes, 0), 0),
    0
  );

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setScreen('home')}
            className="text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <h1 className="text-lg font-medium text-text-primary flex items-center gap-2">
            <BarChart3 size={18} className="text-sage-500" />
            Dashboard
          </h1>
          <div />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          <Card padding="sm" className="text-center">
            <Target size={18} className="text-sage-500 mx-auto mb-1.5" />
            <p className="text-xl font-serif text-text-primary">{goals.length}</p>
            <p className="text-xs text-text-muted">goals</p>
          </Card>
          <Card padding="sm" className="text-center">
            <CheckCircle2 size={18} className="text-sage-500 mx-auto mb-1.5" />
            <p className="text-xl font-serif text-text-primary">{allCompletedSteps}</p>
            <p className="text-xs text-text-muted">steps done</p>
          </Card>
          <Card padding="sm" className="text-center">
            <Clock size={18} className="text-warm-400 mx-auto mb-1.5" />
            <p className="text-xl font-serif text-text-primary">{totalTime}m</p>
            <p className="text-xs text-text-muted">focused</p>
          </Card>
        </motion.div>

        {profile.moodHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-lg font-medium text-text-primary mb-4">Mood trends</h2>
            <Card>
              <div className="flex items-end gap-1 h-16">
                {profile.moodHistory.slice(-14).map((entry, i) => {
                  const moodValue = { drained: 1, low: 2, okay: 3, good: 4, great: 5 }[entry.mood];
                  const height = (moodValue / 5) * 100;
                  const color = moodValue <= 2 ? 'bg-warm-300' : moodValue === 3 ? 'bg-cream-300' : 'bg-sage-300';
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.03 * i, duration: 0.4 }}
                      className={`flex-1 rounded-t-sm ${color}`}
                      title={`${entry.mood} / ${entry.energy}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-text-muted">2 weeks ago</span>
                <span className="text-xs text-text-muted">Today</span>
              </div>
            </Card>
          </motion.div>
        )}

        {allDistractions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-lg font-medium text-text-primary mb-4">Distraction insights</h2>
            <Card>
              <div className="space-y-2">
                {(() => {
                  const counts: Record<string, number> = {};
                  goals.forEach(g => g.sessions.forEach(s => s.distractions.forEach(d => {
                    counts[d.label] = (counts[d.label] || 0) + 1;
                  })));
                  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                  if (sorted.length === 0) return <p className="text-sm text-text-muted">No distractions logged yet.</p>;
                  const max = sorted[0][1];
                  return sorted.map(([label, count]) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-sm text-text-primary w-28 truncate">{label}</span>
                      <div className="flex-1 h-2 bg-cream-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / max) * 100}%` }}
                          className="h-full bg-warm-300 rounded-full"
                        />
                      </div>
                      <span className="text-xs text-text-muted">{count}</span>
                    </div>
                  ));
                })()}
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-text-primary">All goals</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setGoalInput(''); setScreen('home'); }}
            >
              <Plus size={16} />
              New
            </Button>
          </div>

          {activeGoals.length === 0 && completedGoals.length === 0 ? (
            <Card>
              <div className="text-center py-6">
                <p className="text-text-muted mb-3">No goals yet. Start your first one!</p>
                <Button size="sm" onClick={() => setScreen('home')}>
                  Get started
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeGoals.map((goal, i) => {
                const lastSession = goal.sessions[goal.sessions.length - 1];
                const completed = lastSession?.steps.filter(s => s.status === 'completed').length ?? 0;
                const total = lastSession?.steps.length ?? 0;
                const pending = lastSession?.steps.filter(s => s.status === 'pending').length ?? 0;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <Card padding="sm">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-sage-50 rounded-xl shrink-0 mt-0.5">
                          <Zap size={16} className="text-sage-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate">{goal.title}</p>
                          <p className="text-xs text-text-muted">{format(new Date(goal.createdAt), 'MMM d')}</p>
                        </div>
                        <button
                          onClick={() => useAppStore.getState().deleteGoal(goal.id)}
                          className="p-1.5 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} className="text-text-muted" />
                        </button>
                      </div>
                      <ProgressBar progress={total > 0 ? completed / total : 0} total={total} completed={completed} className="mb-3" />
                      <div className="flex gap-2">
                        {pending > 0 && lastSession && (
                          <Button
                            size="sm"
                            onClick={() => {
                              useAppStore.getState().resumeSession(goal.id, lastSession.id);
                            }}
                          >
                            Continue
                            <ArrowRight size={14} />
                          </Button>
                        )}
                        {completed === total && total > 0 && (
                          <span className="text-xs text-sage-500 flex items-center gap-1">
                            <CheckCircle2 size={14} />
                            Completed
                          </span>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}

              {completedGoals.length > 0 && (
                <>
                  <p className="text-sm text-text-muted mt-4 mb-2">Completed</p>
                  {completedGoals.map((goal) => (
                    <Card key={goal.id} padding="sm" className="opacity-60">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-sage-400 shrink-0" />
                        <span className="text-sm text-text-primary truncate">{goal.title}</span>
                      </div>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
