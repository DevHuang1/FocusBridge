# FocusBridge

A calm, personalized, ADHD-friendly productivity workspace. FocusBridge helps you reduce overwhelm, identify one practical next step, and reflect on progress without shame or excessive cognitive load.

## Tech Stack

![React](https://raw.githubusercontent.com/github/explore/main/topics/react/react-24.png&nbsp;width=24&height=24) ![TypeScript](https://raw.githubusercontent.com/github/explore/main/topics/typescript/typescript-24.png&nbsp;width=24&height=24) ![Vite](https://raw.githubusercontent.com/github/explore/main/topics/vite/vite-24.png&nbsp;width=24&height=24) ![Tailwind CSS](https://raw.githubusercontent.com/github/explore/main/topics/tailwindcss/tailwindcss-24.png&nbsp;width=24&height=24) ![Firebase](https://raw.githubusercontent.com/github/explore/main/topics/firebase/firebase-24.png&nbsp;width=24&height=24) ![OpenRouter](https://raw.githubusercontent.com/github/explore/main/topics/openrouter/openrouter-24.png&nbsp;width=24&height=24)

---

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
| `VITE_FIREBASE_API_KEY` | Firebase web app API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain (your-project.firebaseapp.com) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket (your-project.appspot.com) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase web app ID |
| `VITE_OPENROUTER_API_KEY` | OpenRouter AI API key (default provider, for task breakdown) |

### 2. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Email/Password** in Authentication → Sign-in method
3. Add a web app to get the Firebase config keys above
4. Deploy Firestore security rules and Cloud Functions (optional):

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
cd functions && npm install && npm run build
cd .. && firebase deploy --only functions
```

### 3. Install & Run

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173` (Vite). AI calls go directly to the LLM provider (or through the Cloud Function if `VITE_FIREBASE_FUNCTIONS_URL` is set).

### 4. Demo Account

Seeds the demo user (`demo@focusbridge.app` / `demo-pass-2026`) with realistic data and activity events:

```bash
npm run demo:setup
npm run demo:activity
```

`demo:setup` uses the Firebase Admin SDK (service-account JSON from Project settings → Service accounts) and is idempotent. `demo:activity` refreshes the activity table in `DEMO_USER.md` (never committed). A one-touch **"Try the demo account"** button on the auth screen signs straight in.

### 5. Build

```bash
npm run build
```

### 6. Test

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
│   └── AuthContext.tsx              # Firebase Auth provider
├── lib/
│   ├── ai.ts                        # AI service (OpenRouter/Featherless)
│   ├── firebase.ts                  # Firebase client (Auth + Firestore)
│   ├── data.ts                      # Firestore CRUD functions
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

## Firebase Data Model

Firestore collections mirror the previous Supabase tables (same fields, camelCase). Every document stores its owner as `userId` (or `taskId`/`projectId` for child collections), and `firestore.rules` restricts all reads/writes to the signed-in user's own documents.

| Collection | Purpose |
|---|---|
| `user_preferences` | All personalization settings (doc id = user UID) |
| `daily_check_ins` | Optional daily self-reported state |
| `tasks` | Executable work tasks |
| `task_steps` | Tree breakdown children |
| `projects` | Planning-mode projects |
| `roadmap_nodes` | Planning milestones |
| `focus_sessions` | Timed work sessions |
| `daily_reflections` | End-of-day reflections |
| `user_activity_events` | Consent-based typed interaction events |
| `activity_tracking_preferences` | Consent choices and tracking state (doc id = user UID) |
| `ai_personalization_profiles` | Derived, explainable preferences (doc id = user UID) |
| `ai_interaction_feedback` | Accepted / edited / dismissed suggestion outcomes |
| `ai_context_audit` | Metadata-only records of each assembled AI context |

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
5. **Retrieve minimal records** — only consent-approved, AI-eligible events within their retention window are read (scoped to the user's own documents).
6. **Redact** (`src/lib/redact.ts`) — API keys, bearer tokens, private keys, JWTs, credentials, emails, phone numbers, card numbers, IDs, and session tokens are replaced with `[REDACTED_...]` markers before summarization. Values are never stored.
7. **Prompt-injection guard** (`src/lib/injection.ts`) — user-authored text (task titles, notes, event properties, prior AI output) is scanned for heuristic injection signals; detected signals add an explicit safety directive, and all user-authored content is delimited as untrusted data in the prompt.
8. **Deterministic summarization** — events are aggregated into labeled patterns (`derivedPreferences`, `recentRelevantPatterns`) with evidence windows, counts, and confidence. No emotional inference.
9. **Token budget** — `applyTokenBudget` drops lowest-priority sections until under `MAX_CONTEXT_TOKENS`; it never drops `safetyDirectives`, the request, or consent/exclusion metadata.
10. **Audit** — a metadata-only record (request id, intent, consent applied/excluded, counts, redaction counts, token estimate, outcome) is written to `ai_context_audit`. It never contains task text, secrets, or the assembled prompt.

**Minimal fallback**: any failure (DB down, auth, policy error) returns `buildMinimalEnvelope` — the request plus the untrusted-data directive — so ordinary task assistance is never blocked.

**Message hierarchy** (`src/lib/ai.ts`): the system message carries behavior rules plus any safety directives; the envelope is delivered as a separate user message labeled as DATA (not instructions), followed by the current request. This keeps untrusted context isolated from instructions.

**Production note**: the engine currently runs client-side with Firestore security rules isolating per-user data. For a stricter security posture, move stages 1–8 into a server-side endpoint keyed by the user's session.

## Design Principles

1. **Reduce cognitive load** — Show one clear next action by default
2. **Support task initiation** — Help move from intention to small first step
3. **Compassionate language** — Never shame for missed tasks or low energy
4. **Progressive complexity** — Simple default, expandable details
5. **User control** — AI recommends, never silently changes work
6. **Calm continuity** — Personalization makes it more comfortable over time
7. **Accessibility** — Keyboard nav, contrast, reduced motion, screen readers
8. **No medical claims** — Self-reported context, not diagnosis