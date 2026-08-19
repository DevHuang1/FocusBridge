import { describe, it, expect } from 'vitest';
import { getEventDefinition, validateEventProperties, ALL_EVENT_NAMES } from './activity';

describe('getEventDefinition', () => {
  it('returns definitions with purpose, sensitivity, consent, aiEligible, retention', () => {
    const def = getEventDefinition('task_breakdown_generated');
    expect(def).not.toBeNull();
    expect(def!.aiEligible).toBe(true);
    expect(def!.maxAgeDays).toBe(90);
    expect(def!.requiresConsent).toBe('interactionHistory');
  });

  it('marks navigation events as not AI-eligible', () => {
    expect(getEventDefinition('button_pressed')!.aiEligible).toBe(false);
    expect(getEventDefinition('screen_viewed')!.aiEligible).toBe(false);
  });

  it('returns null for unknown names', () => {
    expect(getEventDefinition('not_a_real_event' as never)).toBeNull();
  });

  it('keeps daily check-in retention short', () => {
    expect(getEventDefinition('daily_check_in_completed')!.maxAgeDays).toBe(30);
  });

  it('exposes every event name in ALL_EVENT_NAMES', () => {
    expect(ALL_EVENT_NAMES.length).toBeGreaterThan(10);
    expect(ALL_EVENT_NAMES).toContain('task_breakdown_generated');
  });
});

describe('validateEventProperties', () => {
  it('rejects unknown event names', () => {
    expect(validateEventProperties('nope' as never, {}).valid).toBe(false);
  });

  it('rejects disallowed properties', () => {
    const result = validateEventProperties('button_pressed', { secret: 'x' });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('disallowed_property:secret');
  });

  it('rejects oversized string properties', () => {
    const result = validateEventProperties('preference_changed', { field: 'a', value: 'x'.repeat(250) });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('oversized_property:value');
  });

  it('rejects object properties', () => {
    const result = validateEventProperties('task_started', { stepIndex: { nested: true } as never });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('invalid_property_type:stepIndex');
  });

  it('accepts allowed primitive properties', () => {
    const result = validateEventProperties('task_breakdown_generated', { stepCount: 5 });
    expect(result.valid).toBe(true);
  });
});