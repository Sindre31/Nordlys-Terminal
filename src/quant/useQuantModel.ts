import { useEffect, useState } from 'react';
import { STOCK_YAHOO } from '../data';
import { alignSeries, type RawSeries } from './align';
import { runBacktest, type BacktestResult } from './backtest';

const BENCHMARK_SYMBOL = 'OSEBX.OL';
const REFRESH_MS = 15 * 60_000;

const NAMES: Record<string, string> = {
  EQNR: 'Equinor', DNB: 'DNB Bank', TEL: 'Telenor', NHY: 'Norsk Hydro', MOWI: 'Mowi',
  YAR: 'Yara International', AKRBP: 'Aker BP', KOG: 'Kongsberg Gruppen', SALM: 'SalMar',
  LMT: 'Lockheed Martin', XOM: 'Exxon Mobil', NVDA: 'NVIDIA',
};

export interface QuantSignalRow {
  ticker: string;
  name: string;
  act: 'BUY' | 'HOLD' | 'SELL';
  target: number | null;
  upsidePct: number;
  reason: string;
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
  backtest: BacktestResult | null;
  signals: QuantSignalRow[];
  conviction: Conviction | null;
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
}

const CONVICTION_BASE = 30;
const FACTOR_SCALE = 12;
const BUY_THRESHOLD = 0.5;

function buildConviction(backtest: BacktestResult, tickers: string[]): Conviction {
  const selected = tickers.filter((t) => (backtest.latestScores[t]?.composite ?? -Infinity) > BUY_THRESHOLD);
  const pool = selected.length > 0 ? selected : tickers;

  const avg = (sel: (t: string) => number | null) => {
    const vals = pool.map(sel).filter((v): v is number => v != null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const avgMomZ = avg((t) => backtest.latestScores[t]?.zMomentum ?? null);
  const avgTrendZ = avg((t) => backtest.latestScores[t]?.zTrend ?? null);
  const avgVolZ = avg((t) => backtest.latestScores[t]?.zVol ?? null);
  const avgComposite = avg((t) => backtest.latestScores[t]?.composite ?? null);

  const net = Math.round(avgComposite * 35);
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
    ],
  };
}

// Systematic momentum + trend + low-volatility factor model, complementary to the
// portfolio's current-weights backtest above: this one dynamically picks among the
// 12 tracked names each month rather than holding fixed weights. See backtest.ts for
// the methodology and its caveats (small universe, short history, no OOS validation).
export function useQuantModel(): QuantModel {
  const [state, setState] = useState<QuantModel>({ ready: false, backtest: null, signals: [], conviction: null });

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
        const backtest = runBacktest(weekKeys, series, tickers, BENCHMARK_SYMBOL);

        const yahooSymbols = tickers.map((t) => STOCK_YAHOO[t]).join(',');
        const summaryResp = (await getJSON(`/api/summary?symbols=${encodeURIComponent(yahooSymbols)}`)) as
          | { summary?: Record<string, SummaryInfo> }
          | null;
        if (cancelled) return;
        const summary = summaryResp?.summary ?? {};

        const signals: QuantSignalRow[] = tickers.map((t) => {
          const snap = backtest.latestScores[t];
          const composite = snap?.composite ?? null;
          const act: QuantSignalRow['act'] = composite == null ? 'HOLD' : composite > 0.5 ? 'BUY' : composite < -0.5 ? 'SELL' : 'HOLD';

          const target = summary[STOCK_YAHOO[t]]?.targetMean ?? null;
          const lastClose = series[t][series[t].length - 1];
          const upsidePct = target != null && lastClose ? ((target - lastClose) / lastClose) * 100 : 0;

          const parts: string[] = [];
          if (snap?.momentum != null) parts.push(`${snap.momentum >= 0 ? '+' : ''}${(snap.momentum * 100).toFixed(1)}% 6m momentum`);
          if (snap?.trend != null) parts.push(`${snap.trend >= 0 ? 'above' : 'below'} 13/52-week trend`);
          if (snap?.vol != null) parts.push(`${(snap.vol * 100).toFixed(0)}% realized vol`);
          const reason = parts.length > 0 ? parts.join(' · ') : 'Insufficient price history for a signal';

          return { ticker: t, name: NAMES[t] ?? t, act, target, upsidePct, reason };
        });

        const conviction = buildConviction(backtest, tickers);
        setState({ ready: true, backtest, signals, conviction });
      } catch {
        // keep previous state (or stay not-ready) on failure
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
