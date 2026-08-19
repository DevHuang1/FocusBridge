import { insertActivityEvent } from './data';
import { useConsentStore } from '../store/useConsentStore';
import type {
  ActivityConsentCategory,
  ActivityEventDefinition,
  ActivityEventName,
  ActivitySensitivity,
  UserActivityEvent,
} from '../types';

// ─── Event Taxonomy ─────────────────────────────────────────────
// Each event declares its purpose, sensitivity, allowed properties,
// consent requirement, AI eligibility, and retention window.
interface EventSpec {
  sensitivity: ActivitySensitivity;
  category: ActivityConsentCategory;
  purpose: ActivityEventDefinition['purpose'];
  allowedProperties: string[];
  aiEligible: boolean;
  maxAgeDays: number;
}

const EVENT_SPECS: Record<ActivityEventName, EventSpec> = {
  screen_viewed: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'navigation', allowedProperties: ['screen'], aiEligible: false, maxAgeDays: 90 },
  navigation_changed: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'navigation', allowedProperties: ['from', 'to'], aiEligible: false, maxAgeDays: 90 },
  button_pressed: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'navigation', allowedProperties: ['button'], aiEligible: false, maxAgeDays: 90 },

  task_created: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'task_support', allowedProperties: ['priority', 'scheduled'], aiEligible: true, maxAgeDays: 90 },
  task_updated: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'task_support', allowedProperties: ['field'], aiEligible: true, maxAgeDays: 90 },
  task_started: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'task_support', allowedProperties: ['stepIndex'], aiEligible: true, maxAgeDays: 90 },
  task_completed: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'task_support', allowedProperties: ['stepIndex'], aiEligible: true, maxAgeDays: 90 },
  task_postponed: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'task_support', allowedProperties: [], aiEligible: true, maxAgeDays: 90 },
  task_archived: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'task_support', allowedProperties: [], aiEligible: true, maxAgeDays: 90 },
  task_breakdown_generated: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'task_support', allowedProperties: ['stepCount'], aiEligible: true, maxAgeDays: 90 },

  task_step_accepted: { sensitivity: 'standard', category: 'aiPersonalization', purpose: 'task_support', allowedProperties: ['stepIndex', 'durationMinutes'], aiEligible: true, maxAgeDays: 90 },
  task_step_dismissed: { sensitivity: 'standard', category: 'aiPersonalization', purpose: 'task_support', allowedProperties: ['stepIndex'], aiEligible: true, maxAgeDays: 90 },
  task_step_simplified: { sensitivity: 'standard', category: 'aiPersonalization', purpose: 'task_support', allowedProperties: ['stepIndex'], aiEligible: true, maxAgeDays: 90 },
  task_step_drilled_down: { sensitivity: 'standard', category: 'aiPersonalization', purpose: 'task_support', allowedProperties: ['childCount'], aiEligible: true, maxAgeDays: 90 },
  task_marked_stuck: { sensitivity: 'standard', category: 'aiPersonalization', purpose: 'task_support', allowedProperties: ['stepIndex'], aiEligible: true, maxAgeDays: 90 },

  roadmap_created: { sensitivity: 'standard', category: 'aiPersonalization', purpose: 'planning_support', allowedProperties: ['milestoneCount'], aiEligible: true, maxAgeDays: 90 },
  roadmap_node_opened: { sensitivity: 'standard', category: 'aiPersonalization', purpose: 'planning_support', allowedProperties: ['nodeIndex'], aiEligible: true, maxAgeDays: 90 },
  roadmap_node_converted_to_task: { sensitivity: 'standard', category: 'aiPersonalization', purpose: 'planning_support', allowedProperties: ['nodeIndex'], aiEligible: true, maxAgeDays: 90 },

  focus_session_started: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'session_support', allowedProperties: ['durationMinutes'], aiEligible: true, maxAgeDays: 90 },
  focus_session_paused: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'session_support', allowedProperties: ['elapsedSeconds'], aiEligible: false, maxAgeDays: 90 },
  focus_session_resumed: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'session_support', allowedProperties: [], aiEligible: false, maxAgeDays: 90 },
  focus_session_completed: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'session_support', allowedProperties: ['durationSeconds'], aiEligible: true, maxAgeDays: 90 },
  focus_session_abandoned: { sensitivity: 'standard', category: 'interactionHistory', purpose: 'session_support', allowedProperties: ['elapsedSeconds'], aiEligible: false, maxAgeDays: 90 },
  focus_preset_selected: { sensitivity: 'standard', category: 'aiPersonalization', purpose: 'session_support', allowedProperties: ['preset', 'minutes', 'mode'], aiEligible: true, maxAgeDays: 90 },
  soft_start_completed: { sensitivity: 'standard', category: 'aiPersonalization', purpose: 'session_support', allowedProperties: ['outcome', 'starterMinutes'], aiEligible: true, maxAgeDays: 90 },
  transition_bridge_completed: { sensitivity: 'standard', category: 'aiPersonalization', purpose: 'session_support', allowedProperties: ['phase', 'choice'], aiEligible: true, maxAgeDays: 90 },

  preference_changed: { sensitivity: 'standard', category: 'aiPersonalization', purpose: 'preference_support', allowedProperties: ['field', 'value'], aiEligible: true, maxAgeDays: 365 },

  daily_check_in_completed: { sensitivity: 'emotional', category: 'dailyCheckInContext', purpose: 'task_support', allowedProperties: ['arrivalState', 'supportPreference'], aiEligible: true, maxAgeDays: 30 },
  daily_check_in_skipped: { sensitivity: 'standard', category: 'dailyCheckInContext', purpose: 'task_support', allowedProperties: [], aiEligible: false, maxAgeDays: 30 },

  ai_request_created: { sensitivity: 'standard', category: 'conversationMemory', purpose: 'task_support', allowedProperties: ['type'], aiEligible: false, maxAgeDays: 90 },
  ai_suggestion_accepted: { sensitivity: 'standard', category: 'conversationMemory', purpose: 'task_support', allowedProperties: ['suggestionType'], aiEligible: true, maxAgeDays: 90 },
  ai_suggestion_edited: { sensitivity: 'standard', category: 'conversationMemory', purpose: 'task_support', allowedProperties: ['suggestionType'], aiEligible: true, maxAgeDays: 90 },
  ai_suggestion_dismissed: { sensitivity: 'standard', category: 'conversationMemory', purpose: 'task_support', allowedProperties: ['suggestionType'], aiEligible: true, maxAgeDays: 90 },

  activity_tracking_paused: { sensitivity: 'standard', category: 'control', purpose: 'task_support', allowedProperties: [], aiEligible: false, maxAgeDays: 365 },
  activity_history_deleted: { sensitivity: 'standard', category: 'control', purpose: 'task_support', allowedProperties: [], aiEligible: false, maxAgeDays: 365 },
  user_login: { sensitivity: 'standard', category: 'control', purpose: 'navigation', allowedProperties: [], aiEligible: false, maxAgeDays: 365 },
};

export function getEventDefinition(name: ActivityEventName): ActivityEventDefinition | null {
  const spec = EVENT_SPECS[name];
  if (!spec) return null;
  return {
    name,
    purpose: spec.purpose,
    sensitivity: spec.sensitivity,
    allowedProperties: spec.allowedProperties,
    requiresConsent: spec.category === 'control' ? null : spec.category,
    aiEligible: spec.aiEligible,
    maxAgeDays: spec.maxAgeDays,
  };
}

export const ALL_EVENT_NAMES = Object.keys(EVENT_SPECS) as ActivityEventName[];

export interface PropertyValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateEventProperties(
  name: ActivityEventName,
  properties: Record<string, unknown>,
): PropertyValidationResult {
  const spec = EVENT_SPECS[name];
  if (!spec) return { valid: false, reason: 'unknown_event' };
  for (const [key, value] of Object.entries(properties ?? {})) {
    if (!spec.allowedProperties.includes(key)) {
      return { valid: false, reason: `disallowed_property:${key}` };
    }
    if (typeof value === 'string' && value.length > 200) {
      return { valid: false, reason: `oversized_property:${key}` };
    }
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && value !== null) {
      return { valid: false, reason: `invalid_property_type:${key}` };
    }
  }
  return { valid: true };
}

// ─── Queue (offline) ────────────────────────────────────────────
const QUEUE_KEY = 'focusbridge-activity-queue';
const MAX_QUEUE = 200;
const DEBOUNCE_MS = 1500;

let sessionId: string | null = null;
let activeUserId: string | null = null;

export function getSessionId(): string {
  if (!sessionId) sessionId = crypto.randomUUID();
  return sessionId;
}

export function setActiveUserId(id: string | null): void {
  activeUserId = id;
  if (id && typeof navigator !== 'undefined' && navigator.onLine) {
    flushQueue();
  }
}

export function getActiveUserId(): string | null {
  return activeUserId;
}

function readQueue(): UserActivityEvent[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as UserActivityEvent[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(events: UserActivityEvent[]): void {
  try {
    if (events.length === 0) {
      localStorage.removeItem(QUEUE_KEY);
    } else {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-MAX_QUEUE)));
    }
  } catch {}
}

// ─── Consent Gating ─────────────────────────────────────────────
function categoryAllowed(category: ActivityConsentCategory): boolean {
  const { consent, hasConsented } = useConsentStore.getState();
  if (!hasConsented) return false;
  switch (category) {
    case 'interactionHistory': return consent.interactionHistory;
    case 'aiPersonalization': return consent.aiPersonalization;
    case 'dailyCheckInContext': return consent.dailyCheckInContext;
    case 'conversationMemory': return consent.conversationMemory;
    case 'technicalDiagnostics': return consent.technicalDiagnostics;
    case 'control': return true;
    default: return false;
  }
}

// ─── Validation ─────────────────────────────────────────────────
function sanitizeProperties(spec: EventSpec, properties: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const clean: Record<string, string | number | boolean | null> = {};
  for (const key of spec.allowedProperties) {
    const value = properties[key];
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') clean[key] = value.slice(0, 200);
    else if (typeof value === 'number' || typeof value === 'boolean') clean[key] = value;
  }
  return clean;
}

const debounced = new Map<string, number>();

function isDebounced(name: ActivityEventName): boolean {
  const now = Date.now();
  const last = debounced.get(name) ?? 0;
  if (now - last < DEBOUNCE_MS) return true;
  debounced.set(name, now);
  return false;
}

// ─── Flush ──────────────────────────────────────────────────────
export async function flushQueue(): Promise<void> {
  const queue = readQueue();
  if (queue.length === 0) return;
  const retained: UserActivityEvent[] = [];

  for (const event of queue) {
    // Drop events from a previous sign-in or pre-auth state: they can never
    // pass the Firestore rules (userId must match the caller's uid) and would
    // otherwise fail and re-queue forever.
    if (event.userId !== activeUserId) continue;
    if (!categoryAllowed(EVENT_SPECS[event.eventName].category)) continue;
    const ok = await insertActivityEvent(event);
    if (!ok) retained.push(event);
  }

  writeQueue(retained);
}

// ─── Public API ─────────────────────────────────────────────────
export interface TrackOptions {
  screen?: string;
  objectType?: UserActivityEvent['objectType'];
  objectId?: string;
  properties?: Record<string, unknown>;
}

export function trackActivity(
  eventName: ActivityEventName,
  options: TrackOptions = {},
): void {
  const spec = EVENT_SPECS[eventName];
  if (!spec) return;

  const userId = activeUserId;
  if (!userId) return;

  if (spec.category !== 'control' && !categoryAllowed(spec.category)) return;
  if (spec.category !== 'control' && isDebounced(eventName)) return;

  const event: UserActivityEvent = {
    id: crypto.randomUUID(),
    userId,
    sessionId: getSessionId(),
    eventName,
    occurredAt: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    source: 'web',
    screen: options.screen,
    objectType: options.objectType,
    objectId: options.objectId,
    properties: sanitizeProperties(spec, options.properties ?? {}),
    sensitivity: spec.sensitivity,
    consentContext: {
      interactionHistory: useConsentStore.getState().consent.interactionHistory,
      aiPersonalization: useConsentStore.getState().consent.aiPersonalization,
      dailyCheckInContext: useConsentStore.getState().consent.dailyCheckInContext,
      conversationMemory: useConsentStore.getState().consent.conversationMemory,
    },
  };

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    writeQueue([...readQueue(), event]);
    return;
  }

  // Record only once per event (idempotent retries). If the write
  // fails (e.g. offline mid-flight), queue it for a later retry.
  void insertActivityEvent(event).then((ok) => {
    if (!ok) writeQueue([...readQueue(), event]);
  });
}

export function clearActivityQueue(): void {
  writeQueue([]);
}

// ─── Online rehydration ─────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void flushQueue();
  });
}

export function isActivityTrackingEnabled(): boolean {
  const { consent, hasConsented } = useConsentStore.getState();
  return hasConsented && consent.interactionHistory;
}