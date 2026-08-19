import { describe, it, expect } from 'vitest';
import { redactText, redactStringValues, mergeRedactionCounts, hasSecretPatterns } from './redact';

describe('redactText', () => {
  it('redacts API keys', () => {
    const input = 'sk-ant-abcdefghijklmnopqrstuvwxyz123456';
    const result = redactText(input);
    expect(result.text).toContain('[REDACTED_API_KEY]');
    expect(result.text).not.toContain('sk-ant');
    expect(result.counts.api_key).toBe(1);
  });

  it('redacts bearer tokens', () => {
    const result = redactText('Bearer abcdefghijklmnopqrstuvwxyz0123456789');
    expect(result.text).toContain('[REDACTED_BEARER_TOKEN]');
    expect(result.text).not.toContain('abcdefghijklmnopqrstuvwxyz0123456789');
  });

  it('redacts emails', () => {
    const result = redactText('contact alice@example.com today');
    expect(result.text).toContain('[REDACTED_EMAIL]');
    expect(result.text).not.toContain('alice@example.com');
  });

  it('redacts phone numbers', () => {
    const result = redactText('Call me at 555-123-4567');
    expect(result.text).toContain('[REDACTED_PHONE]');
    expect(result.text).not.toContain('555-123-4567');
  });

  it('redacts passwords', () => {
    const result = redactText('password=hunter2rocks');
    expect(result.text).toContain('[REDACTED_PASSWORD]');
    expect(result.text).not.toContain('hunter2rocks');
  });

  it('redacts card numbers', () => {
    const result = redactText('4242 4242 4242 4242');
    expect(result.text).toContain('[REDACTED_CARD_NUMBER]');
    expect(result.text).not.toContain('4242');
  });

  it('redacts US government IDs', () => {
    const result = redactText('SSN 123-45-6789 on file');
    expect(result.text).toContain('[REDACTED_GOV_ID]');
  });

  it('redacts JWTs', () => {
    const result = redactText('token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
    expect(result.text).toContain('[REDACTED_JWT]');
    expect(result.text).not.toContain('eyJhbGci');
  });

  it('redacts private key blocks', () => {
    const result = redactText('-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFA\n-----END PRIVATE KEY-----');
    expect(result.text).toContain('[REDACTED_PRIVATE_KEY]');
    expect(result.text).not.toContain('MIIEvQIBADANBgkqhkiG9w0BAQEFA');
  });

  it('redacts GitHub tokens', () => {
    const result = redactText('ghp_abcdefghijklmnopqrstuvwxyzABCDEFG123456789');
    expect(result.text).toContain('[REDACTED_GITHUB_TOKEN]');
  });

  it('redacts URL credentials', () => {
    const result = redactText('https://admin:supersecret@db.example.com:5432/app');
    expect(result.text).toContain('[REDACTED_URL_CREDENTIAL]');
    expect(result.text).not.toContain('supersecret');
  });

  it('leaves ordinary prose untouched', () => {
    const input = 'I want to break down my thesis into smaller steps and focus on the intro.';
    const result = redactText(input);
    expect(result.text).toBe(input);
    expect(Object.keys(result.counts)).toHaveLength(0);
  });

  it('never returns the redacted value', () => {
    const result = redactText('key sk-ant-abcdefghijklmnopqrstuvwxyz123456 end');
    const values = JSON.stringify(result).toLowerCase();
    expect(values).not.toContain('abcdefghijklmnopqrstuvwxyz123456');
  });
});

describe('redactStringValues', () => {
  it('redacts across an array of strings and merges counts', () => {
    const { text, counts } = redactStringValues(['hi bob@example.com', 'call 555-123-4567']);
    expect(text[0]).toContain('[REDACTED_EMAIL]');
    expect(text[1]).toContain('[REDACTED_PHONE]');
    expect(counts.email).toBe(1);
    expect(counts.phone).toBe(1);
  });
});

describe('mergeRedactionCounts', () => {
  it('sums counts without storing values', () => {
    const merged = mergeRedactionCounts([{ email: 1 }, { email: 2, phone: 1 }]);
    expect(merged).toEqual({ email: 3, phone: 1 });
  });
});

describe('hasSecretPatterns', () => {
  it('flags inputs containing secrets', () => {
    expect(hasSecretPatterns('password=abc123')).toBe(true);
    expect(hasSecretPatterns('just a plain note')).toBe(false);
  });
});