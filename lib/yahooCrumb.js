// Shared Yahoo cookie+crumb handshake, used by every endpoint that hits the quoteSummary API
// (summary, fundamentals). Previously each of those did its own identical handshake inline; this
// dedupes that code AND caches the crumb per warm serverless instance, so repeated calls to the
// same function (e.g. summary polled on an interval) reuse the crumb instead of re-handshaking
// every time. Each serverless function has its own memory, so the cache is per-function-instance,
// not global — but a warm instance still saves the extra round-trips on subsequent invocations.

import { fetchWithTimeout } from './http.js';

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';
const TTL_MS = 5 * 60_000;

let cached = null; // { cookie, crumb, at }

export async function getCrumb() {
  if (cached && Date.now() - cached.at < TTL_MS) return cached;
  const r1 = await fetchWithTimeout('https://fc.yahoo.com', { headers: { 'User-Agent': UA } });
  const setCookies =
    typeof r1.headers.getSetCookie === 'function'
      ? r1.headers.getSetCookie()
      : [r1.headers.get('set-cookie')].filter(Boolean);
  const cookie = setCookies.map((c) => String(c).split(';')[0]).join('; ');
  const r2 = await fetchWithTimeout('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, Cookie: cookie },
  });
  const crumb = (await r2.text()).trim();
  cached = { cookie, crumb, at: Date.now() };
  return cached;
}
