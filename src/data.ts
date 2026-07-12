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
  publisher: string;
  time: number | null;
  link: string;
  tickers: string[];
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

// ---- Fetch helpers -----------------------------------------------------------

async function getJSON(url: string): Promise<unknown | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
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

export function useNews(query: string, intervalMs = 120000): NewsItem[] {
  const [news, setNews] = useState<NewsItem[]>([]);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = (await getJSON(`/api/news?q=${encodeURIComponent(query)}`)) as
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
  }, [query, intervalMs]);
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
// Cost basis is inferred so the designed prices reproduce ~+18.4% since start.
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
    const costNok = p.fallbackNok / 1.184;
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

// Official macro figures (Norges Bank policy rate). Null until loaded.
export function useMacro(intervalMs = 3600000): { policyRate: number | null } {
  const [macro, setMacro] = useState<{ policyRate: number | null }>({ policyRate: null });
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const j = (await getJSON('/api/macro')) as { policyRate?: number | null } | null;
      if (alive && j) setMacro({ policyRate: j.policyRate ?? null });
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
