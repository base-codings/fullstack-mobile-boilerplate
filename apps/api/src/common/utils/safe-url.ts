/**
 * Sensitive query parameter keys that must be redacted from log output.
 *
 * This list is intentionally hardcoded (no env-extensibility) to keep the
 * security surface predictable — see docs/code-standards.md § Query-string
 * redaction for rationale and guidance on extending for production use.
 */
const SENSITIVE_QUERY_KEYS = new Set([
  'token',
  'apikey',
  'api_key',
  'apitoken',
  'api_token',
  'secret',
  'jwt',
  'password',
  'access_token',
  'refresh_token',
  'session',
]);

/**
 * Returns a log-safe version of a URL.
 * Sensitive query keys are replaced with [REDACTED]; other params are preserved.
 *
 * @example
 * safeQueryString('/users?token=abc&page=5') // '/users?token=[REDACTED]&page=5'
 * safeQueryString('/users?page=5&sort=date') // '/users?page=5&sort=date' (unchanged)
 * safeQueryString('/users')                  // '/users' (no query string)
 */
export function safeQueryString(url: string): string {
  const qIdx = url.indexOf('?');
  if (qIdx < 0) return url;

  const path = url.slice(0, qIdx);
  const query = url.slice(qIdx + 1);
  const params = new URLSearchParams(query);
  let mutated = false;

  for (const key of params.keys()) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) {
      params.set(key, '[REDACTED]');
      mutated = true;
    }
  }

  if (!mutated) return url;
  return `${path}?${params.toString()}`;
}
