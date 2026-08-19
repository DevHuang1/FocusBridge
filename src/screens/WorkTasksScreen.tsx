import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { TypingIndicator } from '../components/TypingIndicator';
import { AnimatedItem } from '../components/CalmMotion';
import { ChevronLeft, ArrowRight, Clock, Pencil, Minus, Plus, ChevronDown } from 'lucide-react';
import type { TaskStep } from '../types';

export function WorkTasksScreen() {
  const currentSession = useAppStore((s) => s.currentSession);
  const startStep = useAppStore((s) => s.startStep);
  const setScreen = useAppStore((s) => s.setScreen);
  const isBreakingDown = useAppStore((s) => s.isBreakingDown);
  const breakdownGoal = useAppStore((s) => s.breakdownGoal);
  const updateStepTime = useAppStore((s) => s.updateStepTime);
  const updateStepTitle = useAppStore((s) => s.updateStepTitle);
  const makeStepSmaller = useAppStore((s) => s.makeStepSmaller);
  const [editingStep, setEditingStep] = useState<string | null>(null);

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
                    { emoji: '📧', text: 'Reply to an important email' },
                    { emoji: '📝', text: 'Write the first paragraph' },
                    { emoji: '🧹', text: 'Clear one surface' },
                    { emoji: '📞', text: 'Make a 5-minute phone call' },
                    { emoji: '📖', text: 'Read one page' },
                    { emoji: '💡', text: 'Write down one idea' },
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

  const groups = currentSession.groups ?? [];
  const firstPendingIdx = currentSession.steps.findIndex((s) => s.status === 'pending');

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 md:py-16">
      <div className="w-full max-w-lg">
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
                {groups.length > 1 ? `${groups.length} branches — let's take them one at a time.` : "Let's make this smaller."}
              </p>
            </AnimatedItem>

            <div className="mb-8">
              {groups.length > 1 ? (
                groups.map((group, gi) => (
                  <GroupBranch key={`${group.label}-${gi}`} group={group} isLast={gi === groups.length - 1} editingStep={editingStep} onEdit={(id) => setEditingStep(id)} onUpdateTitle={(id, t) => { updateStepTitle(id, t); setEditingStep(null); }} onUpdateTime={updateStepTime} />
                ))
              ) : (
                <StepList steps={currentSession.steps} editingStep={editingStep} onEdit={(id) => setEditingStep(id)} onUpdateTitle={(id, t) => { updateStepTitle(id, t); setEditingStep(null); }} onUpdateTime={updateStepTime} />
              )}
            </div>

            <AnimatedItem index={2}>
              <div className="space-y-3">
                {firstPendingIdx >= 0 && (
                  <Button onClick={() => startStep(firstPendingIdx)} size="lg" className="w-full">
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

function StepList({ steps, editingStep, onEdit, onUpdateTitle, onUpdateTime }: { steps: TaskStep[]; editingStep: string | null; onEdit: (id: string) => void; onUpdateTitle: (id: string, title: string) => void; onUpdateTime: (id: string, minutes: number) => void }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const isCompleted = step.status === 'completed';
        const isStuck = step.status === 'stuck';
        const isSkipped = step.status === 'skipped';
        const isFirstPending = step.status === 'pending' && steps.slice(0, i).every((s) => s.status !== 'pending');

        return (
          <AnimatedItem key={step.id} index={i + 1}>
            <Card padding="sm" className={`${isCompleted ? 'opacity-50' : ''} ${isStuck ? 'opacity-40' : ''} ${isSkipped ? 'opacity-30' : ''} ${isFirstPending ? 'ring-2' : ''}`} style={isFirstPending ? { boxShadow: '0 0 0 2px var(--color-theme-primary)' } : undefined}>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0`} style={{ backgroundColor: isCompleted ? 'var(--color-sage-400)' : isFirstPending ? 'var(--color-theme-primary)' : 'var(--color-theme-border)' }} />
                <div className="flex-1 min-w-0">
                  {editingStep === step.id ? (
                    <input autoFocus defaultValue={step.title} className="w-full bg-transparent text-sm font-medium text-text-primary focus:outline-none border-b pb-0.5" style={{ borderColor: 'var(--color-theme-primary)' }} onBlur={(e) => onUpdateTitle(step.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
                  ) : (
                    <p className={`text-sm text-text-primary truncate ${isCompleted ? 'line-through text-text-muted' : 'font-medium'}`}>{step.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {editingStep === step.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => onUpdateTime(step.id, step.durationMinutes - 1)} className="p-1 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"><Minus size={14} className="text-text-muted" /></button>
                      <span className="text-xs text-text-muted w-10 text-center">{step.durationMinutes} min</span>
                      <button onClick={() => onUpdateTime(step.id, step.durationMinutes + 1)} className="p-1 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"><Plus size={14} className="text-text-muted" /></button>
                    </div>
                  ) : (
                    <>
                      <span className="flex items-center gap-1 text-xs text-text-muted bg-cream-100 px-2 py-1 rounded-full"><Clock size={12} />{step.durationMinutes} min</span>
                      <button onClick={() => onEdit(step.id)} className="p-1 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"><Pencil size={12} className="text-text-muted" /></button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </AnimatedItem>
        );
      })}
    </div>
  );
}

function GroupBranch({ group, isLast, editingStep, onEdit, onUpdateTitle, onUpdateTime }: { group: { label: string; emoji: string; steps: TaskStep[] }; isLast: boolean; editingStep: string | null; onEdit: (id: string) => void; onUpdateTitle: (id: string, title: string) => void; onUpdateTime: (id: string, minutes: number) => void }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`relative ${!isLast ? 'pb-2' : ''}`}>
      {!isLast && <div className="absolute left-[18px] top-[42px] bottom-0 w-0.5 bg-cream-300" />}
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 p-3 rounded-2xl transition-colors cursor-pointer hover:brightness-95" style={{ backgroundColor: 'var(--color-theme-surface)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 border" style={{ backgroundColor: 'var(--color-theme-surface)', borderColor: 'var(--color-theme-border)' }}>{group.emoji}</div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-text-primary">{group.label}</p>
          <p className="text-xs text-text-muted">{group.steps.length} step{group.steps.length !== 1 ? 's' : ''}</p>
        </div>
        <ChevronDown size={16} className={`text-text-muted transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
      </button>
      {expanded && (
        <div className="ml-[18px] pl-5 border-l-2 border-dashed border-cream-300 space-y-2 py-3">
          {group.steps.map((step) => (
            <Card key={step.id} padding="sm" className={`${step.status === 'completed' ? 'opacity-50' : ''} ${step.status === 'stuck' ? 'opacity-40' : ''} ${step.status === 'skipped' ? 'opacity-30' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: step.status === 'completed' ? 'var(--color-sage-400)' : 'var(--color-theme-border)' }} />
                <div className="flex-1 min-w-0">
                  {editingStep === step.id ? (
                    <input autoFocus defaultValue={step.title} className="w-full bg-transparent text-sm font-medium text-text-primary focus:outline-none border-b border-sage-300 pb-0.5" onBlur={(e) => onUpdateTitle(step.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
                  ) : (
                    <p className={`text-sm text-text-primary truncate ${step.status === 'completed' ? 'line-through text-text-muted' : 'font-medium'}`}>{step.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {editingStep === step.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => onUpdateTime(step.id, step.durationMinutes - 1)} className="p-1 rounded-lg hover:bg-cream-200 cursor-pointer"><Minus size={14} className="text-text-muted" /></button>
                      <span className="text-xs text-text-muted w-10 text-center">{step.durationMinutes} min</span>
                      <button onClick={() => onUpdateTime(step.id, step.durationMinutes + 1)} className="p-1 rounded-lg hover:bg-cream-200 cursor-pointer"><Plus size={14} className="text-text-muted" /></button>
                    </div>
                  ) : (
                    <>
                      <span className="flex items-center gap-1 text-xs text-text-muted bg-cream-100 px-2 py-1 rounded-full"><Clock size={12} />{step.durationMinutes} min</span>
                      <button onClick={() => onEdit(step.id)} className="p-1 rounded-lg hover:bg-cream-200 cursor-pointer"><Pencil size={12} className="text-text-muted" /></button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
