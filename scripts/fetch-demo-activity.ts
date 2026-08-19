// Fetches the demo user's activity events from Supabase and writes them
// into DEMO_USER.md between the DEMO-ACTIVITY markers.
//
//   npm run demo:activity
//
// Uses the demo user's own credentials + anon key, so RLS only returns
// the demo account's rows. Never requires (or touches) a service key.
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKDOWN_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'DEMO_USER.md');
const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? 'demo@focusbridge.app';
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD ?? 'demo-pass-2026';

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

interface ActivityRow {
  occurred_at: string;
  event_name: string;
  screen: string | null;
  properties: Record<string, unknown> | null;
}

async function main() {
  const supabase = createClient(url, anonKey);

  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
  if (authError) {
    console.error(`Sign-in failed for ${DEMO_EMAIL}: ${authError.message}`);
    process.exit(1);
  }
  const userId = auth.user.id;

  const { data: events, error: evError } = await supabase
    .from('user_activity_events')
    .select('occurred_at, event_name, screen, properties')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .limit(500);
  if (evError) {
    console.error(`Failed to fetch activity: ${evError.message}`);
    process.exit(1);
  }

  const { data: prefs } = await supabase
    .from('activity_tracking_preferences')
    .select('interaction_history, ai_personalization, daily_check_in_context, conversation_memory, technical_diagnostics, consent_version, has_consented')
    .eq('user_id', userId)
    .maybeSingle();

  const rows = (events ?? []) as ActivityRow[];
  const table = rows.length
    ? rows
        .map((e) => {
          const props = e.properties && Object.keys(e.properties).length ? JSON.stringify(e.properties) : '';
          const screen = e.screen ?? '';
          return `| ${e.occurred_at} | ${e.event_name} | ${screen} | ${props} |`;
        })
        .join('\n')
    : '| _no activity yet_ | | | |';

  const consentLine = prefs
    ? `Consent: interactionHistory=${prefs.interaction_history}, aiPersonalization=${prefs.ai_personalization}, dailyCheckInContext=${prefs.daily_check_in_context}, conversationMemory=${prefs.conversation_memory}, technicalDiagnostics=${prefs.technical_diagnostics}, consentVersion=${prefs.consent_version}, hasConsented=${prefs.has_consented}`
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

main();