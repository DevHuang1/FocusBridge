import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { TypingIndicator } from '../components/TypingIndicator';
import { AnimatedItem } from '../components/CalmMotion';
import { TreeBreakdown } from '../components/TreeBreakdown';
import { ChevronLeft, ArrowRight } from 'lucide-react';

export function WorkTasksScreen() {
  const currentSession = useAppStore((s) => s.currentSession);
  const beginSoftStart = useAppStore((s) => s.beginSoftStart);
  const setScreen = useAppStore((s) => s.setScreen);
  const isBreakingDown = useAppStore((s) => s.isBreakingDown);
  const breakdownGoal = useAppStore((s) => s.breakdownGoal);
  const makeStepSmaller = useAppStore((s) => s.makeStepSmaller);

  if (!currentSession && !isBreakingDown) {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-12 md:py-20">
        <div className="w-full max-w-lg">
          <button onClick={() => setScreen('dashboard')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-8 cursor-pointer">
            <ChevronLeft size={16} /> Dashboard
          </button>

          <AnimatedItem>
            <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-2">Work Tasks</h1>
            <p className="text-text-secondary mb-8">What can I help you do next?</p>
          </AnimatedItem>

          <AnimatedItem index={1}>
            {isBreakingDown ? (
              <TypingIndicator label="Breaking that down" />
            ) : (
              <TextInput onSubmit={(goal) => breakdownGoal(goal)} />
            )}
          </AnimatedItem>

          {!isBreakingDown && (
            <AnimatedItem index={2}>
              <div className="mt-8">
                <h3 className="text-sm font-medium text-text-muted mb-3">Try one of these</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { emoji: '\u{1F4E7}', text: 'Reply to an important email' },
                    { emoji: '\u{1F4DD}', text: 'Write the first paragraph' },
                    { emoji: '\u{1F9F9}', text: 'Clear one surface' },
                    { emoji: '\u{1F4DE}', text: 'Make a 5-minute phone call' },
                    { emoji: '\u{1F4D6}', text: 'Read one page' },
                    { emoji: '\u{1F4A1}', text: 'Write down one idea' },
                  ].map((s) => (
                    <Card key={s.text} padding="sm" hover onClick={() => breakdownGoal(s.text)}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{s.emoji}</span>
                        <span className="text-sm font-medium text-text-primary">{s.text}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </AnimatedItem>
          )}
        </div>
      </div>
    );
  }

  if (!currentSession) return null;

  const firstPendingIdx = currentSession.steps.findIndex((s) => s.status === 'pending');

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 md:py-16">
      <div className="w-full max-w-2xl">
        <button onClick={() => setScreen('dashboard')} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-8 cursor-pointer">
          <ChevronLeft size={16} /> Dashboard
        </button>

        <AnimatedItem>
          <p className="text-sm text-text-muted mb-2 uppercase tracking-wide font-medium">Your goal</p>
          <h1 className="font-serif text-3xl md:text-4xl text-text-primary leading-tight font-medium mb-8">{currentSession.goalTitle}</h1>
        </AnimatedItem>

        {isBreakingDown ? (
          <TypingIndicator label="Thinking" />
        ) : (
          <>
            <AnimatedItem index={1}>
              <p className="font-medium mb-6 flex items-center gap-2" style={{ color: 'var(--color-theme-primary)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-theme-primary)' }} />
                {currentSession.steps.some(s => s.children && s.children.length > 0)
                  ? 'Click any step to break it down further.'
                  : "Let's make this smaller."
                }
              </p>
            </AnimatedItem>

            <div className="mb-8 overflow-x-auto pb-4">
              <TreeBreakdown
                goalTitle={currentSession.goalTitle}
                steps={currentSession.steps}
              />
            </div>

            <AnimatedItem index={2}>
              <div className="space-y-3">
                {firstPendingIdx >= 0 && (
                  <Button onClick={() => beginSoftStart(firstPendingIdx)} size="lg" className="w-full">
                    Start first step — {currentSession.steps[firstPendingIdx].durationMinutes} min <ArrowRight size={18} />
                  </Button>
                )}
                <div className="flex gap-3 justify-center">
                  <Button variant="ghost" size="sm" onClick={makeStepSmaller}>Make it smaller</Button>
                  <Button variant="ghost" size="sm" onClick={() => setScreen('dashboard')}>Start over</Button>
                </div>
              </div>
            </AnimatedItem>
          </>
        )}
      </div>
    </div>
  );
}
