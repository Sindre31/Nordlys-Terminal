import { trailingReturn, sma, realizedVol, zScores, mean, stdev } from './factors';

// Systematic long-only equity model: 6-month momentum + 13/52-week trend + a low-volatility
// tilt, combined into one cross-sectional z-score composite. Every 4 weeks it goes equal-weight
// into the top N (of the 12-name universe, default 5) names clearing a minimum composite score
// (default > 0), cash otherwise, with a 0.05% modelled cost per unit of rebalance turnover. N and
// the score bar are adjustable via BacktestOptions so a risk-level control can make the model
// pickier/more concentrated (conservative) or looser/more diversified (aggressive). This is a
// standard textbook multi-factor approach (momentum + low-vol are well documented equity
// factors) — not a claim that it reliably beats the index going forward. Backtests like this are
// prone to overfitting on a small universe and short history; treat the output as illustrative,
// not investment advice.

const REBALANCE_EVERY_WEEKS = 4;
const TOP_N = 5;
const TRADE_COST = 0.0005;
const MOM_WINDOW = 26;
const TREND_SHORT = 13;
const TREND_LONG = 52;
const VOL_WINDOW = 26;
const WEEKS_PER_YEAR = 52.1775;

export interface FactorSnapshot {
  momentum: number | null;
  trend: number | null;
  vol: number | null;
  composite: number | null;
  zMomentum: number | null;
  zTrend: number | null;
  zVol: number | null;
}

export interface BacktestMetrics {
  stratCagr: number;
  benchCagr: number;
  totalReturn: number;
  vol: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  alpha: number;
  beta: number;
  winRateMonthly: number;
  bestYear: { year: string; ret: number };
  worstYear: { year: string; ret: number };
  turnoverPerYear: number;
}

export interface BacktestResult {
  weekKeys: string[];
  strategyNav: number[];
  benchmarkNav: number[];
  metrics: BacktestMetrics;
  annualReturns: { year: string; strategy: number; benchmark: number }[];
  latestScores: Record<string, FactorSnapshot>;
}

function computeScores(series: Record<string, number[]>, tickers: string[], idx: number) {
  const momentum = tickers.map((t) => trailingReturn(series[t], idx, MOM_WINDOW));
  const trend = tickers.map((t) => {
    const s = sma(series[t], idx, TREND_SHORT);
    const l = sma(series[t], idx, TREND_LONG);
    return s != null && l != null ? s / l - 1 : null;
  });
  const vol = tickers.map((t) => realizedVol(series[t], idx, VOL_WINDOW));
  const momZ = zScores(momentum);
  const trendZ = zScores(trend);
  const volZ = zScores(vol).map((z) => (z == null ? null : -z)); // lower realized vol scores better
  const composite = tickers.map((_, i) => {
    const parts = [momZ[i], trendZ[i], volZ[i]].filter((v): v is number => v != null);
    return parts.length > 0 ? parts.reduce((a, b) => a + b, 0) / parts.length : null;
  });
  return { momentum, trend, vol, momZ, trendZ, volZ, composite };
}

function groupBy(weekKeys: string[], nav: number[], keyLen: number) {
  const map = new Map<string, { first: number; last: number }>();
  for (let i = 0; i < weekKeys.length; i++) {
    const key = weekKeys[i].slice(0, keyLen);
    const entry = map.get(key);
    if (!entry) map.set(key, { first: nav[i], last: nav[i] });
    else entry.last = nav[i];
  }
  return map;
}

export interface BacktestOptions {
  topN?: number;
  scoreThreshold?: number;
}

export function runBacktest(
  weekKeys: string[],
  series: Record<string, number[]>,
  tickers: string[],
  benchmarkKey: string,
  opts: BacktestOptions = {},
): BacktestResult {
  const topN = opts.topN ?? TOP_N;
  const scoreThreshold = opts.scoreThreshold ?? 0;
  const n = weekKeys.length;
  const startIdx = Math.max(MOM_WINDOW, TREND_LONG, VOL_WINDOW);
  if (startIdx >= n - 4) {
    throw new Error('Not enough historical data to run the backtest');
  }

  let weights: Record<string, number> = Object.fromEntries(tickers.map((t) => [t, 0]));
  const stratNav = new Array(n).fill(NaN);
  const benchNav = new Array(n).fill(NaN);
  stratNav[startIdx] = 100_000;
  benchNav[startIdx] = 100_000;
  let turnoverSum = 0;
  let rebalanceCount = 0;

  for (let i = startIdx; i < n; i++) {
    if (i > startIdx) {
      let stratRet = 0;
      for (const t of tickers) {
        const w = weights[t];
        if (w > 0) stratRet += w * (series[t][i] / series[t][i - 1] - 1);
      }
      const benchRet = series[benchmarkKey][i] / series[benchmarkKey][i - 1] - 1;
      stratNav[i] = stratNav[i - 1] * (1 + stratRet);
      benchNav[i] = benchNav[i - 1] * (1 + benchRet);
    }

    if ((i - startIdx) % REBALANCE_EVERY_WEEKS === 0) {
      const { composite } = computeScores(series, tickers, i);
      const ranked = tickers
        .map((t, idx) => ({ t, score: composite[idx] }))
        .filter((x): x is { t: string; score: number } => x.score != null && x.score > scoreThreshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
      const newWeights: Record<string, number> = Object.fromEntries(tickers.map((t) => [t, 0]));
      if (ranked.length > 0) {
        const w = 1 / ranked.length;
        for (const r of ranked) newWeights[r.t] = w;
      }
      const turnover = tickers.reduce((sum, t) => sum + Math.abs(newWeights[t] - weights[t]), 0) / 2;
      turnoverSum += turnover;
      rebalanceCount++;
      stratNav[i] *= 1 - turnover * TRADE_COST;
      weights = newWeights;
    }
  }

  const wk = weekKeys.slice(startIdx);
  const sNav = stratNav.slice(startIdx);
  const bNav = benchNav.slice(startIdx);

  const stratRets: number[] = [];
  const benchRets: number[] = [];
  for (let i = 1; i < sNav.length; i++) {
    stratRets.push(sNav[i] / sNav[i - 1] - 1);
    benchRets.push(bNav[i] / bNav[i - 1] - 1);
  }

  const years = (wk.length - 1) / WEEKS_PER_YEAR;
  const stratCagr = (sNav[sNav.length - 1] / sNav[0]) ** (1 / years) - 1;
  const benchCagr = (bNav[bNav.length - 1] / bNav[0]) ** (1 / years) - 1;
  const totalReturn = sNav[sNav.length - 1] / sNav[0] - 1;

  const vol = stdev(stratRets) * Math.sqrt(52);
  const sharpe = (mean(stratRets) * 52) / (vol || 1);
  const downside = stratRets.filter((r) => r < 0);
  const downsideDev = downside.length > 1 ? stdev(downside) * Math.sqrt(52) : vol;
  const sortino = (mean(stratRets) * 52) / (downsideDev || 1);

  let peak = sNav[0];
  let maxDrawdown = 0;
  for (const v of sNav) {
    peak = Math.max(peak, v);
    maxDrawdown = Math.min(maxDrawdown, v / peak - 1);
  }

  const stratMean = mean(stratRets);
  const benchMean = mean(benchRets);
  const covar = mean(stratRets.map((r, i) => (r - stratMean) * (benchRets[i] - benchMean)));
  const benchVar = mean(benchRets.map((r) => (r - benchMean) ** 2));
  const beta = covar / (benchVar || 1);
  const alpha = stratCagr - benchCagr;

  const monthly = groupBy(wk, sNav, 7);
  const monthlyReturns = Array.from(monthly.values()).map((e) => e.last / e.first - 1);
  const winRateMonthly = monthlyReturns.filter((r) => r > 0).length / monthlyReturns.length;

  const annualStrat = groupBy(wk, sNav, 4);
  const annualBench = groupBy(wk, bNav, 4);
  const annualReturns = Array.from(annualStrat.keys())
    .sort()
    .map((year) => ({
      year,
      strategy: annualStrat.get(year)!.last / annualStrat.get(year)!.first - 1,
      benchmark: annualBench.get(year)!.last / annualBench.get(year)!.first - 1,
    }));
  // Prefer full calendar years for best/worst-year so a partial first/last year doesn't skew them.
  const yearCounts = new Map<string, number>();
  for (const key of wk) {
    const year = key.slice(0, 4);
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
  }
  const candidateYears = annualReturns.filter((y) => (yearCounts.get(y.year) ?? 0) >= 40);
  const yearsForExtremes = candidateYears.length > 0 ? candidateYears : annualReturns;
  const bestYear = yearsForExtremes.reduce((a, b) => (b.strategy > a.strategy ? b : a));
  const worstYear = yearsForExtremes.reduce((a, b) => (b.strategy < a.strategy ? b : a));

  const turnoverPerYear = rebalanceCount > 0 ? (turnoverSum / rebalanceCount) * (52 / REBALANCE_EVERY_WEEKS) : 0;

  const latestIdx = n - 1;
  const latest = computeScores(series, tickers, latestIdx);
  const latestScores: Record<string, FactorSnapshot> = {};
  tickers.forEach((t, i) => {
    latestScores[t] = {
      momentum: latest.momentum[i], trend: latest.trend[i], vol: latest.vol[i], composite: latest.composite[i],
      zMomentum: latest.momZ[i], zTrend: latest.trendZ[i], zVol: latest.volZ[i],
    };
  });

  return {
    weekKeys: wk,
    strategyNav: sNav,
    benchmarkNav: bNav,
    metrics: {
      stratCagr,
      benchCagr,
      totalReturn,
      vol,
      sharpe,
      sortino,
      maxDrawdown,
      alpha,
      beta,
      winRateMonthly,
      bestYear: { year: bestYear.year, ret: bestYear.strategy },
      worstYear: { year: worstYear.year, ret: worstYear.strategy },
      turnoverPerYear,
    },
    annualReturns,
    latestScores,
  };
}

export interface SplitHalfMetrics {
  cagr: number;
  benchCagr: number;
  sharpe: number;
  maxDrawdown: number;
  totalReturn: number;
}

export interface SplitValidation {
  firstHalf: SplitHalfMetrics;
  secondHalf: SplitHalfMetrics;
}

// Out-of-sample check: since this model has no fitted parameters to overfit (topN/scoreThreshold
// are pre-specified, not tuned to this data), the real risk is factor selection on a small
// universe over a short history. Splitting the same history in half and running the identical
// rule on each independently shows whether performance is consistent or was carried by one
// lucky stretch — a real (if simple) robustness check rather than a single aggregate number.
export function runSplitValidation(
  weekKeys: string[],
  series: Record<string, number[]>,
  tickers: string[],
  benchmarkKey: string,
  opts: BacktestOptions = {},
): SplitValidation | null {
  const n = weekKeys.length;
  const mid = Math.floor(n / 2);
  const sliceSeries = (rec: Record<string, number[]>, from: number, to: number) => {
    const out: Record<string, number[]> = {};
    for (const k of Object.keys(rec)) out[k] = rec[k].slice(from, to);
    return out;
  };
  const toHalf = (r: BacktestResult): SplitHalfMetrics => ({
    cagr: r.metrics.stratCagr,
    benchCagr: r.metrics.benchCagr,
    sharpe: r.metrics.sharpe,
    maxDrawdown: r.metrics.maxDrawdown,
    totalReturn: r.metrics.totalReturn,
  });
  try {
    const first = runBacktest(weekKeys.slice(0, mid), sliceSeries(series, 0, mid), tickers, benchmarkKey, opts);
    const second = runBacktest(weekKeys.slice(mid), sliceSeries(series, mid, n), tickers, benchmarkKey, opts);
    return { firstHalf: toHalf(first), secondHalf: toHalf(second) };
  } catch {
    return null;
  }
}
