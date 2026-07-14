import { useEffect, useMemo, useState } from 'react';
import { STOCK_YAHOO } from '../data';
import { alignSeries, type RawSeries } from './align';
import { runBacktest, runSplitValidation, type BacktestResult, type BacktestOptions, type SplitValidation } from './backtest';
import { zScores } from './factors';

const BENCHMARK_SYMBOL = 'OSEBX.OL';
const REFRESH_MS = 15 * 60_000;

export type RiskLevel = 'conservative' | 'balanced' | 'aggressive';

// Conservative: pickier bar, only 4 names max -> more often sits in cash.
// Aggressive: looser bar, up to 6 names -> more fully invested/diversified.
export const RISK_OPTIONS: Record<RiskLevel, BacktestOptions> = {
  conservative: { topN: 4, scoreThreshold: 1.0 },
  balanced: { topN: 5, scoreThreshold: 0 },
  aggressive: { topN: 6, scoreThreshold: -0.5 },
};

const NAMES: Record<string, string> = {
  EQNR: 'Equinor', DNB: 'DNB Bank', TEL: 'Telenor', NHY: 'Norsk Hydro', MOWI: 'Mowi',
  YAR: 'Yara International', AKRBP: 'Aker BP', KOG: 'Kongsberg Gruppen', SALM: 'SalMar',
  LMT: 'Lockheed Martin', XOM: 'Exxon Mobil', NVDA: 'NVIDIA',
  TOM: 'Tomra Systems', FRO: 'Frontline', ORK: 'Orkla', STB: 'Storebrand',
};

// Per-name cross-sectional z-scores for each factor, so the model's pick is auditable rather
// than a black box: the same numbers that feed liveScore, exposed for display. null = the factor
// couldn't be computed for this name (e.g. no P/B from Yahoo, or too little price history).
export interface FactorZ {
  momentum: number | null; // 6-month price momentum, z-scored across the universe
  trend: number | null; // 13/52-week trend
  lowVol: number | null; // inverted realized volatility (higher = calmer)
  valueQuality: number | null; // inverted P/B + ROE snapshot (today only, not backtested)
}

export interface QuantSignalRow {
  ticker: string;
  name: string;
  act: 'BUY' | 'HOLD' | 'SELL';
  target: number | null;
  upsidePct: number;
  reason: string;
  // Composite momentum/trend/low-vol score blended with today's value/quality snapshot
  // (P/B and ROE aren't backtestable — Yahoo's free consensus data has no history — so
  // this only affects live selection/signals, never the historical backtest above).
  liveScore: number | null;
  // The factor z-scores behind liveScore, for an auditable breakdown in the UI.
  factorZ: FactorZ;
}

export interface ConvictionFactor {
  label: string;
  why: string;
  val: number;
}

export interface Conviction {
  score: number;
  net: number;
  stance: string;
  factors: ConvictionFactor[];
}

export interface QuantModel {
  ready: boolean;
  error: string | null;
  backtest: BacktestResult | null;
  signals: QuantSignalRow[];
  conviction: Conviction | null;
  // ticker -> blended live score used to actually pick holdings (see QuantSignalRow.liveScore)
  liveScores: Record<string, number | null>;
  // First-half vs second-half performance of the same rule — an out-of-sample consistency
  // check, null if there isn't enough history to split.
  splitValidation: SplitValidation | null;
}

async function getJSON(url: string): Promise<unknown | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

interface ChartResponse {
  closes?: (number | null)[];
  timestamps?: number[];
}

async function fetchSeries(symbol: string): Promise<RawSeries> {
  const j = (await getJSON(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=5y&interval=1wk`)) as ChartResponse | null;
  return { closes: j?.closes ?? [], timestamps: j?.timestamps ?? [] };
}

interface SummaryInfo {
  targetMean: number | null;
  priceToBook: number | null;
  returnOnEquity: number | null;
}

const CONVICTION_BASE = 30;
const FACTOR_SCALE = 12;

function buildConviction(
  backtest: BacktestResult,
  tickers: string[],
  buyThreshold: number,
  liveScores: Record<string, number | null>,
  valueQualityZ: Record<string, number | null>,
): Conviction {
  const selected = tickers.filter((t) => (liveScores[t] ?? -Infinity) > buyThreshold);
  const pool = selected.length > 0 ? selected : tickers;

  const avg = (sel: (t: string) => number | null) => {
    const vals = pool.map(sel).filter((v): v is number => v != null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const avgMomZ = avg((t) => backtest.latestScores[t]?.zMomentum ?? null);
  const avgTrendZ = avg((t) => backtest.latestScores[t]?.zTrend ?? null);
  const avgVolZ = avg((t) => backtest.latestScores[t]?.zVol ?? null);
  const avgValueQuality = avg((t) => valueQualityZ[t] ?? null);
  const avgLive = avg((t) => liveScores[t] ?? null);

  const net = Math.round(avgLive * 35);
  const score = Math.max(0, Math.min(100, CONVICTION_BASE + net));
  const stance = score >= 65 ? 'Risk-on' : score <= 35 ? 'Cautious' : 'Neutral';
  const round1 = (v: number) => Math.round(v * FACTOR_SCALE * 10) / 10;
  const scope = selected.length > 0 ? `the ${selected.length} name(s) currently rated BUY` : 'all tracked names (none clear the BUY bar right now)';

  return {
    score,
    net,
    stance,
    factors: [
      { label: '6-month momentum', why: `Average momentum z-score across ${scope}`, val: round1(avgMomZ) },
      { label: 'Trend (13/52-week)', why: `Average trend z-score across ${scope}`, val: round1(avgTrendZ) },
      { label: 'Low-volatility tilt', why: `Average low-vol z-score across ${scope} (inverted realized vol)`, val: round1(avgVolZ) },
      { label: 'Value & quality', why: `Average P/B (inverted) + ROE z-score across ${scope} — today's snapshot only, not backtested`, val: round1(avgValueQuality) },
    ],
  };
}

interface RawData {
  weekKeys: string[];
  series: Record<string, number[]>;
  summary: Record<string, SummaryInfo>;
}

interface FetchState {
  raw: RawData | null;
  error: string | null;
}

// Fetches the price history + analyst consensus once (and on a slow interval), independent of
// the risk-level toggle — that data doesn't change when you switch risk profiles, only which
// strategy parameters get applied to it.
function useRawMarketData(): FetchState {
  const [state, setState] = useState<FetchState>({ raw: null, error: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const tickers = Object.keys(STOCK_YAHOO);
      try {
        const [chartEntries, benchSeries] = await Promise.all([
          Promise.all(tickers.map(async (t) => [t, await fetchSeries(STOCK_YAHOO[t])] as const)),
          fetchSeries(BENCHMARK_SYMBOL),
        ]);
        if (cancelled) return;

        const raw: Record<string, RawSeries> = { [BENCHMARK_SYMBOL]: benchSeries };
        for (const [t, data] of chartEntries) raw[t] = data;

        const { weekKeys, series } = alignSeries(raw);
        if (weekKeys.length === 0 || Object.values(series).every((s) => s.every((v) => v == null))) {
          throw new Error('No price history returned — Yahoo Finance may be unreachable right now');
        }

        const yahooSymbols = tickers.map((t) => STOCK_YAHOO[t]).join(',');
        const summaryResp = (await getJSON(`/api/summary?symbols=${encodeURIComponent(yahooSymbols)}`)) as
          | { summary?: Record<string, SummaryInfo> }
          | null;
        if (cancelled) return;

        setState({ raw: { weekKeys, series, summary: summaryResp?.summary ?? {} }, error: null });
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({ ...prev, error: err instanceof Error ? err.message : 'Failed to load the factor model' }));
        }
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return state;
}

// Systematic momentum + trend + low-volatility factor model, complementary to the
// portfolio's current-weights backtest above: this one dynamically picks among the
// 12 tracked names each month rather than holding fixed weights. See backtest.ts for
// the methodology and its caveats (small universe, short history, no OOS validation).
// The risk-level toggle changes how many names it holds and how strict the quality bar
// is (conservative = pickier + more cash-like, aggressive = looser + more diversified),
// matching the existing risk-level cash%/tilt copy elsewhere in the app. Switching risk
// level only recomputes the backtest against already-fetched data — it never re-fetches.
export function useQuantModel(riskLevel: RiskLevel = 'balanced'): QuantModel {
  const { raw, error } = useRawMarketData();

  return useMemo<QuantModel>(() => {
    if (!raw) return { ready: false, error, backtest: null, signals: [], conviction: null, liveScores: {}, splitValidation: null };

    const tickers = Object.keys(STOCK_YAHOO);
    const opts = RISK_OPTIONS[riskLevel];
    const buyThreshold = opts.scoreThreshold ?? 0;
    const { weekKeys, series, summary } = raw;
    const backtest = runBacktest(weekKeys, series, tickers, BENCHMARK_SYMBOL, opts);

    // Value (inverted P/B) + quality (ROE) cross-sectional z-scores, today's snapshot only —
    // Yahoo's free consensus data has no history, so this can't be run through the backtest
    // engine above; it only tilts which names get picked/labelled right now.
    const pbZ = zScores(tickers.map((t) => summary[STOCK_YAHOO[t]]?.priceToBook ?? null)).map((z) => (z == null ? null : -z));
    const roeZ = zScores(tickers.map((t) => summary[STOCK_YAHOO[t]]?.returnOnEquity ?? null));
    const valueQualityZ: Record<string, number | null> = {};
    tickers.forEach((t, i) => {
      const parts = [pbZ[i], roeZ[i]].filter((v): v is number => v != null);
      valueQualityZ[t] = parts.length > 0 ? parts.reduce((a, b) => a + b, 0) / parts.length : null;
    });

    const liveScores: Record<string, number | null> = {};
    tickers.forEach((t) => {
      const composite = backtest.latestScores[t]?.composite ?? null;
      const vq = valueQualityZ[t];
      liveScores[t] = composite == null ? vq : vq == null ? composite : composite * 0.7 + vq * 0.3;
    });

    const signals: QuantSignalRow[] = tickers.map((t) => {
      const snap = backtest.latestScores[t];
      const liveScore = liveScores[t];
      const act: QuantSignalRow['act'] =
        liveScore == null ? 'HOLD' : liveScore > buyThreshold ? 'BUY' : liveScore < -buyThreshold ? 'SELL' : 'HOLD';

      const target = summary[STOCK_YAHOO[t]]?.targetMean ?? null;
      const lastClose = series[t][series[t].length - 1];
      const upsidePct = target != null && lastClose ? ((target - lastClose) / lastClose) * 100 : 0;

      const parts: string[] = [];
      if (snap?.momentum != null) parts.push(`${snap.momentum >= 0 ? '+' : ''}${(snap.momentum * 100).toFixed(1)}% 6m momentum`);
      if (snap?.trend != null) parts.push(`${snap.trend >= 0 ? 'above' : 'below'} 13/52-week trend`);
      if (snap?.vol != null) parts.push(`${(snap.vol * 100).toFixed(0)}% realized vol`);
      if (valueQualityZ[t] != null) parts.push(`${valueQualityZ[t]! >= 0 ? '+' : ''}${valueQualityZ[t]!.toFixed(1)} value/quality z`);
      const reason = parts.length > 0 ? parts.join(' · ') : 'Insufficient price history for a signal';

      const factorZ: FactorZ = {
        momentum: snap?.zMomentum ?? null,
        trend: snap?.zTrend ?? null,
        lowVol: snap?.zVol ?? null,
        valueQuality: valueQualityZ[t] ?? null,
      };

      return { ticker: t, name: NAMES[t] ?? t, act, target, upsidePct, reason, liveScore, factorZ };
    });

    const conviction = buildConviction(backtest, tickers, buyThreshold, liveScores, valueQualityZ);
    const splitValidation = runSplitValidation(weekKeys, series, tickers, BENCHMARK_SYMBOL, opts);
    return { ready: true, error: null, backtest, signals, conviction, liveScores, splitValidation };
  }, [raw, error, riskLevel]);
}
