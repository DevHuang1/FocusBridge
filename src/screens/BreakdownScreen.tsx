import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/Button';
import { TypingIndicator } from '../components/TypingIndicator';
import { Card } from '../components/Card';
import { Clock, ArrowRight, Minus, Plus, MoreHorizontal, ChevronLeft, Pencil, ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { StepGroup } from '../types';

export function BreakdownScreen() {
  const { currentSession, startStep, setScreen, isBreakingDown, breakdownText, breakdownGoal, goalInput, updateStepTime, updateStepTitle } = useAppStore();
  const [editingStep, setEditingStep] = useState<string | null>(null);

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

  const groups = currentSession.groups ?? [];
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
          <h1 className="font-serif text-3xl md:text-4xl text-text-primary leading-tight font-medium">
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
              {groups.length > 1
                ? `${groups.length} branches — let's take them one at a time.`
                : "Let's make this smaller."}
            </motion.p>

            <div className="mb-8">
              {groups.length > 1 ? (
                groups.map((group, gi) => (
                  <GroupBranch
                    key={`${group.label}-${gi}`}
                    group={group}
                    groupIndex={gi}
                    isLast={gi === groups.length - 1}
                    editingStep={editingStep}
                    onEdit={(id) => setEditingStep(id)}
                    onCancelEdit={() => setEditingStep(null)}
                    onUpdateTitle={(id, t) => { updateStepTitle(id, t); setEditingStep(null); }}
                    onUpdateTime={updateStepTime}
                  />
                ))
              ) : (
                <div className="space-y-2.5">
                  {currentSession.steps.map((step, i) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                    >
                      <StepLeaf
                        step={step}
                        isEditing={editingStep === step.id}
                        onEdit={() => setEditingStep(step.id)}
                        onCancelEdit={() => setEditingStep(null)}
                        onUpdateTitle={(t) => { updateStepTitle(step.id, t); setEditingStep(null); }}
                        onUpdateTime={(m) => updateStepTime(step.id, m)}
                        color={branchColors[0]}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + currentSession.steps.length * 0.06 }}
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

const branchColors = [
  { bg: 'bg-sage-50', border: 'border-sage-200', dot: 'bg-sage-400', headerBg: 'bg-sage-100/60' },
  { bg: 'bg-warm-50', border: 'border-warm-200', dot: 'bg-warm-400', headerBg: 'bg-warm-100/60' },
  { bg: 'bg-cream-100', border: 'border-cream-300', dot: 'bg-cream-300', headerBg: 'bg-cream-200/60' },
  { bg: 'bg-sage-50', border: 'border-sage-300', dot: 'bg-sage-500', headerBg: 'bg-sage-100/40' },
];

function GroupBranch({
  group,
  groupIndex,
  isLast,
  editingStep,
  onEdit,
  onCancelEdit,
  onUpdateTitle,
  onUpdateTime,
}: {
  group: StepGroup;
  groupIndex: number;
  isLast: boolean;
  editingStep: string | null;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateTime: (id: string, minutes: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const colors = branchColors[groupIndex % branchColors.length];
  const baseDelay = 0.15 + groupIndex * 0.15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: baseDelay, duration: 0.4, ease: 'easeOut' }}
      className={`relative ${!isLast ? 'pb-2' : ''}`}
    >
      {!isLast && (
        <div className="absolute left-[18px] top-[42px] bottom-0 w-0.5 bg-cream-300" />
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-colors cursor-pointer ${colors.headerBg} hover:brightness-95`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${colors.bg} border ${colors.border}`}>
          {group.emoji}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-text-primary">{group.label}</p>
          <p className="text-xs text-text-muted">
            {group.steps.length} step{group.steps.length !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className="text-text-muted" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: expanded ? 'auto' : 0,
          opacity: expanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden"
      >
        <div className="ml-[18px] pl-5 border-l-2 border-dashed border-cream-300 space-y-2 py-3">
          {group.steps.map((step, si) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: baseDelay + 0.1 + si * 0.06, duration: 0.3 }}
            >
              <StepLeaf
                step={step}
                isEditing={editingStep === step.id}
                onEdit={() => onEdit(step.id)}
                onCancelEdit={onCancelEdit}
                onUpdateTitle={(t) => onUpdateTitle(step.id, t)}
                onUpdateTime={(m) => onUpdateTime(step.id, m)}
                color={colors}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StepLeaf({
  step,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdateTitle,
  onUpdateTime,
  color,
}: {
  step: { id: string; title: string; durationMinutes: number; status: string };
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateTime: (minutes: number) => void;
  color: { bg: string; border: string; dot: string; headerBg: string };
}) {
  const isCompleted = step.status === 'completed';
  const isStuck = step.status === 'stuck';
  const isSkipped = step.status === 'skipped';

  return (
    <Card
      padding="sm"
      className={`${isCompleted ? 'opacity-50' : ''} ${isStuck ? 'opacity-40' : ''} ${isSkipped ? 'opacity-30' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCompleted ? 'bg-sage-400' : color.dot}`} />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              autoFocus
              defaultValue={step.title}
              className="w-full bg-transparent text-sm font-medium text-text-primary focus:outline-none border-b border-sage-300 pb-0.5"
              onBlur={(e) => onUpdateTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
            />
          ) : (
            <p className={`text-sm text-text-primary truncate ${isCompleted ? 'line-through text-text-muted' : 'font-medium'}`}>
              {step.title}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateTime(step.durationMinutes - 1)}
                className="p-1 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"
              >
                <Minus size={14} className="text-text-muted" />
              </button>
              <span className="text-xs text-text-muted w-10 text-center">{step.durationMinutes} min</span>
              <button
                onClick={() => onUpdateTime(step.durationMinutes + 1)}
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
                onClick={() => isEditing ? onCancelEdit() : onEdit()}
                className="p-1 rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"
              >
                {isEditing ? <MoreHorizontal size={14} className="text-text-muted" /> : <Pencil size={12} className="text-text-muted" />}
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
