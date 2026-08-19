import { useAppStore } from '../store/useAppStore';
import { TextInput } from '../components/TextInput';
import { Card } from '../components/Card';
import { CheckInBanner } from '../components/CheckInBanner';
import { ProgressBar } from '../components/ProgressBar';
import { ArrowRight, Coffee, Zap, Target, BarChart3, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const breakdownGoal = useAppStore((s) => s.breakdownGoal);
  const currentSession = useAppStore((s) => s.currentSession);
  const checkInMessage = useAppStore((s) => s.checkInMessage);
  const dismissCheckIn = useAppStore((s) => s.dismissCheckIn);
  const aiTyping = useAppStore((s) => s.aiTyping);
  const startFocusSession = useAppStore((s) => s.startFocusSession);
  const setScreen = useAppStore((s) => s.setScreen);
  const signOut = useAuth((s) => s.signOut);
  const user = useAuth((s) => s.user);

  const completedSteps = currentSession?.steps.filter(s => s.status === 'completed').length ?? 0;
  const totalSteps = currentSession?.steps.length ?? 0;
  const pendingSteps = currentSession?.steps.filter(s => s.status === 'pending') ?? [];
  const hasActiveSession = currentSession && pendingSteps.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <CheckInBanner message={checkInMessage} onDismiss={dismissCheckIn} />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20">
        <div className="text-center mb-10 max-w-xl animate-fade-in">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ backgroundColor: 'var(--color-theme-surface)', color: 'var(--color-theme-primary)' }}>
            <img src="/logo/logo-96.png" alt="" className="w-6 h-6 rounded-full" />
            <span>Focus Bridge</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-text-primary mb-4 leading-tight">{getGreeting()}.</h1>
          <p className="text-xl text-text-secondary">What's on your mind?</p>
        </div>

        <div className="w-full max-w-xl mb-12 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {aiTyping ? (
            <div className="bg-surface border-2 border-cream-200 rounded-3xl px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full animate-pulse-soft" style={{ backgroundColor: 'var(--color-theme-primary)', animationDelay: `${i * 200}ms` }} />
                  ))}
                </div>
                <span className="text-text-muted">Let me think about that...</span>
              </div>
            </div>
          ) : (
            <TextInput onSubmit={(goal) => breakdownGoal(goal)} />
          )}
        </div>

        {hasActiveSession && (
          <div className="w-full max-w-xl space-y-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <h2 className="text-lg font-medium text-text-primary flex items-center gap-2"><Target size={18} style={{ color: 'var(--color-theme-primary)' }} />Today's Focus</h2>
            <Card>
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 rounded-xl shrink-0 mt-0.5" style={{ backgroundColor: 'var(--color-theme-surface)' }}><Zap size={18} style={{ color: 'var(--color-theme-primary)' }} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-muted mb-1">{format(new Date(), 'EEEE, MMMM d')}</p>
                  <h3 className="text-lg font-medium text-text-primary truncate">{currentSession!.goalTitle}</h3>
                </div>
              </div>
              <ProgressBar progress={completedSteps / totalSteps} total={totalSteps} completed={completedSteps} className="mb-5" />
              <div className="space-y-2.5">
                {pendingSteps.slice(0, 3).map((step) => (
                  <div key={step.id} className="flex items-center gap-3 px-4 py-3 bg-cream-50 rounded-xl">
                    <div className="w-5 h-5 rounded-full border-2 border-cream-300 shrink-0" />
                    <span className="flex-1 text-sm text-text-primary">{step.title}</span>
                    <span className="text-xs text-text-muted bg-cream-200 px-2 py-0.5 rounded-full">{step.durationMinutes} min</span>
                  </div>
                ))}
                {pendingSteps.length > 3 && <p className="text-sm text-text-muted text-center py-1">+{pendingSteps.length - 3} more steps</p>}
              </div>
              <div className="mt-5">
                <button onClick={startFocusSession} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl font-medium px-8 py-4 text-lg text-white shadow-sm cursor-pointer transition-all duration-150 hover:brightness-110 active:scale-[0.98]" style={{ backgroundColor: 'var(--color-theme-primary)' }}>
                  Start next step <ArrowRight size={18} />
                </button>
              </div>
            </Card>
          </div>
        )}

        {!hasActiveSession && !aiTyping && (
          <div className="w-full max-w-xl animate-fade-in" style={{ animationDelay: '500ms' }}>
            <h2 className="text-lg font-medium text-text-primary mb-4 flex items-center gap-2"><Coffee size={18} className="text-warm-400" />Quick start</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { emoji: '📚', text: 'Study for an exam' },
                { emoji: '✍️', text: 'Write an essay' },
                { emoji: '🧹', text: 'Clean my room' },
                { emoji: '💻', text: 'Fix a bug' },
              ].map((suggestion) => (
                <Card key={suggestion.text} padding="sm" hover onClick={() => breakdownGoal(`I need to ${suggestion.text.toLowerCase()}`)}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{suggestion.emoji}</span>
                    <span className="text-sm font-medium text-text-primary">{suggestion.text}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentSession && currentSession.steps.length > 0 && !hasActiveSession && (
          <div className="mt-8 flex flex-col items-center gap-3 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <button onClick={() => setScreen('dashboard')} className="text-sm text-text-muted hover:text-sage-500 transition-colors cursor-pointer flex items-center gap-1.5">
              <BarChart3 size={14} />View dashboard
            </button>
          </div>
        )}

        {user && (
          <div className="mt-8 pb-8 animate-fade-in" style={{ animationDelay: '700ms' }}>
            <button onClick={signOut} className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer flex items-center gap-1.5">
              <LogOut size={12} />Sign out
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
