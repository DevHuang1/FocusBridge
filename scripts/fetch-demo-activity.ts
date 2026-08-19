// Fetches the demo user's activity events from Firestore and writes them
// into DEMO_USER.md between the DEMO-ACTIVITY markers.
//
//   npm run demo:activity
//
// Uses the Firebase Admin SDK with the service-account credentials in .env
// (FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS).
import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKDOWN_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'DEMO_USER.md');
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? 'demo@focusbridge.app';

function loadAdmin() {
  const path =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
    process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) {
    console.error('Missing FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS in .env');
    process.exit(1);
  }
  const abs = resolve(path);
  const serviceAccount = JSON.parse(readFileSync(abs, 'utf8'));
  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
}

interface ActivityRow {
  occurredAt: string;
  eventName: string;
  screen: string | null;
  properties: Record<string, unknown> | null;
}

async function main() {
  loadAdmin();
  const auth = getAuth();
  const db = getFirestore();

  const user = await auth.getUserByEmail(DEMO_EMAIL);
  const userId = user.uid;

  const eventsSnap = await db
    .collection('user_activity_events')
    .where('userId', '==', userId)
    .orderBy('occurredAt', 'desc')
    .limit(500)
    .get();

  const prefsSnap = await db.collection('activity_tracking_preferences').doc(userId).get();
  const prefs = prefsSnap.exists ? prefsSnap.data() : null;

  const rows = eventsSnap.docs.map((d) => d.data() as ActivityRow);
  const table = rows.length
    ? rows
        .map((e) => {
          const props = e.properties && Object.keys(e.properties).length ? JSON.stringify(e.properties) : '';
          const screen = e.screen ?? '';
          return `| ${e.occurredAt} | ${e.eventName} | ${screen} | ${props} |`;
        })
        .join('\n')
    : '| _no activity yet_ | | | |';

  const consentLine = prefs
    ? `Consent: interactionHistory=${prefs.interactionHistory}, aiPersonalization=${prefs.aiPersonalization}, dailyCheckInContext=${prefs.dailyCheckInContext}, conversationMemory=${prefs.conversationMemory}, technicalDiagnostics=${prefs.technicalDiagnostics}, consentVersion=${prefs.consentVersion}, hasConsented=${prefs.hasConsented}`
    : 'Consent: not set yet';

  const section = `## Demo User Activity

Generated: ${new Date().toISOString()} — user ${DEMO_EMAIL} (id \`${userId}\`), ${rows.length} events.

${consentLine}

| Timestamp | Event | Screen | Properties |
|---|---|---|---|
${table}`;

  let md = '';
  try {
    md = readFileSync(MARKDOWN_PATH, 'utf8');
  } catch {
    md = '';
  }

  const startTag = '<!-- DEMO-ACTIVITY-START -->';
  const endTag = '<!-- DEMO-ACTIVITY-END -->';
  const startIdx = md.indexOf(startTag);
  const endIdx = md.indexOf(endTag);
  if (startIdx >= 0 && endIdx >= 0) {
    md = md.slice(0, startIdx) + startTag + '\n' + section + '\n' + endTag + md.slice(endIdx + endTag.length);
  } else {
    md = md.replace(/\s*$/, '') + '\n\n' + startTag + '\n' + section + '\n' + endTag + '\n';
  }

  writeFileSync(MARKDOWN_PATH, md);
  console.log(`Wrote ${rows.length} events for ${DEMO_EMAIL} to ${MARKDOWN_PATH}`);
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});