// Vercel serverless proxy for historical price series (free Yahoo Finance chart API).

import { fetchWithTimeout, rejectNonGet } from '../lib/http.js';

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';

export default async function handler(req, res) {
  if (rejectNonGet(req, res)) return;
  const symbol = String(req.query.symbol || '').trim();
  const range = String(req.query.range || '1mo');
  const interval = String(req.query.interval || (range === '1d' ? '5m' : '1d'));
  if (!symbol) {
    res.status(200).json({ closes: [], timestamps: [], prevClose: null, price: null });
    return;
  }
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`;
    const r = await fetchWithTimeout(url, { headers: { 'User-Agent': UA } });
    const j = await r.json();
    const result = j?.chart?.result?.[0];
    const rawCloses = result?.indicators?.quote?.[0]?.close || [];
    const rawTimestamps = result?.timestamp || [];
    const closes = [];
    const timestamps = [];
    for (let i = 0; i < rawCloses.length; i++) {
      if (rawCloses[i] == null) continue;
      closes.push(rawCloses[i]);
      timestamps.push(rawTimestamps[i] ?? null);
    }
    const meta = result?.meta || {};
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({
      closes,
      timestamps,
      prevClose: meta.chartPreviousClose ?? null,
      price: meta.regularMarketPrice ?? null,
    });
  } catch {
    res.status(200).json({ closes: [], timestamps: [], prevClose: null, price: null });
  }
}
