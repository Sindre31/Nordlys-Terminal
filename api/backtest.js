// Real backtest (no key): the current portfolio weights applied to 10 years of
// monthly price history (Yahoo), rebalanced monthly, vs OSEBX. Computes the
// equity curves, headline metrics and annual returns from actual prices.
// Input: ?symbols=EQNR.OL:0.15,KOG.OL:0.12,...&rf=4.25

import { fetchWithTimeout, rejectNonGet } from '../lib/http.js';

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';
const BENCH = 'OSEBX.OL';
const COST = 0.0005; // 0.05% per-trade cost applied to monthly turnover

// Different exchanges stamp their monthly bar on different calendar days (e.g. Oslo Bors marks
// month-end at ~22:00 UTC on the last trading day, Nasdaq/NYSE marks the same month-end just
// after UTC midnight on the 1st of the next month) — a plain UTC-date bucket would put them a day
// apart. Shifting back 12 hours before reading the year/month reliably lands both on the same
// side of that boundary without risking misattributing a genuinely different month.
export function monthKey(epochSeconds) {
  const d = new Date((epochSeconds - 12 * 3600) * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function fetchMonthly(sym) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=10y&interval=1mo`;
  const r = await fetchWithTimeout(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) return null;
  const j = await r.json();
  const res = j?.chart?.result?.[0];
  const ts = res?.timestamp;
  const close = res?.indicators?.quote?.[0]?.close;
  if (!ts || !close) return null;
  const m = new Map();
  for (let i = 0; i < ts.length; i++) if (close[i] != null) m.set(monthKey(ts[i]), close[i]);
  return m;
}
function stdev(a) {
  const n = a.length;
  if (n < 2) return 0;
  const mean = a.reduce((s, x) => s + x, 0) / n;
  return Math.sqrt(a.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1));
}

export default async function handler(req, res) {
  if (rejectNonGet(req, res)) return;
  const rf = parseFloat(String(req.query.rf || '4.25')) / 100;
  const pairs = String(req.query.symbols || '')
    .split(',').map((p) => p.trim()).filter(Boolean)
    .map((p) => { const [sym, w] = p.split(':'); return { sym, w: parseFloat(w) || 0 }; })
    .filter((p) => p.sym && p.w > 0).slice(0, 25);

  const out = { ok: false };
  try {
    const uniq = [...new Set([...pairs.map((p) => p.sym), BENCH])];
    const lists = await Promise.all(uniq.map(fetchMonthly));
    const series = {};
    uniq.forEach((s, i) => { if (lists[i]) series[s] = lists[i]; });
    if (!series[BENCH]) throw new Error('no benchmark');
    const active = pairs.filter((p) => series[p.sym]);
    if (!active.length) throw new Error('no holdings');
    // Renormalise weights over holdings that have history.
    const wsum = active.reduce((s, p) => s + p.w, 0) || 1;
    active.forEach((p) => (p.w = p.w / wsum));

    let ts = [...series[BENCH].keys()];
    for (const p of active) ts = ts.filter((t) => series[p.sym].has(t));
    ts.sort(); // "YYYY-MM" keys sort correctly lexicographically
    if (ts.length < 24) throw new Error('insufficient history');

    // Monthly returns, portfolio (fixed target weights) and benchmark.
    const pRets = [], bRets = [];
    let turnoverSum = 0;
    for (let i = 1; i < ts.length; i++) {
      let pr = 0;
      const drift = [];
      for (const p of active) {
        const r = series[p.sym].get(ts[i]) / series[p.sym].get(ts[i - 1]) - 1;
        pr += p.w * r;
        drift.push({ w: p.w, r });
      }
      // Turnover to rebalance drifted weights back to target.
      let tno = 0;
      for (const d of drift) {
        const post = (d.w * (1 + d.r)) / (1 + pr);
        tno += Math.abs(post - d.w);
      }
      turnoverSum += tno;
      pRets.push(pr - tno * COST);
      bRets.push(series[BENCH].get(ts[i]) / series[BENCH].get(ts[i - 1]) - 1);
    }

    // Equity curves (growth of 100k).
    const START = 100000;
    const pEquity = [START], bEquity = [START];
    for (let i = 0; i < pRets.length; i++) {
      pEquity.push(pEquity[pEquity.length - 1] * (1 + pRets[i]));
      bEquity.push(bEquity[bEquity.length - 1] * (1 + bRets[i]));
    }

    const years = pRets.length / 12;
    const pTotal = pEquity[pEquity.length - 1] / START - 1;
    const bTotal = bEquity[bEquity.length - 1] / START - 1;
    const pCAGR = Math.pow(1 + pTotal, 1 / years) - 1;
    const bCAGR = Math.pow(1 + bTotal, 1 / years) - 1;
    const annVol = stdev(pRets) * Math.sqrt(12);
    const downside = stdev(pRets.filter((r) => r < 0)) * Math.sqrt(12);
    const sharpe = annVol > 0 ? (pCAGR - rf) / annVol : 0;
    const sortino = downside > 0 ? (pCAGR - rf) / downside : 0;

    let cum = 1, peak = 1, mdd = 0;
    for (const r of pRets) { cum *= 1 + r; if (cum > peak) peak = cum; const dd = cum / peak - 1; if (dd < mdd) mdd = dd; }

    const mp = pRets.reduce((s, x) => s + x, 0) / pRets.length;
    const mb = bRets.reduce((s, x) => s + x, 0) / bRets.length;
    let cov = 0, vb = 0;
    for (let i = 0; i < pRets.length; i++) { cov += (pRets[i] - mp) * (bRets[i] - mb); vb += (bRets[i] - mb) ** 2; }
    const beta = vb > 0 ? cov / vb : 0;
    const alpha = pCAGR - (rf + beta * (bCAGR - rf));
    const winRate = pRets.filter((r) => r > 0).length / pRets.length;
    const turnover = (turnoverSum / pRets.length) * 12;

    // Calendar-year returns.
    const byYear = {};
    for (let i = 1; i < ts.length; i++) {
      const y = ts[i].slice(0, 4);
      byYear[y] = byYear[y] || { p: 1, b: 1 };
      byYear[y].p *= 1 + pRets[i - 1];
      byYear[y].b *= 1 + bRets[i - 1];
    }
    const annual = Object.keys(byYear).sort().map((y) => ({
      year: y, p: (byYear[y].p - 1) * 100, b: (byYear[y].b - 1) * 100,
    }));
    const bestYear = Math.max(...annual.map((a) => a.p));
    const worstYear = Math.min(...annual.map((a) => a.p));

    // Down-sample equity to ~120 points (already monthly) for the chart.
    out.ok = true;
    out.startYear = Number(ts[0].slice(0, 4));
    out.endYear = Number(ts[ts.length - 1].slice(0, 4));
    out.pEquity = pEquity.map((v) => Math.round(v));
    out.bEquity = bEquity.map((v) => Math.round(v));
    out.metrics = {
      cagr: pCAGR * 100, totalReturn: pTotal * 100, annVol: annVol * 100,
      sharpe, sortino, maxDrawdown: mdd * 100, alpha: alpha * 100, beta,
      winRate: winRate * 100, bestYear, worstYear, turnover: turnover * 100,
      finalValue: pEquity[pEquity.length - 1], benchFinal: bEquity[bEquity.length - 1],
    };
    out.annual = annual;
  } catch {
    out.ok = false;
  }
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  res.status(200).json(out);
}
