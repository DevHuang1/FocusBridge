// Server-side-safe redaction of secrets and sensitive values before
// summarization or LLM submission. Never stores the redacted value.

export interface RedactionRule {
  category: string;
  pattern: RegExp;
  label: string;
}

export const REDACTION_RULES: RedactionRule[] = [
  { category: 'url_credential', pattern: /\bhttps?:\/\/[^/\s:@]+:[^/\s:@]+@/g, label: 'URL_CREDENTIAL' },
  { category: 'api_key', pattern: /\b(?:sk|pk|rk|whk)[_-][A-Za-z0-9_-]{16,}\b/g, label: 'API_KEY' },
  { category: 'api_key', pattern: /\bAKIA[0-9A-Z]{16}\b/g, label: 'AWS_ACCESS_KEY' },
  { category: 'bearer_token', pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/g, label: 'BEARER_TOKEN' },
  { category: 'private_key', pattern: /-----BEGIN (?:RSA |OPENSSH |EC |PGP |ENCRYPTED )?PRIVATE KEY[^-]*-----[\s\S]*?-----END (?:RSA |OPENSSH |EC |PGP |ENCRYPTED )?PRIVATE KEY-----/g, label: 'PRIVATE_KEY' },
  { category: 'jwt', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, label: 'JWT' },
  { category: 'github_token', pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g, label: 'GITHUB_TOKEN' },
  { category: 'slack_token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, label: 'SLACK_TOKEN' },
  { category: 'password', pattern: /\b(?:password|passwd|pwd)\s*[:=]\s*\S+/gi, label: 'PASSWORD' },
  { category: 'card_number', pattern: /\b(?:\d[ -]?){13,19}\b/g, label: 'CARD_NUMBER' },
  { category: 'gov_id', pattern: /\b\d{3}-\d{2}-\d{4}\b/g, label: 'GOV_ID' },
  { category: 'recovery_code', pattern: /\b(?:recovery|codes?|2fa|otp)\s*[:=]\s*[A-Za-z0-9-]{6,}\b/gi, label: 'RECOVERY_CODE' },
  { category: 'email', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, label: 'EMAIL' },
  { category: 'phone', pattern: /\b(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, label: 'PHONE' },
  { category: 'session_id', pattern: /\b(?:session[_-]?id|sid|token)\s*[:=]\s*[A-Za-z0-9_-]{12,}\b/gi, label: 'SESSION_ID' },
];

export interface RedactionResult {
  text: string;
  counts: Record<string, number>;
}

export function redactText(input: string): RedactionResult {
  let text = input;
  const counts: Record<string, number> = {};
  for (const rule of REDACTION_RULES) {
    let matches = 0;
    text = text.replace(rule.pattern, () => {
      matches += 1;
      return `[REDACTED_${rule.label}]`;
    });
    if (matches > 0) {
      counts[rule.category] = (counts[rule.category] ?? 0) + matches;
    }
  }
  return { text, counts };
}

export function redactStringValues(values: (string | null | undefined)[]): {
  text: string[];
  counts: Record<string, number>;
} {
  const total: Record<string, number> = {};
  const out: string[] = [];
  for (const value of values) {
    if (!value) {
      out.push(value ?? '');
      continue;
    }
    const result = redactText(value);
    out.push(result.text);
    for (const [k, v] of Object.entries(result.counts)) {
      total[k] = (total[k] ?? 0) + v;
    }
  }
  return { text: out, counts: total };
}

export function hasSecretPatterns(input: string): boolean {
  return REDACTION_RULES.some((rule) => rule.pattern.test(input));
}

// Merge redaction counts across multiple results without storing values.
export function mergeRedactionCounts(entries: Record<string, number>[]): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const entry of entries) {
    for (const [k, v] of Object.entries(entry)) {
      merged[k] = (merged[k] ?? 0) + v;
    }
  }
  return merged;
}