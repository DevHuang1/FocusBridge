import { fetchActivityEvents, savePersonalizationProfile } from './data';
import type { AIPersonalizationProfile, UserActivityEvent } from '../types';

const MIN_EVIDENCE = 3;

interface Counts {
  total: number;
  byKey: Record<string, { count: number; lastSeen: number }>;
}

function addCount(counts: Counts, key: string, occurredAt: string): void {
  counts.total += 1;
  const existing = counts.byKey[key];
  if (existing) {
    existing.count += 1;
    existing.lastSeen = Date.parse(occurredAt);
  } else {
    counts.byKey[key] = { count: 1, lastSeen: Date.parse(occurredAt) };
  }
}

function topKey(counts: Counts, minEvidence = MIN_EVIDENCE): { key: string; confidence: number } | null {
  if (counts.total < minEvidence) return null;
  const entries = Object.entries(counts.byKey).sort((a, b) => b[1].count - a[1].count);
  const [bestKey, best] = entries[0];
  if (!best || best.count < 2) return null;
  const confidence = Math.min(0.95, 0.5 + best.count / counts.total);
  return { key: bestKey, confidence };
}

function guidanceStyleFromSupport(preference?: string): 'next_step' | 'brief' | 'detailed' | null {
  switch (preference) {
    case 'choose_next_step': return 'next_step';
    case 'break_down_task': return 'brief';
    case 'realistic_plan': return 'detailed';
    default: return null;
  }
}

function animationFromPref(value: string): 'still' | 'soft' | 'balanced' | 'energizing' | null {
  if (['still', 'soft', 'balanced', 'energizing'].includes(value)) return value as never;
  return null;
}

export function buildProfileFromEvents(events: UserActivityEvent[]): AIPersonalizationProfile | null {
  if (events.length < MIN_EVIDENCE) return null;

  const sessionMinutes = new Set<number>();
  const acceptedSteps = new Set<number>();
  const simplified = makeCounts();
  const dismissedSuggestions = makeCounts();
  const guidance = makeCounts();
  const animation = makeCounts();
  const theme = makeCounts();
  const planningDepth = makeCounts();
  const restartPattern = makeCounts();
  const stepCounts: number[] = [];

  for (const event of events) {
    const p = event.properties;
    switch (event.eventName) {
      case 'focus_session_completed':
        if (typeof p.durationSeconds === 'number' && p.durationSeconds > 0) {
          sessionMinutes.add(Math.max(1, Math.round(p.durationSeconds / 60)));
        }
        break;
      case 'task_step_accepted':
        if (typeof p.durationMinutes === 'number') {
          acceptedSteps.add(p.durationMinutes);
        }
        break;
      case 'task_step_simplified':
        simplified.total += 1;
        break;
      case 'task_marked_stuck':
        simplified.total += 1;
        break;
      case 'task_breakdown_generated':
        if (typeof p.stepCount === 'number') stepCounts.push(p.stepCount);
        break;
      case 'ai_suggestion_dismissed':
        addCount(dismissedSuggestions, String(p.suggestionType ?? 'unknown'), event.occurredAt);
        break;
      case 'daily_check_in_completed': {
        const style = guidanceStyleFromSupport(typeof p.supportPreference === 'string' ? p.supportPreference : undefined);
        if (style) addCount(guidance, style, event.occurredAt);
        break;
      }
      case 'preference_changed': {
        const field = String(p.field ?? '');
        const value = String(p.value ?? '');
        if (field === 'animationIntensity') {
          const level = animationFromPref(value);
          if (level) addCount(animation, level, event.occurredAt);
        } else if (field === 'colorTheme') {
          addCount(theme, value, event.occurredAt);
        }
        break;
      }
      case 'roadmap_created':
        if (typeof p.milestoneCount === 'number') {
          addCount(planningDepth, p.milestoneCount <= 3 ? 'light' : p.milestoneCount >= 6 ? 'detailed' : 'moderate', event.occurredAt);
        }
        break;
      case 'task_started':
        addCount(restartPattern, 'resume_same_task', event.occurredAt);
        break;
      default:
        break;
    }
  }

  const preferredSessionValues = [...sessionMinutes, ...acceptedSteps].sort((a, b) => a - b);
  const preferredSessionMinutes = preferredSessionValues.length >= MIN_EVIDENCE
    ? preferredSessionValues.slice(0, 3)
    : undefined;

  const acceptedGuidance = topKey(guidance);
  const preferredAnimation = topKey(animation);
  const preferredTheme = topKey(theme);
  const planning = topKey(planningDepth);
  const restart = topKey(restartPattern, 1);
  const dismissed = topKey(dismissedSuggestions, 1);

  let breakdownPreference: AIPersonalizationProfile['taskBreakdownPreference'];
  if (simplified.total >= MIN_EVIDENCE) {
    breakdownPreference = 'smaller_steps';
  } else if (stepCounts.length >= MIN_EVIDENCE) {
    const avg = stepCounts.reduce((a, b) => a + b, 0) / stepCounts.length;
    breakdownPreference = avg < 4 ? 'smaller_steps' : avg > 5 ? 'larger_steps' : 'moderate_steps';
  }

  const confidenceByField: Record<string, number> = {};
  const explanations: string[] = [];
  if (preferredSessionMinutes) {
    const conf = Math.min(0.9, 0.5 + preferredSessionValues.length / 12);
    confidenceByField.preferredSessionMinutes = conf;
    explanations.push(`You have recently completed or accepted several ${preferredSessionMinutes.join('–')}-minute sessions, so FocusBridge may suggest a session in that range.`);
  }
  if (acceptedGuidance) {
    confidenceByField.commonlyAcceptedGuidanceStyle = acceptedGuidance.confidence;
    explanations.push(`Your recent check-ins and accepted suggestions most often point to "${acceptedGuidance.key}" guidance style.`);
  }
  if (breakdownPreference) {
    confidenceByField.taskBreakdownPreference = Math.min(0.85, 0.5 + simplified.total / 8);
    explanations.push(`You have simplified or asked for help with steps ${simplified.total} times recently, so FocusBridge may offer smaller steps by default.`);
  }
  if (preferredAnimation) {
    confidenceByField.preferredAnimationLevel = preferredAnimation.confidence;
    explanations.push(`You most often set animation to "${preferredAnimation.key}".`);
  }
  if (preferredTheme) {
    confidenceByField.preferredTheme = preferredTheme.confidence;
    explanations.push(`You most often use the "${preferredTheme.key}" theme.`);
  }
  if (planning) {
    confidenceByField.preferredPlanningDepth = planning.confidence;
    explanations.push(`Your recent roadmaps lean "${planning.key}" in detail.`);
  }
  if (restart) {
    confidenceByField.commonRestartPattern = restart.confidence;
    explanations.push(`You most often resume a task you already started.`);
  }
  if (dismissed) {
    confidenceByField.commonlyDismissedSuggestions = dismissed.confidence;
    explanations.push(`You have dismissed "${dismissed.key}" suggestions a few times, so FocusBridge will avoid pushing them.`);
  }

  if (Object.keys(confidenceByField).length === 0) return null;

  const explanation = explanations.length > 0
    ? explanations.slice(0, 3).join(' ')
    : 'Not enough recent activity to personalize yet.';

  return {
    preferredSessionMinutes,
    commonlyAcceptedGuidanceStyle: acceptedGuidance?.key as AIPersonalizationProfile['commonlyAcceptedGuidanceStyle'],
    taskBreakdownPreference: breakdownPreference,
    likelyHelpfulActions: breakdownPreference === 'smaller_steps'
      ? ['offer_smaller_steps', 'offer_short_session']
      : undefined,
    commonlyDismissedSuggestions: dismissed ? [dismissed.key] : undefined,
    preferredAnimationLevel: preferredAnimation?.key as AIPersonalizationProfile['preferredAnimationLevel'],
    preferredTheme: preferredTheme?.key as AIPersonalizationProfile['preferredTheme'],
    preferredPlanningDepth: planning?.key as AIPersonalizationProfile['preferredPlanningDepth'],
    commonRestartPattern: restart?.key as AIPersonalizationProfile['commonRestartPattern'],
    confidenceByField,
    lastUpdatedAt: new Date().toISOString(),
    explanation,
  };
}

export async function refreshPersonalizationProfile(userId: string): Promise<AIPersonalizationProfile | null> {
  const events = await fetchActivityEvents(userId, 200);
  const profile = buildProfileFromEvents(events);
  if (profile) {
    await savePersonalizationProfile(userId, profile);
  }
  return profile;
}

function makeCounts(): Counts {
  return { total: 0, byKey: {} };
}