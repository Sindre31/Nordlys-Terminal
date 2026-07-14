// Portfolio risk engine (no key). Reconstructs a fixed-weight portfolio from
// each holding's 1-year daily price history (Yahoo) and computes annualised
// volatility, max drawdown, 1-day VaR(95%), Sharpe and beta vs OSEBX.
// Input: ?symbols=EQNR.OL:0.15,KOG.OL:0.12,...&rf=4.25

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';
const BENCH = 'OSEBX.OL';

// Daily bars from different exchanges land on different exact epoch seconds (each is stamped at
// that market's local open time), so US and Oslo Bors tickers never share a raw timestamp even on
// the same trading day. Bucketing by calendar date (UTC) instead lets a mixed-exchange portfolio's
// series actually intersect.
function dateKey(epochSeconds) {
  return new Date(epochSeconds * 1000).toISOString().slice(0, 10);
}

async function fetchSeries(sym) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1y&interval=1d`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) return null;
  const j = await r.json();
  const res = j?.chart?.result?.[0];
  const ts = res?.timestamp;
  const close = res?.indicators?.quote?.[0]?.close;
  if (!ts || !close) return null;
  const m = new Map();
  for (let i = 0; i < ts.length; i++) if (close[i] != null) m.set(dateKey(ts[i]), close[i]);
  return m;
}

function stdev(a) {
  const n = a.length;
  if (n < 2) return 0;
  const mean = a.reduce((s, x) => s + x, 0) / n;
  const v = a.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(v);
}

export default async function handler(req, res) {
  const rf = parseFloat(String(req.query.rf || '4.25')) / 100;
  const pairs = String(req.query.symbols || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [sym, w] = p.split(':');
      return { sym, w: parseFloat(w) || 0 };
    })
    .filter((p) => p.sym && p.w > 0)
    .slice(0, 25);

  const out = { annVol: null, maxDrawdown: null, var95: null, sharpe: null, beta: null, days: 0, portReturn: null, benchReturn: null, holdingReturns: {} };
  try {
    const uniq = [...new Set([...pairs.map((p) => p.sym), BENCH])];
    const seriesList = await Promise.all(uniq.map(fetchSeries));
    const series = {};
    uniq.forEach((s, i) => { if (seriesList[i]) series[s] = seriesList[i]; });
    if (!series[BENCH]) throw new Error('no benchmark');

    // Common timestamps across benchmark + every holding that loaded.
    const active = pairs.filter((p) => series[p.sym]);
    let ts = [...series[BENCH].keys()];
    for (const p of active) ts = ts.filter((t) => series[p.sym].has(t));
    ts.sort(); // ISO date-string keys sort correctly lexicographically
    if (ts.length < 30) throw new Error('insufficient history');

    // Daily returns: portfolio (fixed current weights) and benchmark.
    const portRets = [];
    const benchRets = [];
    for (let i = 1; i < ts.length; i++) {
      let pr = 0;
      for (const p of active) {
        const c0 = series[p.sym].get(ts[i - 1]);
        const c1 = series[p.sym].get(ts[i]);
        pr += p.w * (c1 / c0 - 1);
      }
      portRets.push(pr);
      const b0 = series[BENCH].get(ts[i - 1]);
      const b1 = series[BENCH].get(ts[i]);
      benchRets.push(b1 / b0 - 1);
    }

    const dVol = stdev(portRets);
    const annVol = dVol * Math.sqrt(252);

    // Max drawdown from the cumulative return path.
    let cum = 1, peak = 1, mdd = 0;
    for (const r of portRets) {
      cum *= 1 + r;
      if (cum > peak) peak = cum;
      const dd = cum / peak - 1;
      if (dd < mdd) mdd = dd;
    }

    // Annualised return → Sharpe.
    const totalRet = cum - 1;
    const years = portRets.length / 252;
    const annRet = years > 0 ? Math.pow(1 + totalRet, 1 / years) - 1 : 0;
    const sharpe = annVol > 0 ? (annRet - rf) / annVol : null;

    // 1-day 95% VaR (parametric, one-tailed).
    const var95 = -1.645 * dVol;

    // Beta = cov(port, bench) / var(bench).
    const mp = portRets.reduce((s, x) => s + x, 0) / portRets.length;
    const mb = benchRets.reduce((s, x) => s + x, 0) / benchRets.length;
    let cov = 0, vb = 0;
    for (let i = 0; i < portRets.length; i++) {
      cov += (portRets[i] - mp) * (benchRets[i] - mb);
      vb += (benchRets[i] - mb) ** 2;
    }
    const beta = vb > 0 ? cov / vb : null;

    // Benchmark cumulative return + per-holding total return over the window.
    let bcum = 1;
    for (const r of benchRets) bcum *= 1 + r;
    const holdingReturns = {};
    for (const p of active) {
      const c0 = series[p.sym].get(ts[0]);
      const c1 = series[p.sym].get(ts[ts.length - 1]);
      if (c0 > 0) holdingReturns[p.sym] = (c1 / c0 - 1) * 100;
    }

    out.annVol = annVol * 100;
    out.maxDrawdown = mdd * 100;
    out.var95 = var95 * 100;
    out.sharpe = sharpe;
    out.beta = beta;
    out.days = ts.length;
    out.portReturn = totalRet * 100;
    out.benchReturn = (bcum - 1) * 100;
    out.holdingReturns = holdingReturns;
  } catch {
    /* leave nulls; UI falls back to designed values */
  }
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
  res.status(200).json(out);
}
