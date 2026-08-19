import { useCallback, useEffect, useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { useConsentStore } from '../store/useConsentStore';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import {
  fetchActivityEvents,
  deleteActivityHistory,
  resetPersonalizationProfile,
  saveConsentStatus,
} from '../lib/data';
import { getActiveUserId, trackActivity, clearActivityQueue } from '../lib/activity';
import type { ConsentSettings, UserActivityEvent } from '../types';
import { Shield, Eye, Trash2, RotateCcw, Download, HelpCircle } from 'lucide-react';

const eventLabels: Record<string, string> = {
  screen_viewed: 'Opened a screen',
  navigation_changed: 'Changed screens',
  button_pressed: 'Pressed a button',
  task_created: 'Created a task',
  task_updated: 'Updated a task',
  task_started: 'Started a task',
  task_completed: 'Completed a task',
  task_postponed: 'Postponed a task',
  task_archived: 'Archived a task',
  task_breakdown_generated: 'Generated a task breakdown',
  task_step_accepted: 'Accepted a suggested step',
  task_step_simplified: 'Simplified a step',
  task_marked_stuck: 'Marked a step as stuck',
  roadmap_created: 'Created a roadmap',
  roadmap_node_opened: 'Opened a roadmap milestone',
  roadmap_node_converted_to_task: 'Converted a milestone to tasks',
  focus_session_started: 'Started a focus session',
  focus_session_paused: 'Paused a focus session',
  focus_session_resumed: 'Resumed a focus session',
  focus_session_completed: 'Completed a focus session',
  focus_session_abandoned: 'Left a focus session early',
  focus_preset_selected: 'Selected a focus preset',
  soft_start_completed: 'Finished a soft-start ritual',
  transition_bridge_completed: 'Completed a transition screen',
  preference_changed: 'Changed a preference',
  daily_check_in_completed: 'Completed a daily check-in',
  daily_check_in_skipped: 'Skipped a daily check-in',
  ai_request_created: 'Asked the AI for help',
  ai_suggestion_accepted: 'Accepted an AI suggestion',
  ai_suggestion_edited: 'Edited an AI suggestion',
  ai_suggestion_dismissed: 'Dismissed an AI suggestion',
  activity_tracking_paused: 'Paused activity tracking',
  activity_history_deleted: 'Deleted activity history',
};

const consentOptions: { key: keyof ConsentSettings; label: string; desc: string }[] = [
  { key: 'interactionHistory', label: 'Interaction history', desc: 'Remember which screens and buttons you use' },
  { key: 'aiPersonalization', label: 'Use history to personalize AI', desc: 'Let FocusBridge shape suggestions from your activity' },
  { key: 'dailyCheckInContext', label: 'Use daily check-in context', desc: 'Use your self-reported check-in to adapt the workspace' },
  { key: 'conversationMemory', label: 'Remember AI conversations', desc: 'Keep context about accepted, edited, or dismissed suggestions' },
  { key: 'technicalDiagnostics', label: 'Anonymous technical diagnostics', desc: 'Error and reliability data to keep the app working' },
];

export function PrivacySettings() {
  const consent = useConsentStore((s) => s.consent);
  const hasConsented = useConsentStore((s) => s.hasConsented);
  const setFlag = useConsentStore((s) => s.setFlag);
  const user = useAuth((s) => s.user);
  const { toast } = useToast();

  const [events, setEvents] = useState<UserActivityEvent[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const userId = getActiveUserId() ?? user?.uid ?? null;

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    const list = await fetchActivityEvents(userId, 25);
    setEvents(list);
  }, [userId]);

  useEffect(() => {
    if (showHistory) void loadHistory();
  }, [showHistory, loadHistory]);

  const persistConsent = async (next: ConsentSettings) => {
    if (!userId) return;
    try {
      await saveConsentStatus(userId, next, true);
    } catch {}
  };

  const handleToggle = (key: keyof ConsentSettings, value: boolean) => {
    setFlag(key, value);
    const next = { ...consent, [key]: value };
    void persistConsent(next);
    if (key === 'interactionHistory' && !value) {
      trackActivity('activity_tracking_paused', {});
    }
  };

  const handleDeleteHistory = async () => {
    if (!userId || busy) return;
    setBusy(true);
    await deleteActivityHistory(userId);
    await resetPersonalizationProfile(userId);
    clearActivityQueue();
    setEvents([]);
    setConfirmDelete(false);
    setBusy(false);
    trackActivity('activity_history_deleted', {});
    toast('Activity history deleted', 'info');
  };

  const handleForgetLearned = async () => {
    if (!userId || busy) return;
    setBusy(true);
    await resetPersonalizationProfile(userId);
    setBusy(false);
    toast('Personalization reset', 'info');
  };

  const handleExport = async () => {
    if (!userId) return;
    const list = await fetchActivityEvents(userId, 1000);
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusbridge-activity-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported your activity data', 'info');
  };

  return (
    <Card>
      <div className="flex items-center gap-2.5 mb-4">
        <Shield size={18} style={{ color: 'var(--color-theme-primary)' }} />
        <h2 className="font-medium text-text-primary">Privacy &amp; personalization</h2>
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mb-5">
        FocusBridge learns with you, not by watching you. These controls decide what the app may
        remember and how the AI may use it. Everything is reversible, and your tasks always work
        with tracking off.
      </p>

      <div className="space-y-2.5 mb-5">
        {consentOptions.map((opt) => (
          <div key={opt.key} className="flex items-center justify-between gap-3 p-3 rounded-2xl border-2 border-cream-200/70">
            <div>
              <p className="text-sm font-medium text-text-primary">{opt.label}</p>
              <p className="text-xs text-text-muted">{opt.desc}</p>
            </div>
            <button
              onClick={() => handleToggle(opt.key, !consent[opt.key])}
              role="switch"
              aria-checked={Boolean(consent[opt.key])}
              className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer shrink-0 ${consent[opt.key] ? 'bg-sage-500' : 'bg-cream-300'}`}
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${consent[opt.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-text-muted mb-5">
        Detailed activity is kept for a limited period (recommended default: 90 days), after which
        only a short, explainable personalization summary remains. Your tasks and projects are
        stored separately and are not affected by these controls.
      </p>

      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer mb-3"
      >
        <Eye size={14} />
        {showHistory ? 'Hide recent activity' : 'Show recent activity'}
        {hasConsented ? null : <span className="text-xs text-warm-400">(no history recorded yet)</span>}
      </button>

      {showHistory && (
        <div className="mb-5 space-y-1.5 max-h-64 overflow-y-auto rounded-2xl border border-cream-200/60 p-3">
          {events.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">
              {hasConsented ? 'No activity recorded yet.' : 'No history is recorded until you enable interaction history.'}
            </p>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-cream-100/60 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.sensitivity === 'emotional' ? 'bg-warm-400' : 'bg-sage-400'}`} />
                  <span className="text-sm text-text-primary truncate">{eventLabels[ev.eventName] ?? ev.eventName}</span>
                </div>
                <span className="text-xs text-text-muted shrink-0">{new Date(ev.occurredAt).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 mb-4">
        <Button variant="ghost" size="sm" onClick={handleForgetLearned} disabled={busy}>
          <RotateCcw size={14} /> Forget what FocusBridge has learned
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download size={14} /> Export my data
        </Button>
      </div>

      {confirmDelete ? (
        <div className="rounded-2xl border-2 border-warm-200 bg-warm-50/40 p-4 space-y-3">
          <p className="text-sm text-text-primary font-medium">Delete activity history?</p>
          <p className="text-xs text-text-secondary leading-relaxed">
            This removes the interaction history FocusBridge uses for personalization. Your tasks
            and projects will remain. Your future experience will return to your saved manual
            preferences.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="soft" size="sm" onClick={handleDeleteHistory} disabled={busy}>
              <Trash2 size={14} /> Delete activity history
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={14} /> Delete activity history
        </Button>
      )}

      <div className="mt-5 flex items-start gap-2 text-xs text-text-muted">
        <HelpCircle size={14} className="shrink-0 mt-0.5" />
        <span>
          FocusBridge never scores or ranks your behavior, never records passwords or private
          browsing, and never presents your activity as a diagnosis. Emotional context is only ever
          taken from what you share explicitly.
        </span>
      </div>
    </Card>
  );
}