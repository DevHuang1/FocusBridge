import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useConsentStore } from '../store/useConsentStore';
import { usePersonalizationStore } from '../store/usePersonalizationStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ConsentCard } from '../components/ConsentCard';
import { useToast } from '../components/Toast';
import { CheckInSummary } from '../components/CheckInFlow';
import { Settings, LogOut, ArrowRight, History, ChevronRight, Play, Send, Trash2, Inbox, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { streamBreakdown, extractJsonArray } from '../lib/ai';
import { trackActivity } from '../lib/activity';
import { assembleContextForBreakdown } from '../lib/context';
import type { TaskStep, StepGroup, AIContextEnvelope } from '../types';

const thinkingPhrases = ['Thinking', 'Working on it', 'Breaking it down', 'Creating steps', 'Organizing'];

function countAllSteps(steps: { status: string; children?: any[] }[]): number {
  let n = 0;
  for (const s of steps) { n++; if (s.children) n += countAllSteps(s.children); }
  return n;
}

export function DashboardScreen() {
  const goals = useAppStore((s) => s.goals);
  const currentSession = useAppStore((s) => s.currentSession);
  const parkedItems = useAppStore((s) => s.parkedItems);
  const unparkItem = useAppStore((s) => s.unparkItem);
  const markParkedDone = useAppStore((s) => s.markParkedDone);
  const setScreen = useAppStore((s) => s.setScreen);
  const guidanceStyle = usePersonalizationStore((s) => s.preferences.guidanceStyle);
  const profile = useAppStore((s) => s.profile);
  const preferredTaskDuration = profile?.preferredTaskDuration;
  const todayCheckIn = usePersonalizationStore((s) => s.todayCheckIn);
  const clearTodayCheckIn = usePersonalizationStore((s) => s.clearTodayCheckIn);
  const signOut = useAuth((s) => s.signOut);
  const hasConsented = useConsentStore((s) => s.hasConsented);
  const consentDismissed = useConsentStore((s) => s.consentDismissed);

  const { toast } = useToast();
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [thinkingPhrase, setThinkingPhrase] = useState(thinkingPhrases[0]);
  const [showHistory, setShowHistory] = useState(false);
  const chatRef = useRef<HTMLTextAreaElement>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recentGoals = useMemo(() => {
    return goals.filter((g) => !g.archived).slice(-5).reverse();
  }, [goals]);

  useEffect(() => {
    return () => { if (streamIntervalRef.current) clearInterval(streamIntervalRef.current); };
  }, []);

  const handleSubmit = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || isStreaming) return;

    setChatInput('');
    setIsStreaming(true);
    setStreamText('');
    setThinkingPhrase(thinkingPhrases[0]);

    let phraseIdx = 0;
    streamIntervalRef.current = setInterval(() => {
      phraseIdx = (phraseIdx + 1) % thinkingPhrases.length;
      setThinkingPhrase(thinkingPhrases[phraseIdx]);
    }, 2000);

    useAppStore.setState({
      isBreakingDown: true,
      breakdownText: '',
      sessionSteps: [],
      goalInput: trimmed,
      currentSession: {
        id: `session-${Date.now()}`,
        goalTitle: trimmed,
        steps: [],
        groups: [],
        currentStepIndex: 0,
        feedback: [],
        startedAt: new Date().toISOString(),
        distractions: [],
      },
    });

    try {
      trackActivity('ai_request_created', { properties: { type: 'breakdown' } });
      let envelope: AIContextEnvelope | undefined;
      try {
        const result = await assembleContextForBreakdown(trimmed);
        envelope = result.envelope;
      } catch {
        envelope = undefined;
      }

      const rawResponse = await streamBreakdown(
        trimmed,
        (partial) => {
          setStreamText(partial);
          useAppStore.setState({ breakdownText: partial });
        },
        (status) => setThinkingPhrase(status),
        envelope,
        { preferredTaskDuration, guidanceStyle },
      );

      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

      const parsed = extractJsonArray(rawResponse);

      let steps: TaskStep[] = [];
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        steps = parsed.map((step: any, i: number) => ({
          id: `step-${Date.now()}-${i}`,
          title: step.title || `Step ${i + 1}`,
          durationMinutes: Math.min(5, Math.max(1, step.durationMinutes || 5)),
          status: 'pending' as const,
        }));
      }

      if (steps.length === 0) {
        steps = [
          { id: `step-${Date.now()}-0`, title: 'Open the relevant materials', durationMinutes: 2, status: 'pending' },
          { id: `step-${Date.now()}-1`, title: 'Read or review the first section', durationMinutes: 5, status: 'pending' },
          { id: `step-${Date.now()}-2`, title: 'Write down one key takeaway', durationMinutes: 3, status: 'pending' },
        ];
      }

      const groups: StepGroup[] = [{ label: 'Getting started', emoji: '\u{1F331}', steps }];

      const prev = useAppStore.getState().currentSession;
      if (!prev) throw new Error('No active session');
      const newGoal = {
        id: `goal-${Date.now()}`,
        title: trimmed,
        sessions: [{ ...prev, steps, groups }],
        createdAt: new Date().toISOString(),
        archived: false,
      };

      useAppStore.setState({
        currentSession: { ...prev, steps, groups },
        sessionSteps: steps,
        isBreakingDown: false,
        breakdownText: '',
        goals: [...useAppStore.getState().goals, newGoal],
        screen: 'work_tasks',
      });
      trackActivity('task_breakdown_generated', { properties: { stepCount: steps.length } });
    } catch (error) {
      console.error('Stream breakdown failed:', error);
      toast('AI breakdown failed — using starter steps', 'error');
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      const fallbackSteps: TaskStep[] = [
        { id: `step-${Date.now()}-0`, title: 'Open the relevant materials', durationMinutes: 2, status: 'pending' },
        { id: `step-${Date.now()}-1`, title: 'Read or review the first section', durationMinutes: 5, status: 'pending' },
        { id: `step-${Date.now()}-2`, title: 'Write down one key takeaway', durationMinutes: 3, status: 'pending' },
      ];
      const prev = useAppStore.getState().currentSession;
      if (prev) {
        useAppStore.setState({
          currentSession: { ...prev, steps: fallbackSteps, groups: [{ label: 'Getting started', emoji: '\u{1F331}', steps: fallbackSteps }] },
          sessionSteps: fallbackSteps,
          isBreakingDown: false,
          breakdownText: '',
          screen: 'work_tasks',
        });
      }
    }

    setIsStreaming(false);
    setStreamText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!hasConsented && !consentDismissed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
        <ConsentCard />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/focus_bridge.png" alt="" className="w-9 h-9 object-contain" />
          <span className="text-sm font-semibold tracking-tight text-text-secondary">FocusBridge</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => { trackActivity('button_pressed', { properties: { button: 'settings' } }); setScreen('settings'); }} className="p-2.5 rounded-2xl hover:bg-cream-200/80 transition-colors cursor-pointer" aria-label="Settings">
            <Settings size={18} className="text-text-muted" />
          </button>
          <button onClick={() => { trackActivity('button_pressed', { properties: { button: 'sign_out' } }); signOut(); }} className="p-2.5 rounded-2xl hover:bg-cream-200/80 transition-colors cursor-pointer" aria-label="Sign out">
            <LogOut size={16} className="text-text-muted" />
          </button>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center px-5 pb-8">
        <div className="w-full max-w-xl mx-auto flex-1 flex flex-col">
          <div className="text-center mb-10 animate-fade-in-up">
            <h1 className="font-serif text-3xl md:text-4xl text-text-primary mb-2">{getGreeting()}.</h1>
            <p className="text-text-secondary text-base">What would you like to work on?</p>
          </div>

          {todayCheckIn && (
            <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <CheckInSummary checkIn={todayCheckIn} onClear={clearTodayCheckIn} />
            </div>
          )}

          {isStreaming && (
            <div className="mb-6 animate-fade-in-up">
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex gap-1.5">
                    <div className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-theme-primary)' }} />
                    <div className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-theme-primary)' }} />
                    <div className="thinking-dot w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-theme-primary)' }} />
                  </div>
                  <span className="text-sm text-text-muted">{thinkingPhrase}...</span>
                </div>
                {streamText && (
                  <div className="text-sm text-text-secondary font-mono whitespace-pre-wrap leading-relaxed bg-cream-50/50 rounded-2xl p-4 border border-cream-100/50">
                    {streamText}
                  </div>
                )}
              </Card>
            </div>
          )}

          {!isStreaming && (
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="relative">
                <textarea
                  ref={chatRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="I need to..."
                  rows={2}
                  className="w-full px-6 py-5 text-lg bg-surface border-2 border-cream-200/70 rounded-[1.5rem] resize-none focus:outline-none transition-all duration-250 placeholder:text-text-muted focus:border-[var(--color-theme-primary)] focus:shadow-[0_0_0_3px_var(--color-theme-primary-light)]"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!chatInput.trim()}
                  aria-label="Submit"
                  className={`absolute right-4 bottom-4 p-3.5 text-white rounded-[1rem] transition-all duration-200 cursor-pointer shadow-sm ${
                    chatInput.trim() ? 'opacity-100 scale-100 hover:brightness-110 active:scale-95' : 'opacity-0 scale-90 pointer-events-none'
                  }`}
                  style={{ backgroundColor: 'var(--color-theme-primary)' }}
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="mt-3 text-xs text-text-muted text-center">Press Enter to break it down</p>
            </div>
          )}

          {!isStreaming && !chatInput && (
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { emoji: '\u{1F4DA}', text: 'Study for an exam' },
                  { emoji: '\u270D\uFE0F', text: 'Write an essay' },
                  { emoji: '\u{1F9F9}', text: 'Clean my room' },
                  { emoji: '\u{1F4BB}', text: 'Fix a bug' },
                ].map((s) => (
                  <button
                    key={s.text}
                    onClick={() => { setChatInput(`I need to ${s.text.toLowerCase()}`); chatRef.current?.focus(); }}
                    className="flex items-center gap-2.5 p-3.5 rounded-[1.25rem] bg-surface border border-cream-200/50 hover:border-cream-200 hover:shadow-sm transition-all cursor-pointer text-left group"
                  >
                    <span className="text-base">{s.emoji}</span>
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isStreaming && currentSession && currentSession.steps.length > 0 && (
            <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
              <Card padding="sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl shrink-0" style={{ backgroundColor: 'var(--color-theme-surface)' }}>
                    <Play size={16} style={{ color: 'var(--color-theme-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{currentSession.goalTitle}</p>
                    <p className="text-xs text-text-muted">
                      {countAllSteps(currentSession.steps.filter((s) => s.status === 'completed'))}/{countAllSteps(currentSession.steps)} steps done
                    </p>
                  </div>
                  <Button size="sm" onClick={() => {
                    const idx = currentSession.steps.findIndex((s) => s.status === 'pending');
                    if (idx >= 0) useAppStore.getState().beginSoftStart(idx);
                  }}>
                    Resume <ArrowRight size={14} />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {parkedItems.length > 0 && !isStreaming && (
            <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
              <Card padding="sm">
                <div className="flex items-center gap-2 mb-3">
                  <Inbox size={16} className="text-text-muted" />
                  <h3 className="text-sm font-medium text-text-primary">Parking lot</h3>
                  <p className="text-xs text-text-muted ml-auto">things to handle later</p>
                </div>
                <div className="space-y-1.5">
                  {parkedItems.filter((p) => p.status !== 'done').map((item) => (
                    <div key={item.id} className="flex items-center gap-2 py-1.5">
                      <button
                        onClick={() => markParkedDone(item.id)}
                        title="Mark as done"
                        className="w-5 h-5 rounded-md border border-cream-300 flex items-center justify-center text-transparent hover:text-sage-400 hover:border-sage-300 transition-colors cursor-pointer shrink-0"
                      >
                        <Check size={12} />
                      </button>
                      <span className="text-sm text-text-primary flex-1 min-w-0 truncate">{item.label}</span>
                      {item.status === 'later_today' && (
                        <span className="text-[10px] text-text-muted bg-cream-100 rounded-full px-2 py-0.5 shrink-0">today</span>
                      )}
                      <button
                        onClick={() => { setChatInput(`I need to ${item.label.toLowerCase()}`); chatRef.current?.focus(); }}
                        title="Turn into a task"
                        className="p-1.5 rounded-lg text-text-muted hover:bg-cream-100 hover:text-text-primary transition-colors cursor-pointer shrink-0"
                      >
                        <ExternalLink size={13} />
                      </button>
                      <button
                        onClick={() => unparkItem(item.id)}
                        title="Remove"
                        className="p-1.5 rounded-lg text-text-muted hover:bg-warm-100 hover:text-warm-500 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {!isStreaming && (
            <div className="mt-auto pt-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer mx-auto"
              >
                <History size={14} />
                Check previous tasks
                <ChevronRight size={14} className={`transition-transform duration-200 ${showHistory ? 'rotate-90' : ''}`} />
              </button>

              {showHistory && (
                <div className="mt-4 space-y-2 animate-fade-in-up">
                  {recentGoals.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-4">No previous tasks yet</p>
                  ) : (
                    recentGoals.map((goal) => {
                      const lastSession = goal.sessions[goal.sessions.length - 1];
                      const completed = lastSession?.steps.filter((s) => s.status === 'completed').length ?? 0;
                      const total = lastSession?.steps.length ?? 0;
                      const allDone = completed === total && total > 0;
                      return (
                        <Card key={goal.id} padding="sm">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${allDone ? 'bg-sage-400' : 'bg-cream-300'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary truncate">{goal.title}</p>
                              <p className="text-xs text-text-muted">{completed}/{total} steps</p>
                            </div>
                            {!allDone && lastSession && (
                              <button
                                onClick={() => useAppStore.getState().resumeSession(goal.id, lastSession.id)}
                                className="text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                              >
                                Resume
                              </button>
                            )}
                            <button
                              onClick={() => useAppStore.getState().deleteGoal(goal.id)}
                              title="Delete this task"
                              className="p-1.5 rounded-lg text-text-muted hover:bg-warm-100 hover:text-warm-500 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
