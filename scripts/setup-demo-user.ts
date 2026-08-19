// Provisions the demo account via the Firebase Admin SDK and seeds a
// realistic set of data + activity events so the demo dump looks like a
// real few days of use.
//
//   npm run demo:setup
//
// Requires Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH
// (or GOOGLE_APPLICATION_CREDENTIALS) to a service-account JSON file, or
// rely on the default credentials for your environment. Idempotent:
// re-running upserts the same user and data (activity events are keyed by
// a stable idempotency key so they are not duplicated).
import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? 'demo@focusbridge.app';
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? 'demo-pass-2026';

function loadAdmin() {
  const path =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) {
    console.error('Missing FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS in .env');
    process.exit(1);
  }
  const abs = resolve(path);
  if (!existsSync(abs)) {
    console.error(`Service account file not found: ${abs}`);
    process.exit(1);
  }
  const serviceAccount = JSON.parse(readFileSync(abs, 'utf8'));
  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
}

loadAdmin();
const auth = getAuth();
const db = getFirestore();

function uid(): string {
  return randomUUID();
}

function daysAgo(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function iso(daysAgoOffset: number, hour: number, minute = 0): string {
  return daysAgo(daysAgoOffset, hour, minute);
}

async function main() {
  // ─── 1. Create (or reuse) the demo user ──────────────────────
  let userId: string | null = null;

  try {
    const existing = await auth.getUserByEmail(DEMO_EMAIL);
    userId = existing.uid;
    console.log(`Demo user already exists: ${DEMO_EMAIL} (${userId})`);
  } catch (e: any) {
    if (e.code !== 'auth/user-not-found') {
      console.error(`Failed to look up demo user: ${e.message}`);
      process.exit(1);
    }
    const created = await auth.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      emailVerified: true,
      displayName: 'Demo User',
    });
    userId = created.uid;
    console.log(`Created demo user: ${DEMO_EMAIL} (${userId})`);
  }

  // ─── 2. Seed preferences + consent ───────────────────────────
  await db.collection('user_preferences').doc(userId).set({
    userId,
    theme: 'sage',
    animationLevel: 'soft',
    density: 'comfortable',
    guidanceStyle: 'brief',
    celebrationEffects: 'subtle',
    soundHaptics: 'off',
    reducedMotion: 'follow_system',
    aiAdaptation: 'suggestions_only',
    workRhythm: 'moderate',
    encouragementStyle: 'encouragement',
    dailyCheckInEnabled: true,
    updatedAt: iso(1, 9, 30),
  }, { merge: true });

  await db.collection('activity_tracking_preferences').doc(userId).set({
    userId,
    interactionHistory: true,
    aiPersonalization: true,
    dailyCheckInContext: true,
    conversationMemory: true,
    technicalDiagnostics: true,
    consentVersion: '1.0',
    hasConsented: true,
    updatedAt: iso(5, 8),
  }, { merge: true });

  await db.collection('ai_personalization_profiles').doc(userId).set({
    userId,
    profile: {
      preferredSessionMinutes: [25, 50],
      commonlyAcceptedGuidanceStyle: 'brief',
      taskBreakdownPreference: 'moderate_steps',
      likelyHelpfulActions: ['break_down_task', 'realistic_plan'],
      commonlyDismissedSuggestions: ['choose_next_step'],
      preferredAnimationLevel: 'soft',
      preferredTheme: 'sage',
    },
    lastUpdatedAt: iso(1, 9, 31),
  }, { merge: true });

  // ─── 3. Seed tasks + steps ───────────────────────────────────
  const taskA = uid();
  await db.collection('tasks').doc(taskA).set({
    userId,
    title: 'Draft quarterly review for work',
    description: 'Prepare the summary and highlights for the Q3 review meeting.',
    status: 'active',
    priority: 'high',
    scheduledFor: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    createdAt: iso(4, 14, 10),
    updatedAt: iso(1, 10, 5),
  });
  await Promise.all([
    db.collection('task_steps').doc(uid()).set({
      taskId: taskA, parentStepId: null, title: 'Collect metrics', instructions: 'Gather the numbers from the dashboard.', status: 'completed', position: 0, durationMinutes: 20, effortRange: 'low',
    }),
    db.collection('task_steps').doc(uid()).set({
      taskId: taskA, parentStepId: null, title: 'Write highlights', instructions: 'Turn the metrics into 3 bullet points.', status: 'completed', position: 1, durationMinutes: 15, effortRange: 'medium',
    }),
    db.collection('task_steps').doc(uid()).set({
      taskId: taskA, parentStepId: null, title: 'Assemble the deck', instructions: 'Put everything into the slide template.', status: 'pending', position: 2, durationMinutes: 25, effortRange: 'medium',
    }),
  ]);

  const taskB = uid();
  await db.collection('tasks').doc(taskB).set({
    userId,
    title: 'Book dentist appointment',
    description: '',
    status: 'pending',
    priority: 'low',
    scheduledFor: null,
    createdAt: iso(3, 16, 40),
    updatedAt: iso(3, 16, 40),
  });

  const taskC = uid();
  await db.collection('tasks').doc(taskC).set({
    userId,
    title: 'Reply to Sarah about the design mockups',
    description: 'She needs a decision on the header layout by Friday.',
    status: 'completed',
    priority: 'medium',
    scheduledFor: null,
    createdAt: iso(2, 11, 15),
    updatedAt: iso(1, 15, 20),
  });

  // ─── 4. Seed a project + roadmap ─────────────────────────────
  const projectId = uid();
  await db.collection('projects').doc(projectId).set({
    userId,
    title: 'Learn to cook 5 new dinners',
    description: 'A relaxed personal goal to build cooking confidence.',
    status: 'active',
    targetDate: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
    createdAt: iso(6, 18, 0),
    updatedAt: iso(1, 19, 10),
  });
  const node1 = uid();
  const node2 = uid();
  await Promise.all([
    db.collection('roadmap_nodes').doc(node1).set({
      projectId, title: 'Pick 5 recipes', outcome: 'A list of 5 chosen recipes.', position: 0, status: 'completed', suggestedTimeframe: '2 days', definitionOfDone: 'Recipes chosen and written down.',
    }),
    db.collection('roadmap_nodes').doc(node2).set({
      projectId, title: 'Cook the first two', outcome: 'Two dinners cooked successfully.', position: 1, status: 'in_progress', dependencies: [node1], suggestedTimeframe: '1 week', definitionOfDone: 'Two dinners cooked and eaten.',
    }),
    db.collection('roadmap_nodes').doc(uid()).set({
      projectId, title: 'Cook the last three', outcome: 'All five dinners cooked.', position: 2, status: 'pending', dependencies: [node2], suggestedTimeframe: '2 weeks', definitionOfDone: 'All five dinners cooked.',
    }),
  ]);

  // ─── 5. Seed check-ins + reflections ─────────────────────────
  await db.collection('daily_check_ins').doc(uid()).set({
    userId,
    date: new Date().toISOString().slice(0, 10),
    arrivalState: 'focused_low_energy',
    supportPreference: 'break_down_task',
    contextNote: 'Started a bit tired but want to make progress on the review.',
    createdAt: iso(0, 9, 10),
  });
  await db.collection('daily_reflections').doc(uid()).set({
    userId,
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    completedSummary: 'Finished the design mockup reply and started the review.',
    difficultyNote: 'Getting started took a while.',
    tomorrowNote: 'Try a shorter focus block first.',
    createdAt: iso(1, 18, 5),
  }, { merge: true });

  // ─── 6. Seed focus sessions ──────────────────────────────────
  await Promise.all([
    db.collection('focus_sessions').doc(uid()).set({
      userId, taskId: taskC, startedAt: iso(1, 13, 0), endedAt: iso(1, 13, 35), durationSeconds: 2100, status: 'completed',
    }),
    db.collection('focus_sessions').doc(uid()).set({
      userId, taskId: taskA, startedAt: iso(0, 10, 20), endedAt: iso(0, 11, 5), durationSeconds: 2700, status: 'completed',
    }),
  ]);

  // ─── 7. Seed activity events ─────────────────────────────────
  const events: {
    event_name: string;
    occurred_at: string;
    screen: string | null;
    object_type: string | null;
    object_id: string | null;
    properties: Record<string, string | number | boolean | null>;
    sensitivity: string;
  }[] = [
    { event_name: 'user_login', occurred_at: iso(5, 8, 2), screen: 'auth', object_type: null, object_id: null, properties: {}, sensitivity: 'standard' },
    { event_name: 'screen_viewed', occurred_at: iso(5, 8, 5), screen: 'dashboard', object_type: null, object_id: null, properties: {}, sensitivity: 'standard' },
    { event_name: 'screen_viewed', occurred_at: iso(5, 8, 12), screen: 'planning', object_type: null, object_id: null, properties: {}, sensitivity: 'standard' },
    { event_name: 'roadmap_created', occurred_at: iso(5, 8, 20), screen: 'planning', object_type: 'project', object_id: projectId, properties: { milestoneCount: 3 }, sensitivity: 'standard' },
    { event_name: 'roadmap_node_opened', occurred_at: iso(5, 8, 35), screen: 'planning', object_type: 'roadmap_node', object_id: node1, properties: { nodeIndex: 0 }, sensitivity: 'standard' },
    { event_name: 'task_created', occurred_at: iso(4, 14, 12), screen: 'work_tasks', object_type: 'task', object_id: taskA, properties: { priority: 'high', scheduled: true }, sensitivity: 'standard' },
    { event_name: 'task_breakdown_generated', occurred_at: iso(4, 14, 18), screen: 'work_tasks', object_type: 'task', object_id: taskA, properties: { stepCount: 3 }, sensitivity: 'standard' },
    { event_name: 'task_step_accepted', occurred_at: iso(4, 14, 20), screen: 'work_tasks', object_type: 'task_step', object_id: taskA, properties: { stepIndex: 0, durationMinutes: 20 }, sensitivity: 'standard' },
    { event_name: 'user_login', occurred_at: iso(3, 16, 30), screen: 'auth', object_type: null, object_id: null, properties: {}, sensitivity: 'standard' },
    { event_name: 'screen_viewed', occurred_at: iso(3, 16, 33), screen: 'dashboard', object_type: null, object_id: null, properties: {}, sensitivity: 'standard' },
    { event_name: 'task_created', occurred_at: iso(3, 16, 42), screen: 'work_tasks', object_type: 'task', object_id: taskB, properties: { priority: 'low', scheduled: false }, sensitivity: 'standard' },
    { event_name: 'user_login', occurred_at: iso(2, 11, 10), screen: 'auth', object_type: null, object_id: null, properties: {}, sensitivity: 'standard' },
    { event_name: 'daily_check_in_completed', occurred_at: iso(2, 11, 14), screen: 'check_in', object_type: null, object_id: null, properties: { arrivalState: 'calm_and_ready', supportPreference: 'realistic_plan' }, sensitivity: 'emotional' },
    { event_name: 'task_created', occurred_at: iso(2, 11, 17), screen: 'work_tasks', object_type: 'task', object_id: taskC, properties: { priority: 'medium', scheduled: false }, sensitivity: 'standard' },
    { event_name: 'task_completed', occurred_at: iso(1, 15, 22), screen: 'work_tasks', object_type: 'task', object_id: taskC, properties: { stepIndex: 0 }, sensitivity: 'standard' },
    { event_name: 'ai_suggestion_accepted', occurred_at: iso(1, 15, 25), screen: 'work_tasks', object_type: 'ai_request', object_id: null, properties: { suggestionType: 'break_down_task' }, sensitivity: 'standard' },
    { event_name: 'focus_session_started', occurred_at: iso(1, 13, 2), screen: 'focus', object_type: 'focus_session', object_id: null, properties: { durationMinutes: 25 }, sensitivity: 'standard' },
    { event_name: 'focus_session_completed', occurred_at: iso(1, 13, 37), screen: 'focus', object_type: 'focus_session', object_id: null, properties: { durationSeconds: 2100 }, sensitivity: 'standard' },
    { event_name: 'user_login', occurred_at: iso(0, 9, 8), screen: 'auth', object_type: null, object_id: null, properties: {}, sensitivity: 'standard' },
    { event_name: 'daily_check_in_completed', occurred_at: iso(0, 9, 12), screen: 'check_in', object_type: null, object_id: null, properties: { arrivalState: 'focused_low_energy', supportPreference: 'break_down_task' }, sensitivity: 'emotional' },
    { event_name: 'focus_session_started', occurred_at: iso(0, 10, 22), screen: 'focus', object_type: 'focus_session', object_id: null, properties: { durationMinutes: 45 }, sensitivity: 'standard' },
    { event_name: 'task_step_simplified', occurred_at: iso(0, 10, 40), screen: 'focus', object_type: 'task_step', object_id: taskA, properties: { stepIndex: 1 }, sensitivity: 'standard' },
    { event_name: 'focus_session_completed', occurred_at: iso(0, 11, 7), screen: 'focus', object_type: 'focus_session', object_id: null, properties: { durationSeconds: 2700 }, sensitivity: 'standard' },
    { event_name: 'preference_changed', occurred_at: iso(0, 12, 30), screen: 'settings', object_type: 'preference', object_id: null, properties: { field: 'theme', value: 'sage' }, sensitivity: 'standard' },
  ];

  const batch = db.batch();
  for (const ev of events) {
    const ref = db.collection('user_activity_events').doc(uid());
    batch.set(ref, {
      userId,
      eventName: ev.event_name,
      occurredAt: ev.occurred_at,
      timezone: 'UTC',
      source: 'web',
      screen: ev.screen,
      objectType: ev.object_type,
      objectId: ev.object_id,
      properties: ev.properties,
      sensitivity: ev.sensitivity,
      idempotencyKey: `seed:${DEMO_EMAIL}:${ev.event_name}:${ev.occurred_at}`,
      createdAt: ev.occurred_at,
    });
  }
  await batch.commit();

  console.log(`Seeded data + ${events.length} activity events for ${DEMO_EMAIL}`);
  console.log('Next: npm run demo:activity  to refresh the activity table in DEMO_USER.md');
}

main();