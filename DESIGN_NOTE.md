# FocusBridge Design Note: Personalization & AI Adaptation

## Color Themes

Six soft palettes applied via `data-theme` attribute on `<html>`:

| Theme | Primary | Surface | Character |
|---|---|---|---|
| **Sage** (default) | #5C8A5C | #F4F7F4 | Calm, natural green |
| **Mist** | #6B8FA3 | #E8F0F4 | Cool, airy blue-gray |
| **Lavender** | #8B7DA8 | #EDE8F3 | Soft, creative purple |
| **Sky** | #5B93B5 | #E6F0F6 | Open, clear blue |
| **Sand** | #B5956B | #F5EEE2 | Warm, grounded earth |
| **Rose** | #B57A8A | #F5E8EC | Gentle, warm pink |

Each theme defines `--color-theme-primary`, `--color-theme-surface`, `--color-theme-border`, and overrides the cream palette for backgrounds.

## Motion Tokens

Animation intensity is controlled by the `animationIntensity` preference:

| Level | Duration Multiplier | Scale Effect | Description |
|---|---|---|---|
| **Still** | 0ms | 1.0 | No animation at all |
| **Soft** | 60% base | 1.01 | Gentle fades, minimal movement |
| **Balanced** | 100% base | 1.02 | Normal transitions |
| **Energizing** | 130% base | 1.03 | Slightly stronger feedback |

Base durations: fade-in 200ms, list stagger 50ms per item, spring bounce 350ms.

The `CalmMotion` component reads the preference and adjusts all Framer Motion props automatically. The `[data-reduced-motion="on"]` CSS selector disables all animations globally.

## AI Adaptation Rules

When `aiAdaptation` is set to `suggestions_only` or `auto_adapt`:

### Adaptation Triggers (from daily check-in)

| Arrival State | Adaptation |
|---|---|
| `overwhelmed` | Quieter layout, minimal density, next-step guidance |
| `tired_gentle` | Soft animation, reduced visual noise |
| `restless` | Structured layout, clear sequence |
| `calm_and_ready` | No adaptation needed |
| `focused_low_energy` | Comfortable density, brief guidance |

### Adaptation Display

All AI adaptations are shown as reversible suggestions:
- "Today's workspace is using a quieter layout because you selected 'overwhelmed'."
- Users can dismiss the note or override via Settings.

### AI Guardrails

The AI system prompt (`FOCUSBRIDGE_SYSTEM`) enforces:
- Short, concrete language
- No shame or guilt
- No diagnosis or emotional labeling
- No irreversible changes
- One clarifying question at a time
- Deterministic fallbacks when AI is unavailable

## Density Levels

| Level | Spacing | Description |
|---|---|---|
| **Minimal** | gap-3, space-y-3 | More breathing room, fewer visible elements |
| **Comfortable** | gap-4, space-y-4 | Default balanced spacing |
| **Detailed** | gap-5, space-y-5 | More information shown, wider gaps |
