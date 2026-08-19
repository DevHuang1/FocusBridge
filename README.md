# FocusBridge

A calm, personalized, ADHD-friendly productivity workspace. FocusBridge helps you reduce overwhelm, identify one practical next step, and reflect on progress without shame or excessive cognitive load.

## Features

- **Daily Check-In**: Warm, optional morning prompt to set up your day
- **Work Tasks**: AI-powered task breakdown into small, actionable steps
- **Planning Mode**: Roadmap view for larger goals with milestones
- **Personalization**: Color themes, animation intensity, density, guidance style
- **Consent-Based Activity Tracking**: Remembers meaningful interactions (screens, buttons, task behavior, sessions) only after explicit opt-in
- **Adaptive AI**: The assistant reads an explainable personalization profile and adapts suggestions within user-selected limits
- **Privacy Controls**: Granular consent switches, activity viewer, export, "forget what FocusBridge has learned", and one-click activity deletion
- **Reduced Motion**: Full support for `prefers-reduced-motion` and in-app override
- **Compassionate Language**: No shame, guilt, or pressure mechanics

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_FEATHERLESS_API_KEY` | Featherless AI API key (for task breakdown) |

### 2. Supabase Database

Run the migration SQL in your Supabase SQL Editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Run `supabase/migrations/002_activity_tracking.sql` in the same way
4. Run `supabase/migrations/003_consent_v2_audit.sql` (idempotent; upgrades existing consent columns and adds the AI context audit table)

This creates all required tables with Row Level Security (RLS) policies.

### 3. Install & Run

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173` (Vite) with an Express proxy on port 3001 for AI calls.

### 4. Build

```bash
npm run build
```

### 5. Test

```bash
npm test
```

Runs the automated test suite (vitest) covering redaction, prompt-injection detection, event validation, and the context assembly engine.

## Architecture

```
src/
├── App.tsx                          # Root with screen routing
├── index.css                        # Tailwind v4 theme + color themes
├── types/index.ts                   # All TypeScript types
├── store/
│   ├── useAppStore.ts               # Main app state (Zustand + persist)
│   ├── usePersonalizationStore.ts   # Preferences, check-in, theme
│   └── useConsentStore.ts           # Consent choices (Zustand + persist)
├── contexts/
│   └── AuthContext.tsx               # Supabase auth provider
├── lib/
│   ├── ai.ts                        # AI service (Featherless/Vercel AI SDK)
│   ├── supabase.ts                  # Supabase client
│   ├── data.ts                      # Supabase CRUD functions
│   ├── activity.ts                  # Consent-gated typed event tracking
│   ├── context.ts                   # Client wrapper: assembles AI context
│   ├── contextEngine.ts             # AIContextAssemblyEngine (v1.0 envelopes)
│   ├── redact.ts                    # Secret/value redaction rules
│   ├── injection.ts                 # Prompt-injection detection + delimiting
│   └── personalization.ts           # Explainable profile builder
├── components/
│   ├── Button.tsx                   # Theme-aware button
│   ├── Card.tsx                     # Card container with style prop
│   ├── CalmMotion.tsx               # Animation-aware motion wrapper
│   ├── CheckInFlow.tsx              # Daily check-in prompt + summary
│   ├── TextInput.tsx                # Auto-focus textarea
│   └── ...                          # Other existing components
└── screens/
    ├── DashboardScreen.tsx           # Calm daily home base
    ├── WorkTasksScreen.tsx           # Task breakdown + tree view
    ├── PlanningScreen.tsx            # Roadmap + milestones
    ├── SettingsScreen.tsx            # Personalization controls
    ├── FocusScreen.tsx               # Active timer view
    ├── ReflectionScreen.tsx          # Post-session summary
    └── ...
```

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | User display name, timezone |
| `user_preferences` | All personalization settings |
| `daily_check_ins` | Optional daily self-reported state |
| `tasks` | Executable work tasks |
| `task_steps` | Tree breakdown children |
| `projects` | Planning-mode projects |
| `roadmap_nodes` | Planning milestones |
| `focus_sessions` | Timed work sessions |
| `daily_reflections` | End-of-day reflections |
| `ai_interactions` | Optional audit history |
| `user_activity_events` | Consent-based typed interaction events |
| `activity_tracking_preferences` | Consent choices and tracking state |
| `ai_personalization_profiles` | Derived, explainable preferences (not raw event dumps) |
| `ai_context_snapshots` | Compact summaries used for AI continuity |
| `ai_interaction_feedback` | Accepted / edited / dismissed suggestion outcomes |
| `ai_context_audit` | Metadata-only records of each assembled AI context |
| `activity_deletion_requests` | Records deletion and reset actions |

All tables have RLS policies ensuring users can only access their own data.

## Activity Tracking & Adaptive AI

The activity system is privacy-first and consent-gated:

- **Nothing is recorded until the user consents** on the first-use consent card.
- **Typed event taxonomy** (`src/lib/activity.ts`) with allowlisted properties per event — raw keystrokes, passwords, clipboard, microphone, and camera data are never collected. Each event declares its purpose, sensitivity, consent category, AI eligibility, and retention window (`maxAgeDays`).
- **Granular controls** in Settings → Privacy & personalization: interaction history, AI personalization, daily check-in context, conversation memory, and technical diagnostics. Consent is versioned (`consentVersion`) and timestamped.
- **Offline-safe**: events queue locally and flush later, only if consent is still active; retries are idempotent.
- **Explainable profile** (`src/lib/personalization.ts`) derives preferences with confidence values and plain-language explanations.
- **No hidden scoring**: FocusBridge never infers emotion from behavior and never presents activity as a diagnosis.

## AI Context Assembly Engine

Every LLM call goes through a staged pipeline (`src/lib/contextEngine.ts`) that builds a versioned `AIContextEnvelope` (`schemaVersion: '1.0'`) containing only the minimum, consent-checked, redacted context:

1. **Authorize** — request must carry the active user id; otherwise a minimal envelope is returned.
2. **Load consent** — latest stored preferences (fallback to the local consent store).
3. **Classify intent** — deterministic keyword classification into one of nine intents.
4. **Relevance policy** — each intent maps to a policy that is **intersected with consent** (e.g. activity patterns require both `aiPersonalization` and `interactionHistory`; daily context additionally requires `dailyCheckInContext`).
5. **Retrieve minimal records** — only consent-approved, AI-eligible events within their retention window are read (RLS-scoped).
6. **Redact** (`src/lib/redact.ts`) — API keys, bearer tokens, private keys, JWTs, credentials, emails, phone numbers, card numbers, IDs, and session tokens are replaced with `[REDACTED_...]` markers before summarization. Values are never stored.
7. **Prompt-injection guard** (`src/lib/injection.ts`) — user-authored text (task titles, notes, event properties, prior AI output) is scanned for heuristic injection signals; detected signals add an explicit safety directive, and all user-authored content is delimited as untrusted data in the prompt.
8. **Deterministic summarization** — events are aggregated into labeled patterns (`derivedPreferences`, `recentRelevantPatterns`) with evidence windows, counts, and confidence. No emotional inference.
9. **Token budget** — `applyTokenBudget` drops lowest-priority sections until under `MAX_CONTEXT_TOKENS`; it never drops `safetyDirectives`, the request, or consent/exclusion metadata.
10. **Audit** — a metadata-only record (request id, intent, consent applied/excluded, counts, redaction counts, token estimate, outcome) is written to `ai_context_audit`. It never contains task text, secrets, or the assembled prompt.

**Minimal fallback**: any failure (DB down, auth, policy error) returns `buildMinimalEnvelope` — the request plus the untrusted-data directive — so ordinary task assistance is never blocked.

**Message hierarchy** (`src/lib/ai.ts`): the system message carries behavior rules plus any safety directives; the envelope is delivered as a separate user message labeled as DATA (not instructions), followed by the current request. This keeps untrusted context isolated from instructions.

**Production note**: the engine currently runs client-side with Supabase RLS isolating per-user data. For a stricter security posture, move stages 1–8 into a server-side endpoint keyed by the user's session.

## Design Principles

1. **Reduce cognitive load** — Show one clear next action by default
2. **Support task initiation** — Help move from intention to small first step
3. **Compassionate language** — Never shame for missed tasks or low energy
4. **Progressive complexity** — Simple default, expandable details
5. **User control** — AI recommends, never silently changes work
6. **Calm continuity** — Personalization makes it more comfortable over time
7. **Accessibility** — Keyboard nav, contrast, reduced motion, screen readers
8. **No medical claims** — Self-reported context, not diagnosis
