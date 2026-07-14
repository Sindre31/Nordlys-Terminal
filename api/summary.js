// Analyst consensus + earnings dates via Yahoo Finance quoteSummary.
// Uses the free cookie+crumb handshake (no API key). Falls back to {} on error
// so the UI keeps its designed values.

import { fetchWithTimeout, rejectNonGet } from '../lib/http.js';
import { getCrumb } from '../lib/yahooCrumb.js';

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';

async function fetchSummary(sym, cookie, crumb) {
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=financialData,recommendationTrend,calendarEvents,defaultKeyStatistics&crumb=${encodeURIComponent(crumb)}`;
  const r = await fetchWithTimeout(url, { headers: { 'User-Agent': UA, Cookie: cookie } });
  if (!r.ok) return null;
  const j = await r.json();
  const res = j?.quoteSummary?.result?.[0];
  if (!res) return null;
  const fd = res.financialData || {};
  const ks = res.defaultKeyStatistics || {};
  const t0 = res.recommendationTrend?.trend?.[0] || {};
  const buy = (t0.strongBuy || 0) + (t0.buy || 0);
  const hold = t0.hold || 0;
  const sell = (t0.sell || 0) + (t0.strongSell || 0);
  const earnings = res.calendarEvents?.earnings?.earningsDate?.[0]?.raw ?? null;
  return {
    targetMean: fd.targetMeanPrice?.raw ?? null,
    targetHigh: fd.targetHighPrice?.raw ?? null,
    targetLow: fd.targetLowPrice?.raw ?? null,
    recMean: fd.recommendationMean?.raw ?? null,
    recKey: fd.recommendationKey ?? null,
    numAnalysts: fd.numberOfAnalystOpinions?.raw ?? null,
    beta: ks.beta?.raw ?? null,
    trailingEps: ks.trailingEps?.raw ?? null,
    priceToBook: ks.priceToBook?.raw ?? null,
    returnOnEquity: fd.returnOnEquity?.raw ?? null,
    buy,
    hold,
    sell,
    earningsDate: earnings,
  };
}

export default async function handler(req, res) {
  if (rejectNonGet(req, res)) return;
  const symbols = String(req.query.symbols || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 40);
  const out = {};
  try {
    const { cookie, crumb } = await getCrumb();
    if (crumb && !/error|<html/i.test(crumb)) {
      await Promise.all(
        symbols.map(async (sym) => {
          try {
            const s = await fetchSummary(sym, cookie, crumb);
            if (s) out[sym] = s;
          } catch {
            /* ignore individual */
          }
        }),
      );
    }
  } catch {
    /* leave empty */
  }
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  res.status(200).json({ summary: out });
}
