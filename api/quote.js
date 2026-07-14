// Vercel serverless proxy for batch quotes via the free Yahoo Finance chart API.
// No API key required. Runs server-side to avoid browser CORS.

import { fetchWithTimeout } from '../lib/http.js';

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';

async function fetchQuote(sym) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=1d`;
  const r = await fetchWithTimeout(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) return null;
  const j = await r.json();
  const result = j?.chart?.result?.[0];
  const m = result?.meta;
  if (!m || typeof m.regularMarketPrice !== 'number') return null;
  const prev = typeof m.chartPreviousClose === 'number' ? m.chartPreviousClose : m.previousClose ?? null;
  const price = m.regularMarketPrice;
  const q = result?.indicators?.quote?.[0] || {};
  const opens = (q.open || []).filter((v) => v != null);
  const open = opens.length ? opens[opens.length - 1] : null;
  const change = prev != null ? price - prev : 0;
  const changePct = prev ? (change / prev) * 100 : 0;
  return {
    price,
    prevClose: prev,
    open,
    change,
    changePct,
    dayHigh: m.regularMarketDayHigh ?? null,
    dayLow: m.regularMarketDayLow ?? null,
    volume: m.regularMarketVolume ?? null,
    currency: m.currency || 'USD',
    name: m.longName || m.shortName || sym,
  };
}

export default async function handler(req, res) {
  const raw = String(req.query.symbols || '');
  const symbols = raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 40);
  const out = {};
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        const q = await fetchQuote(sym);
        if (q) out[sym] = q;
      } catch {
        /* ignore individual failures */
      }
    }),
  );
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
  res.status(200).json({ quotes: out, ts: Date.now() });
}
