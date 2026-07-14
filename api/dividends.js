// Dividend history via the free Yahoo Finance chart events API (no key).
// Returns the latest dividend and trailing-12-month total per symbol.

import { fetchWithTimeout } from '../lib/http.js';

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';

async function fetchDivs(sym) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d&events=div`;
  const r = await fetchWithTimeout(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) return null;
  const j = await r.json();
  const result = j?.chart?.result?.[0];
  const divs = result?.events?.dividends;
  const cur = result?.meta?.currency || 'NOK';
  if (!divs) return { latest: null, latestDate: null, trailing: 0, currency: cur };
  const entries = Object.values(divs)
    .map((d) => ({ amount: d.amount, date: d.date }))
    .sort((a, b) => a.date - b.date);
  if (!entries.length) return { latest: null, latestDate: null, trailing: 0, currency: cur };
  const trailing = entries.reduce((s, e) => s + e.amount, 0);
  const last = entries[entries.length - 1];
  return { latest: last.amount, latestDate: last.date, trailing, currency: cur };
}

export default async function handler(req, res) {
  const symbols = String(req.query.symbols || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 40);
  const out = {};
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        const d = await fetchDivs(sym);
        if (d) out[sym] = d;
      } catch {
        /* ignore */
      }
    }),
  );
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).json({ dividends: out });
}
