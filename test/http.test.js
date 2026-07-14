import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWithTimeout } from '../lib/http.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('fetchWithTimeout', () => {
  it('returns the response when fetch succeeds on the first try', async () => {
    const resp = { ok: true };
    const fetchMock = vi.fn().mockResolvedValue(resp);
    vi.stubGlobal('fetch', fetchMock);
    const r = await fetchWithTimeout('https://example.test');
    expect(r).toBe(resp);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries once on failure, then returns the second response', async () => {
    const resp = { ok: true };
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(resp);
    vi.stubGlobal('fetch', fetchMock);
    const r = await fetchWithTimeout('https://example.test', {}, { retries: 1 });
    expect(r).toBe(resp);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('down'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchWithTimeout('https://example.test', {}, { retries: 2 })).rejects.toThrow('down');
    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('aborts and retries when a call exceeds the timeout', async () => {
    // First call never resolves on its own — it should be aborted by the timeout, then retried.
    const fetchMock = vi.fn((_url, opts) => {
      return new Promise((resolve, reject) => {
        if (opts?.signal) {
          opts.signal.addEventListener('abort', () => reject(new Error('aborted')));
        }
        // second attempt: resolve quickly
        if (fetchMock.mock.calls.length === 2) resolve({ ok: true });
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const r = await fetchWithTimeout('https://example.test', {}, { timeoutMs: 20, retries: 1 });
    expect(r).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('passes an AbortSignal through to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await fetchWithTimeout('https://example.test', { headers: { 'X-Test': '1' } });
    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.signal).toBeInstanceOf(AbortSignal);
    expect(opts.headers).toEqual({ 'X-Test': '1' });
  });
});
