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

const DEFAULTS = { timeoutMs: 6000, retries: 1 };

// Returns the fetch Response (callers still check r.ok). Throws if every attempt fails — every
// handler already wraps its fetches in try/catch, so a throw degrades to the designed empty state.
export async function fetchWithTimeout(url, opts = {}, cfg = {}) {
  const { timeoutMs, retries } = { ...DEFAULTS, ...cfg };
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...opts, signal: controller.signal });
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
