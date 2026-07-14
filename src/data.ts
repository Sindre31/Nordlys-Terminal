import { useEffect, useRef, useState } from 'react';

// ---- Yahoo symbol maps -------------------------------------------------------

// Internal ticker -> Yahoo Finance symbol. Funds (GLOBAL, DNBTEK) have no
// reliable free quote, so they stay on their designed placeholder values.
export const STOCK_YAHOO: Record<string, string> = {
  EQNR: 'EQNR.OL',
  DNB: 'DNB.OL',
  TEL: 'TEL.OL',
  NHY: 'NHY.OL',
  MOWI: 'MOWI.OL',
  YAR: 'YAR.OL',
  AKRBP: 'AKRBP.OL',
  KOG: 'KOG.OL',
  SALM: 'SALM.OL',
  LMT: 'LMT',
  XOM: 'XOM',
  NVDA: 'NVDA',
  TOM: 'TOM.OL',
  FRO: 'FRO.OL',
  ORK: 'ORK.OL',
  STB: 'STB.OL',
};

// Index / commodity / FX strip.
export const INDEX_TILES: { label: string; symbol: string; kind: 'index' | 'fx' | 'usd' }[] = [
  { label: 'OSEBX', symbol: 'OSEBX.OL', kind: 'index' },
  { label: 'OBX', symbol: 'OBX.OL', kind: 'index' },
  { label: 'USD/NOK', symbol: 'USDNOK=X', kind: 'fx' },
  { label: 'EUR/NOK', symbol: 'EURNOK=X', kind: 'fx' },
  { label: 'BRENT', symbol: 'BZ=F', kind: 'usd' },
  { label: 'GOLD', symbol: 'GC=F', kind: 'usd' },
];

export const FX_RATES: { label: string; symbol: string }[] = [
  { label: 'USD/NOK', symbol: 'USDNOK=X' },
  { label: 'EUR/NOK', symbol: 'EURNOK=X' },
  { label: 'GBP/NOK', symbol: 'GBPNOK=X' },
];

// Every symbol we want in one batched request.
export const ALL_SYMBOLS: string[] = Array.from(
  new Set([
    ...Object.values(STOCK_YAHOO),
    ...INDEX_TILES.map((t) => t.symbol),
    ...FX_RATES.map((t) => t.symbol),
  ]),
);

// ---- Types -------------------------------------------------------------------

export interface Quote {
  price: number;
  prevClose: number | null;
  open: number | null;
  change: number;
  changePct: number;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  currency: string;
  name: string;
}

export type QuoteMap = Record<string, Quote>;

export interface NewsItem {
  title: string;
  source: string;
  time: number | null;
  link: string;
  ticker: string;
  image?: string;
}

// ---- Formatting --------------------------------------------------------------

export function fmtNum(n: number, dec = 2): string {
  if (n == null || !isFinite(n)) return '—';
  const fixed = n.toFixed(dec);
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decPart ? `${grouped}.${decPart}` : grouped;
}

export function fmtPrice(n: number): string {
  return fmtNum(n, 2);
}

export function fmtFx(n: number): string {
  return fmtNum(n, 3);
}

export function fmtVol(n: number | null): string {
  if (n == null || !isFinite(n)) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

export function fmtTime(unixSeconds: number | null): string {
  if (!unixSeconds) return '';
  const d = new Date(unixSeconds * 1000);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

// Oslo Børs continuous trading is roughly 09:00–16:20 CET, Mon–Fri.
export function osloClock(): { time: string; open: boolean } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Oslo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '';
  const hh = parseInt(get('hour'), 10);
  const mm = parseInt(get('minute'), 10);
  const wd = get('weekday');
  const weekday = wd !== 'Sat' && wd !== 'Sun';
  const mins = hh * 60 + mm;
  const open = weekday && mins >= 9 * 60 && mins <= 16 * 60 + 20;
  return { time: `${get('hour')}:${get('minute')} CET`, open };
}

// ---- Chart geometry ----------------------------------------------------------

export interface ChartPath {
  line: string; // polyline points
  area: string; // filled path with baseline close
  up: boolean;
}

export function buildChartPath(
  closes: number[],
  w: number,
  h: number,
  padTop = 12,
  padBottom = 12,
): ChartPath | null {
  const pts = (closes || []).filter((v) => typeof v === 'number' && isFinite(v));
  if (pts.length < 2) return null;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const innerH = h - padTop - padBottom;
  const coords = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = padTop + (1 - (v - min) / span) * innerH;
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `M${coords[0][0].toFixed(1)},${coords[0][1].toFixed(1)} ` +
    coords.slice(1).map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ') +
    ` L${w},${h} L0,${h} Z`;
  return { line, area, up: pts[pts.length - 1] >= pts[0] };
}

// ---- Fetch-health registry ---------------------------------------------------
// Every live fetch records whether it last succeeded and when, keyed by endpoint (the path
// before "?"). A small status badge reads this so the UI can tell the user, honestly, whether
// what they're looking at is live, delayed, or currently unavailable — instead of silently
// implying every number is fresh. This is the counterpart to showing "—" for missing values:
// it discloses the health of the pipe, not just the individual cells.

export interface EndpointHealth {
  ok: boolean; // did the most recent fetch to this endpoint succeed?
  at: number; // epoch ms of that most recent attempt
}
export type HealthMap = Record<string, EndpointHealth>;

const health: HealthMap = {};
const healthSubs = new Set<() => void>();

function endpointOf(url: string): string {
  const q = url.indexOf('?');
  return q >= 0 ? url.slice(0, q) : url;
}

function recordHealth(url: string, ok: boolean): void {
  health[endpointOf(url)] = { ok, at: Date.now() };
  healthSubs.forEach((fn) => fn());
}

// Subscribe a React component to health changes. Returns the live (mutable) map; the version
// counter is what actually forces the re-render.
export function useDataHealth(): HealthMap {
  const [, setV] = useState(0);
  useEffect(() => {
    const fn = () => setV((v) => v + 1);
    healthSubs.add(fn);
    return () => {
      healthSubs.delete(fn);
    };
  }, []);
  return health;
}

// Overall pipeline status derived from the health map. "offline" if every recent attempt failed,
// "delayed" if some failed or the freshest success is stale, else "live".
export type PipelineStatus = 'live' | 'delayed' | 'offline' | 'connecting';
export function pipelineStatus(h: HealthMap, staleMs = 180000): { status: PipelineStatus; newest: number | null } {
  const entries = Object.values(h);
  if (entries.length === 0) return { status: 'connecting', newest: null };
  const okEntries = entries.filter((e) => e.ok);
  const newest = okEntries.length ? Math.max(...okEntries.map((e) => e.at)) : null;
  if (okEntries.length === 0) return { status: 'offline', newest: null };
  const anyFailed = entries.some((e) => !e.ok);
  const stale = newest != null && Date.now() - newest > staleMs;
  return { status: anyFailed || stale ? 'delayed' : 'live', newest };
}

// ---- Fetch helpers -----------------------------------------------------------

async function getJSON(url: string): Promise<unknown | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) {
      recordHealth(url, false);
      return null;
    }
    recordHealth(url, true);
    return await r.json();
  } catch {
    recordHealth(url, false);
    return null;
  }
}

// ---- Hooks -------------------------------------------------------------------

// Batched live quotes, refreshed on an interval. Empty until the first
// successful response, so callers should fall back to their static data.
export function useQuotes(symbols: string[], intervalMs = 30000): QuoteMap {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const key = symbols.join(',');
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = (await getJSON(`/api/quote?symbols=${encodeURIComponent(key)}`)) as
        | { quotes?: QuoteMap }
        | null;
      if (alive && j && j.quotes) setQuotes(j.quotes);
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [key, intervalMs]);
  return quotes;
}

export function useNews(query: string, ticker = '', intervalMs = 120000): NewsItem[] {
  const [news, setNews] = useState<NewsItem[]>([]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = (await getJSON(`/api/news?q=${encodeURIComponent(query)}&ticker=${encodeURIComponent(ticker)}`)) as
        | { news?: NewsItem[] }
        | null;
      if (alive && j && Array.isArray(j.news)) setNews(j.news);
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [query, ticker, intervalMs]);
  return news;
}

export function useChart(symbol: string | null, range: string): number[] {
  const [closes, setCloses] = useState<number[]>([]);
  const last = useRef<string>('');
  useEffect(() => {
    if (!symbol) {
      setCloses([]);
      return;
    }
    const sig = `${symbol}|${range}`;
    last.current = sig;
    let alive = true;
    (async () => {
      const j = (await getJSON(
        `/api/chart?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`,
      )) as { closes?: number[] } | null;
      if (alive && last.current === sig && j && Array.isArray(j.closes)) setCloses(j.closes);
    })();
    return () => {
      alive = false;
    };
  }, [symbol, range]);
  return closes;
}

// ---- Portfolio valuation -----------------------------------------------------

export interface Position {
  ticker: string;
  qty: number; // shares held (0 for funds with no live price)
  theme: string;
  fallbackNok: number; // designed NOK value, used when no live price is available
  costNok?: number; // persisted cost basis (e.g. from a saved ledger); defaults to today's value
}

export interface PortfolioRow {
  ticker: string;
  theme: string;
  valueNok: number;
  todayNok: number;
  chgPct: number;
  costNok: number;
}

export interface Portfolio {
  rows: PortfolioRow[];
  totalValue: number;
  totalToday: number;
  todayPct: number;
  sinceInception: number;
  cashNok: number;
  cashPct: number;
  usdnok: number;
  themeAlloc: { label: string; valueNok: number; pct: number }[];
  allocOf: (ticker: string) => number;
  valueOf: (ticker: string) => number;
}

// Values positions at live prices (USD holdings converted via USD/NOK), and
// derives totals, today's P&L, since-inception return and theme allocation.
// Cost basis is whatever the caller persisted (e.g. a saved portfolio ledger); a
// position with no persisted cost basis defaults to today's value, so a brand
// new holding starts at 0% since inception rather than a fabricated return.
export function computePortfolio(live: QuoteMap, positions: Position[], cashNok: number): Portfolio {
  const usdnok = live['USDNOK=X']?.price ?? 10.61;
  const quoteOf = (t: string): Quote | undefined => {
    const y = STOCK_YAHOO[t];
    return y ? live[y] : undefined;
  };
  const priceNok = (t: string): number | null => {
    const q = quoteOf(t);
    if (!q) return null;
    return q.currency === 'USD' ? q.price * usdnok : q.price;
  };
  const rows: PortfolioRow[] = positions.map((p) => {
    const pn = priceNok(p.ticker);
    const valueNok = p.qty > 0 && pn != null ? p.qty * pn : p.fallbackNok;
    const chgPct = quoteOf(p.ticker)?.changePct ?? 0;
    const todayNok = (valueNok * chgPct) / 100;
    const costNok = p.costNok ?? valueNok;
    return { ticker: p.ticker, theme: p.theme, valueNok, todayNok, chgPct, costNok };
  });
  const holdingsValue = rows.reduce((s, r) => s + r.valueNok, 0);
  const totalValue = holdingsValue + cashNok;
  const totalToday = rows.reduce((s, r) => s + r.todayNok, 0);
  const totalCost = rows.reduce((s, r) => s + r.costNok, 0) + cashNok;
  const prevTotal = totalValue - totalToday;
  const todayPct = prevTotal > 0 ? (totalToday / prevTotal) * 100 : 0;
  const sinceInception = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  const themeMap = new Map<string, number>();
  for (const r of rows) themeMap.set(r.theme, (themeMap.get(r.theme) || 0) + r.valueNok);
  themeMap.set('Cash', cashNok);
  const themeAlloc = [...themeMap.entries()]
    .map(([label, v]) => ({ label, valueNok: v, pct: totalValue > 0 ? (v / totalValue) * 100 : 0 }))
    .sort((a, b) => b.valueNok - a.valueNok);

  const rowFor = (t: string) => rows.find((r) => r.ticker === t);
  return {
    rows,
    totalValue,
    totalToday,
    todayPct,
    sinceInception,
    cashNok,
    cashPct: totalValue > 0 ? (cashNok / totalValue) * 100 : 0,
    usdnok,
    themeAlloc,
    allocOf: (t) => (totalValue > 0 ? ((rowFor(t)?.valueNok ?? 0) / totalValue) * 100 : 0),
    valueOf: (t) => rowFor(t)?.valueNok ?? 0,
  };
}

export interface DividendInfo {
  latest: number | null;
  latestDate: number | null;
  trailing: number;
  currency: string;
}
export interface SummaryInfo {
  targetMean: number | null;
  targetHigh: number | null;
  targetLow: number | null;
  recMean: number | null;
  recKey: string | null;
  numAnalysts: number | null;
  beta: number | null;
  trailingEps: number | null;
  buy: number;
  hold: number;
  sell: number;
  earningsDate: number | null;
}
export interface RiskStats {
  annVol: number | null;
  maxDrawdown: number | null;
  var95: number | null;
  sharpe: number | null;
  beta: number | null;
  days: number;
  portReturn: number | null;
  benchReturn: number | null;
  holdingReturns: Record<string, number>;
}
// Real portfolio risk metrics from 1y price history. `pairs` are
// "SYMBOL:weight" strings (weight = fraction of total portfolio value).
export function useRiskStats(pairs: string[], rf: number, intervalMs = 1800000): RiskStats {
  const [stats, setStats] = useState<RiskStats>({ annVol: null, maxDrawdown: null, var95: null, sharpe: null, beta: null, days: 0, portReturn: null, benchReturn: null, holdingReturns: {} });
  const key = pairs.join(',');
  useEffect(() => {
    if (!key) return;
    let alive = true;
    const load = async () => {
      const j = (await getJSON(`/api/history?symbols=${encodeURIComponent(key)}&rf=${rf}`)) as Partial<RiskStats> | null;
      if (alive && j)
        setStats({
          annVol: j.annVol ?? null,
          maxDrawdown: j.maxDrawdown ?? null,
          var95: j.var95 ?? null,
          sharpe: j.sharpe ?? null,
          beta: j.beta ?? null,
          days: j.days ?? 0,
          portReturn: j.portReturn ?? null,
          benchReturn: j.benchReturn ?? null,
          holdingReturns: j.holdingReturns ?? {},
        });
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => { alive = false; clearInterval(id); };
  }, [key, rf, intervalMs]);
  return stats;
}

export interface BacktestResult {
  ok: boolean;
  startYear?: number;
  endYear?: number;
  pEquity?: number[];
  bEquity?: number[];
  metrics?: {
    cagr: number; totalReturn: number; annVol: number; sharpe: number; sortino: number;
    maxDrawdown: number; alpha: number; beta: number; winRate: number; bestYear: number;
    worstYear: number; turnover: number; finalValue: number; benchFinal: number;
  };
  annual?: { year: string; p: number; b: number }[];
}
export function useBacktest(pairs: string[], rf: number, intervalMs = 21600000): BacktestResult {
  const [bt, setBt] = useState<BacktestResult>({ ok: false });
  const key = pairs.join(',');
  useEffect(() => {
    if (!key) return;
    let alive = true;
    const load = async () => {
      const j = (await getJSON(`/api/backtest?symbols=${encodeURIComponent(key)}&rf=${rf}`)) as BacktestResult | null;
      if (alive && j && j.ok) setBt(j);
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => { alive = false; clearInterval(id); };
  }, [key, rf, intervalMs]);
  return bt;
}

export interface InsiderTrade {
  id: number;
  ticker: string;
  company: string;
  title: string;
  date: string;
  side: string;
  link: string;
}

export function useDividends(symbols: string[], intervalMs = 3600000): Record<string, DividendInfo> {
  const [divs, setDivs] = useState<Record<string, DividendInfo>>({});
  const key = symbols.join(',');
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = (await getJSON(`/api/dividends?symbols=${encodeURIComponent(key)}`)) as
        | { dividends?: Record<string, DividendInfo> }
        | null;
      if (alive && j && j.dividends) setDivs(j.dividends);
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => { alive = false; clearInterval(id); };
  }, [key, intervalMs]);
  return divs;
}

export function useSummary(symbols: string[], intervalMs = 900000): Record<string, SummaryInfo> {
  const [sum, setSum] = useState<Record<string, SummaryInfo>>({});
  const key = symbols.join(',');
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = (await getJSON(`/api/summary?symbols=${encodeURIComponent(key)}`)) as
        | { summary?: Record<string, SummaryInfo> }
        | null;
      if (alive && j && j.summary) setSum(j.summary);
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => { alive = false; clearInterval(id); };
  }, [key, intervalMs]);
  return sum;
}

export interface Fundamentals {
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
  roe: number | null;
  dividendYield: number | null;
  currency: string;
  revenueTrend: number[];
  beat: boolean | null;
}
export function useFundamentals(symbol: string, intervalMs = 3600000): Fundamentals | null {
  const [f, setF] = useState<Fundamentals | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = (await getJSON(`/api/fundamentals?symbol=${encodeURIComponent(symbol)}`)) as
        | { fundamentals?: Fundamentals }
        | null;
      if (alive && j && j.fundamentals && j.fundamentals.revenue != null) setF(j.fundamentals);
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => { alive = false; clearInterval(id); };
  }, [symbol, intervalMs]);
  return f;
}

export function useInsider(intervalMs = 600000): InsiderTrade[] {
  const [trades, setTrades] = useState<InsiderTrade[]>([]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = (await getJSON('/api/insider?limit=14')) as { trades?: InsiderTrade[] } | null;
      if (alive && j && Array.isArray(j.trades)) setTrades(j.trades);
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => { alive = false; clearInterval(id); };
  }, [intervalMs]);
  return trades;
}

// Format a unix-seconds earnings/ex date as {day, mon} and a short label.
export function fmtDayMon(unixSeconds: number | null): { day: string; mon: string; label: string } {
  if (!unixSeconds) return { day: '', mon: '', label: '' };
  const d = new Date(unixSeconds * 1000);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });
  return { day, mon, label: `${day} ${mon}` };
}

// Official macro figures (Norges Bank policy rate + SSB CPI). Null until loaded.
export function useMacro(intervalMs = 3600000): { policyRate: number | null; cpi: number | null; bond10y: number | null } {
  const [macro, setMacro] = useState<{ policyRate: number | null; cpi: number | null; bond10y: number | null }>({ policyRate: null, cpi: null, bond10y: null });
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = (await getJSON('/api/macro')) as { policyRate?: number | null; cpi?: number | null; bond10y?: number | null } | null;
      if (alive && j) setMacro({ policyRate: j.policyRate ?? null, cpi: j.cpi ?? null, bond10y: j.bond10y ?? null });
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs]);
  return macro;
}

// Live wall clock (Oslo), ticking once a minute.
export function useOsloClock(): { time: string; open: boolean } {
  const [c, setC] = useState(osloClock());
  useEffect(() => {
    const id = setInterval(() => setC(osloClock()), 30000);
    return () => clearInterval(id);
  }, []);
  return c;
}
