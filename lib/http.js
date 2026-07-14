// Shared upstream-fetch helper for the serverless API. Bounds every call to Yahoo / Newsweb /
// Norges Bank with a timeout and retries once on a network error or timeout, so a slow or flaky
// upstream fails fast and cleanly (the handler's own catch then returns nulls → the UI shows "—"
// or a loading state) instead of the function hanging until the platform kills it. This is what a
// cold Yahoo start looked like in QA: the page sat on "loading" long enough that a fallback path
// rendered. A bounded, retried call turns that into a quick, honest empty response.
//
// Lives outside api/ on purpose: every .js under api/ becomes its own serverless function and
// counts against the deployment's function limit. As an imported module it's bundled into each
// function that uses it, adding no function of its own.

// Guards the read-only proxy endpoints against non-GET methods. Returns true if it already sent a
// 405 response (the caller should then return immediately). HEAD is allowed (same as GET, no body).
export function rejectNonGet(req, res) {
  const method = req?.method;
  if (method && method !== 'GET' && method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).json({ error: 'method not allowed' });
    return true;
  }
  return false;
}

const DEFAULTS = { timeoutMs: 6000, retries: 1, backoffMs: 150 };

// A 429 (rate limit) or 5xx is a transient upstream failure worth retrying, not a real answer —
// Yahoo in particular rate-limits bursty callers. Retrying these (in addition to network
// errors/timeouts) turns a momentary rate-limit into a successful second attempt instead of an
// empty panel.
function isRetryableStatus(status) {
  return status === 429 || status >= 500;
}

const delay = (ms) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

// Returns the fetch Response (callers still check r.ok). Retries on network error, timeout, and
// retryable HTTP status (429/5xx) with exponential backoff, up to `retries` times. If every
// attempt fails with a network error it throws (handlers wrap fetches in try/catch, so a throw
// degrades to the designed empty state); if the last attempt was a retryable status it returns
// that response so the caller still sees the real status code.
export async function fetchWithTimeout(url, opts = {}, cfg = {}) {
  const { timeoutMs, retries, backoffMs } = { ...DEFAULTS, ...cfg };
  let lastErr;
  let lastResp;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let resp;
    try {
      resp = await fetch(url, { ...opts, signal: controller.signal });
    } catch (err) {
      lastErr = err;
      clearTimeout(timer);
      if (attempt < retries) {
        await delay(backoffMs * 2 ** attempt);
        continue;
      }
      break;
    }
    clearTimeout(timer);
    if (isRetryableStatus(resp.status) && attempt < retries) {
      lastResp = resp;
      await delay(backoffMs * 2 ** attempt);
      continue;
    }
    return resp;
  }
  if (lastResp) return lastResp;
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
