import React, { useEffect, useRef, useState } from 'react';
import {
  ALL_SYMBOLS,
  STOCK_YAHOO,
  INDEX_TILES,
  FX_RATES,
  useQuotes,
  useNews,
  useChart,
  useSparklines,
  useMacro,
  useOsloClock,
  useDividends,
  useSummary,
  useInsider,
  useFundamentals,
  useRiskStats,
  useBacktest,
  useDataHealth,
  pipelineStatus,
  fmtDayMon,
  computePortfolio,
  buildChartPath,
  mergeQuote,
  rankByChange,
  type Position,
  type StockDisplay,
  fmtPrice,
  fmtFx,
  fmtNum,
  fmtTime,
  type QuoteMap,
} from './data';
import { useQuantModel, RISK_OPTIONS, type FactorZ } from './quant/useQuantModel';
import FxTab from './tabs/FxTab';
import InsiderTab from './tabs/InsiderTab';
import AttributionTab from './tabs/AttributionTab';
import BacktestTab from './tabs/BacktestTab';
import NewsTab from './tabs/NewsTab';
import WatchlistTab from './tabs/WatchlistTab';
import ReportsTab from './tabs/ReportsTab';
import AlertsTab from './tabs/AlertsTab';
import RiskTab from './tabs/RiskTab';
import MarketsTab from './tabs/MarketsTab';
import AiPortfolioTab from './tabs/AiPortfolioTab';
import {
  LEDGER_VERSION,
  isValidLedger,
  rebaseBenchmark,
  type PortfolioLedger,
  type LedgerHolding,
  type LedgerTransaction,
  type RebalanceAction,
} from './ledger';
import {
  loadLS,
  saveLS,
  loadValidArray,
  isAlertRule,
  isTriggeredAlert,
  evaluateAlerts,
  type AlertRule,
  type TriggeredAlert,
} from './storage';
import {
  css,
  chgEl,
  pctColor,
  pctText,
  deltaBadge,
  factorBar,
  factorVal,
  sentBadge,
  convBadge,
  askTag,
  dot,
  actBadge,
  upside,
  rating,
  hbar,
  contribBar,
  ppVal,
  ccyPill,
  fxRisk,
  side,
  scImpact,
} from './ui';

// The AI portfolio's inception is today — every holding's "held since" reads as today
// until a real rebalance changes it, rather than a fabricated pre-dated history.
function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function stocks() {
  // Only real static metadata: display name and (for non-NOK names) the trading currency.
  // Every price/change/range/volume/market-cap field starts as "—" and is filled from the live
  // quote when it loads (see the S map in the component) — never a designed placeholder number.
  // Market cap has no free live source, so it stays "—".
  const dash = { last: '—', chg: null, open: '—', range: '—', vol: '—', cap: '—' };
  const mk = (name: string, cur?: string) => ({ name, ...dash, ...(cur ? { cur } : {}) });
  return {
    EQNR: mk('Equinor'),
    DNB: mk('DNB Bank'),
    TEL: mk('Telenor'),
    NHY: mk('Norsk Hydro'),
    MOWI: mk('Mowi'),
    YAR: mk('Yara International'),
    AKRBP: mk('Aker BP'),
    KOG: mk('Kongsberg Gruppen'),
    SALM: mk('SalMar'),
    LMT: mk('Lockheed Martin', 'USD'),
    XOM: mk('Exxon Mobil', 'USD'),
    NVDA: mk('NVIDIA', 'USD'),
    GLOBAL: mk('Nordnet Indeksfond Global', 'NOK'),
    DNBTEK: mk('DNB Teknologi A', 'NOK'),
    TOM: mk('Tomra Systems'),
    FRO: mk('Frontline'),
    ORK: mk('Orkla'),
    STB: mk('Storebrand'),
  } as Record<string, StockDisplay>;
}

type Tab = 'markets' | 'watchlist' | 'news' | 'reports' | 'alerts' | 'ai' | 'risk' | 'fx' | 'attr' | 'ins' | 'bt';
type RiskLevel = 'conservative' | 'balanced' | 'aggressive';

const TABS: Tab[] = ['markets', 'watchlist', 'news', 'reports', 'alerts', 'ai', 'risk', 'fx', 'attr', 'ins', 'bt'];
const RISK_LEVELS: RiskLevel[] = ['conservative', 'balanced', 'aggressive'];
const TAB_TITLES: Record<Tab, string> = {
  markets: 'Markets', watchlist: 'Watchlist', news: 'News', reports: 'Reports', alerts: 'Alerts',
  ai: 'AI Portfolio', risk: 'Risk', fx: 'Currency', attr: 'Attribution', ins: 'Insider', bt: 'Backtest',
};

// Real watchlist mini-sparkline: draws the actual trailing-week close series (from /api/chart) as an
// 80×22 polyline, coloured green/red by week-over-week direction. Returns null when there isn't
// enough real history yet, so nothing fabricated is ever shown in its place.
function realSpark(closes: number[]): React.ReactNode {
  const p = buildChartPath(closes, 80, 22, 3, 3);
  if (!p) return null;
  return (
    <svg viewBox="0 0 80 22" style={{ width: 80, height: 22 }} aria-hidden="true">
      <polyline points={p.line} fill="none" stroke={p.up ? '#3DBB84' : '#E4655E'} strokeWidth={1.4} />
    </svg>
  );
}

export default function Terminal() {
  // Restore the last-viewed tab and risk level so a refresh doesn't dump the user back to Markets /
  // the default profile. Validated against the known sets so a stale or hand-edited value can't
  // land the app on a tab that no longer exists.
  const [tab, setTab] = useState<Tab>(() => {
    const saved = loadLS<string>('nordlys_tab', 'markets');
    return (TABS as string[]).includes(saved) ? (saved as Tab) : 'markets';
  });
  const [stock, setStock] = useState<string | null>(null);
  const [showConv, setShowConv] = useState(false);
  const [rbEvent, setRbEvent] = useState<number | null>(null);
  const [risk, setRisk] = useState<RiskLevel>(() => {
    const saved = loadLS<string>('nordlys_risk', 'balanced');
    return (RISK_LEVELS as string[]).includes(saved) ? (saved as RiskLevel) : 'balanced';
  });
  const [watchTickers, setWatchTickers] = useState<string[]>(() => loadValidArray('nordlys_watchlist', (v): v is string => typeof v === 'string'));
  const [editWatch, setEditWatch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchMiss, setSearchMiss] = useState(false);
  const [idxRange, setIdxRange] = useState('1mo'); // OSEBX overview chart timeframe
  const [detailRange, setDetailRange] = useState('1mo'); // stock-detail chart timeframe
  const stockPanelRef = useRef<HTMLDivElement>(null);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(() => loadValidArray('nordlys_alert_rules', isAlertRule));
  const [triggeredToday, setTriggeredToday] = useState<TriggeredAlert[]>(() => loadValidArray('nordlys_alert_triggers', isTriggeredAlert));
  const [newAlertSym, setNewAlertSym] = useState('EQNR');
  const [newAlertCond, setNewAlertCond] = useState<'above' | 'below' | 'pct'>('above');
  const [newAlertPrice, setNewAlertPrice] = useState('');

  useEffect(() => { saveLS('nordlys_tab', tab); }, [tab]);
  // Reflect the active section in the tab title (SEO + orientation across browser tabs).
  useEffect(() => { document.title = `${TAB_TITLES[tab]} · Nordlys Terminal`; }, [tab]);
  useEffect(() => { saveLS('nordlys_risk', risk); }, [risk]);
  useEffect(() => { saveLS('nordlys_watchlist', watchTickers); }, [watchTickers]);
  useEffect(() => { saveLS('nordlys_alert_rules', alertRules); }, [alertRules]);
  useEffect(() => { saveLS('nordlys_alert_triggers', triggeredToday); }, [triggeredToday]);

  const active = 'padding:5px 12px; border-radius:5px; background:#1D2229; color:#fff; cursor:pointer; font-size:12.5px;';
  const idle = 'padding:5px 12px; border-radius:5px; color:#8A929E; cursor:pointer; font-size:12.5px;';
  const set = (t: Tab) => () => { setTab(t); setStock(null); };
  const open = (sym: string) => () => setStock(sym);
  // Makes a non-button clickable element keyboard-operable: focusable, activatable with
  // Enter/Space, and announced as a button. Spread onto the primary interactive controls.
  const clickable = (onClick: () => void, label?: string) => ({
    onClick,
    role: 'button',
    tabIndex: 0,
    ...(label ? { 'aria-label': label } : {}),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
  });
  // Renders a functional chart-timeframe pill. Yahoo range codes: 1D→1d, 1W→5d, 1M→1mo, 6M→6mo,
  // 1Y→1y. Clicking re-fetches the series via useChart (the api/chart handler picks the interval).
  const tfSpan = (label: string, rng: string, curRange: string, setRange: (r: string) => void, pad: string) => (
    <span
      key={label}
      {...clickable(() => setRange(rng), `${label} timeframe`)}
      style={css(`${pad} border-radius:5px; ${curRange === rng ? 'background:#1D2229; color:#fff;' : 'color:#8A929E;'}`)}
    >{label}</span>
  );
  const TF_DETAIL: [string, string][] = [['1D', '1d'], ['1W', '5d'], ['1M', '1mo'], ['6M', '6mo'], ['1Y', '1y']];
  // Jump to a symbol from the header search: match an internal ticker or a company-name prefix,
  // open its detail panel, and clear the box. No-op on an unknown query.
  const runSearch = () => {
    const q = searchInput.trim().toUpperCase();
    if (!q) return;
    const byTicker = Object.keys(base).find((t) => t === q);
    const byName = Object.keys(base).find((t) => base[t].name.toUpperCase().startsWith(q));
    const hit = byTicker || byName;
    if (hit) {
      setStock(hit);
      setSearchInput('');
      setSearchMiss(false);
    } else {
      setSearchMiss(true);
    }
  };

  // ---- Live data (falls back to the designed values until it loads) ----
  const live: QuoteMap = useQuotes(ALL_SYMBOLS);
  const dataHealth = useDataHealth();
  const clock = useOsloClock();
  const macro = useMacro();
  // Oslo-listed symbols for consensus/dividends/earnings (funds & US names excluded where no data).
  const OSLO_SET = ['EQNR', 'DNB', 'TEL', 'NHY', 'MOWI', 'YAR', 'AKRBP', 'KOG', 'SALM', 'TOM', 'FRO', 'ORK', 'STB'];
  const summarySymbols = OSLO_SET.map((t) => STOCK_YAHOO[t]).filter(Boolean) as string[];
  const summary = useSummary(summarySymbols);
  // Fetches for the full tracked universe so whichever names the model currently holds
  // already have dividend data available, rather than a fixed subset.
  const dividendSyms = Object.values(STOCK_YAHOO);
  const dividends = useDividends(dividendSyms);
  const insiderLive = useInsider();
  const marketNews = useNews('');
  const stockNews = useNews(stock ? stocks()[stock]?.name || '' : '', stock || '');
  const idxCloses = useChart('OSEBX.OL', idxRange);
  const detailCloses = useChart(stock ? STOCK_YAHOO[stock] || stock : null, detailRange);
  const quantModel = useQuantModel(risk);

  // Merge live quotes over the static base via the pure, unit-tested mergeQuote (data.ts).
  const base = stocks();
  const S: Record<string, StockDisplay> = {};
  for (const k of Object.keys(base)) {
    const y = STOCK_YAHOO[k];
    S[k] = mergeQuote(base[k], y ? live[y] : undefined);
  }
  // Live change % for a ticker (used by holdings tables), else the static value.
  const liveChg = (sym: string, fallback: number): number => {
    const y = STOCK_YAHOO[sym];
    const q = y ? live[y] : undefined;
    return q ? q.changePct : fallback;
  };
  const localPrice = (sym: string): number | null => {
    const y = STOCK_YAHOO[sym];
    const q = y ? live[y] : undefined;
    return q ? q.price : null;
  };
  const sumOf = (sym: string) => {
    const y = STOCK_YAHOO[sym];
    return y ? summary[y] : undefined;
  };

  const order = watchTickers;
  // Real trailing-week close series for each watchlist symbol, keyed by Yahoo symbol, for the
  // "7d" mini-sparklines below (replaces the old fixed synthetic curve).
  const sparkSeries = useSparklines(order.map((sym) => STOCK_YAHOO[sym] || sym));
  const addWatchSymbol = () => {
    const input = window.prompt(`Add a ticker to your watchlist (available: ${Object.keys(base).join(', ')}):`);
    if (!input) return;
    const sym = input.trim().toUpperCase();
    if (!base[sym]) {
      window.alert(`Unknown ticker "${sym}".`);
      return;
    }
    if (watchTickers.includes(sym)) return;
    setWatchTickers((prev) => [...prev, sym]);
  };
  const removeWatchSymbol = (sym: string) => setWatchTickers((prev) => prev.filter((t) => t !== sym));

  const createAlertRule = () => {
    const price = parseFloat(newAlertPrice.replace(',', '.'));
    if (!isFinite(price) || price <= 0) {
      window.alert('Enter a valid target value first.');
      return;
    }
    setAlertRules((prev) => [...prev, { id: Date.now(), ticker: newAlertSym, cond: newAlertCond, price }]);
    setNewAlertPrice('');
  };
  const removeAlertRule = (id: number) => setAlertRules((prev) => prev.filter((r) => r.id !== id));

  // Stock-detail overlay keyboard accessibility: close on Escape, move focus into the panel when
  // it opens, and restore focus to whatever was focused before (usually the row that opened it)
  // when it closes — standard modal behaviour so keyboard users aren't stranded.
  useEffect(() => {
    if (!stock) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStock(null);
    };
    document.addEventListener('keydown', onKey);
    stockPanelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      prevFocus?.focus?.();
    };
  }, [stock]);

  // Checks each active rule against the latest live price/change and logs a (de-duplicated,
  // once-per-day-per-rule) trigger — real detection rather than fabricated trigger events.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const nowLabel = new Date().toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
    setTriggeredToday((prev) => {
      const already = new Set(prev.filter((t) => t.date === today).map((t) => t.ruleId));
      // Detection logic is the pure, unit-tested evaluateAlerts (storage.ts). `live` is read inline
      // so it's the effect's only external dependency.
      const fresh = evaluateAlerts(
        alertRules,
        (ticker) => { const y = STOCK_YAHOO[ticker]; return y ? live[y] : undefined; },
        already,
        today,
        nowLabel,
      );
      return fresh.length ? [...fresh, ...prev].slice(0, 50) : prev;
    });
  }, [live, alertRules]);

  // ---- Live-valued AI portfolio (holdings picked by the quant model, priced at live quotes) ----
  // Holdings are the model's own top-N BUY-rated names for the current risk level (same
  // momentum/trend/low-vol/value/quality composite used in the Backtest tab). The actual
  // holdings, cost basis and cash balance are persisted in a "ledger" (localStorage) rather
  // than recomputed from scratch every render, so since-inception performance and the
  // rebalance history genuinely accumulate over time instead of resetting on every visit.
  const THEME_OF: Record<string, string> = {
    EQNR: 'Energy', AKRBP: 'Energy', XOM: 'Energy',
    KOG: 'Defence', LMT: 'Defence', TOM: 'Industrials',
    NHY: 'Materials', YAR: 'Materials',
    MOWI: 'Seafood', SALM: 'Seafood',
    DNB: 'Financials', STB: 'Financials',
    TEL: 'Telecom', NVDA: 'Tech', FRO: 'Shipping', ORK: 'Consumer',
  };
  const CASH_FRACTION: Record<RiskLevel, number> = { conservative: 0.15, balanced: 0.065, aggressive: 0.02 };
  const TOTAL_AUM = 1_300_000;
  const usdnokRate = live['USDNOK=X']?.price ?? null; // no fabricated FX; null until USD/NOK loads
  const priceNokFor = (t: string): number | null => {
    const y = STOCK_YAHOO[t];
    const q = y ? live[y] : undefined;
    if (!q) return null;
    if (q.currency === 'USD') return usdnokRate != null ? q.price * usdnokRate : null;
    return q.price;
  };
  const nativePriceFor = (t: string): number | null => {
    const y = STOCK_YAHOO[t];
    const q = y ? live[y] : undefined;
    return q ? q.price : null;
  };
  const qmOpts = RISK_OPTIONS[risk];
  const rankByLiveScore = (topN: number, threshold: number): string[] =>
    Object.entries(quantModel.liveScores)
      .map(([t, score]) => ({ t, score }))
      .filter((x): x is { t: string; score: number } => x.score != null && x.score > threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map((x) => x.t);
  const selectedTickers = quantModel.ready ? rankByLiveScore(qmOpts.topN ?? 5, qmOpts.scoreThreshold ?? 0) : [];
  const todayISO = new Date().toISOString().slice(0, 10);

  const [ledger, setLedger] = useState<PortfolioLedger | null>(() => {
    const saved = loadLS<unknown>('nordlys_portfolio_ledger', null);
    return isValidLedger(saved) ? saved : null; // discard incompatible/corrupt data → re-seed fresh
  });
  useEffect(() => {
    if (ledger) saveLS('nordlys_portfolio_ledger', ledger);
  }, [ledger]);

  // First-ever load: seed the ledger from today's model selection. Inception is genuinely
  // "today" — cost basis is today's live value, so since-inception starts at 0%.
  useEffect(() => {
    if (ledger || !quantModel.ready) return;
    const cashFrac = selectedTickers.length > 0 ? CASH_FRACTION[risk] : 1;
    const perName = selectedTickers.length > 0 ? (TOTAL_AUM * (1 - cashFrac)) / selectedTickers.length : 0;
    const holdings: LedgerHolding[] = selectedTickers.map((t) => {
      const pn = priceNokFor(t);
      const qty = pn && pn > 0 ? Math.max(1, Math.round(perName / pn)) : 0;
      const costNok = qty > 0 && pn != null ? qty * pn : perName;
      return { ticker: t, qty, theme: THEME_OF[t] || 'Other', costNok };
    });
    const investedNok = holdings.reduce((s, h) => s + h.costNok, 0);
    const cashNok = Math.max(0, TOTAL_AUM - investedNok);
    const actions: RebalanceAction[] = holdings.map((h) => {
      const sig = quantModel.signals.find((s) => s.ticker === h.ticker);
      return { text: `Bought ${h.ticker}`, detail: sig?.reason || 'Selected by the factor model', dir: 1 };
    });
    const transactions: LedgerTransaction[] = holdings.filter((h) => h.qty > 0).map((h) => {
      const isOslo = STOCK_YAHOO[h.ticker]?.endsWith('.OL') ?? false;
      return {
        date: todayLabel(), side: 'BUY', ticker: h.ticker, qty: h.qty,
        price: nativePriceFor(h.ticker) ?? h.costNok / h.qty, priceCcy: isOslo ? 'NOK' : 'USD',
        account: isOslo ? 'Aksjesparekonto' : 'Investeringskonto',
      };
    });
    setLedger({
      version: LEDGER_VERSION,
      inceptionDate: todayLabel(),
      holdings,
      cashNok,
      log: [{
        date: todayLabel(),
        changes: holdings.length ? `Initial allocation: ${holdings.map((h) => h.ticker).join(', ')}` : 'Initial allocation — cash only',
        reasoning: 'First allocation, built from today’s live momentum/trend/low-volatility/value/quality factor scores.',
        actions,
      }],
      navHistory: [{ date: todayISO, totalValue: TOTAL_AUM, bench: live['OSEBX.OL']?.price ?? null }],
      transactions,
    });
    // Intentionally snapshots the first-ready render's selection/prices exactly once (guarded by
    // `if (ledger || !quantModel.ready) return`); it must not re-run as live prices tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledger, quantModel.ready]);

  const POSITIONS: Position[] = (ledger?.holdings ?? []).map((h) => ({
    ticker: h.ticker, qty: h.qty, theme: h.theme, fallbackNok: h.costNok, costNok: h.costNok,
  }));
  const CASH_NOK = ledger?.cashNok ?? 0;
  const THEME_COLORS: Record<string, string> = {
    Energy: '#3DBB84',
    Defence: '#7C5CFF',
    'Global funds': '#2F6E90',
    Materials: '#C79A3D',
    Tech: '#4E9E8A',
    Seafood: '#B85C54',
    Financials: '#5B8DBE',
    Telecom: '#9A7FD1',
    Industrials: '#C77D3D',
    Shipping: '#3D8AC7',
    Consumer: '#8AAE4E',
    Cash: '#3A414B',
  };
  const CCY: Record<string, 'NOK' | 'USD' | 'Mixed'> = {
    EQNR: 'NOK', KOG: 'NOK', AKRBP: 'NOK', NHY: 'NOK', YAR: 'NOK', MOWI: 'NOK', DNB: 'NOK', TEL: 'NOK', SALM: 'NOK',
    TOM: 'NOK', FRO: 'NOK', ORK: 'NOK', STB: 'NOK',
    LMT: 'USD', XOM: 'USD', NVDA: 'USD', GLOBAL: 'Mixed',
  };
  const port = computePortfolio(live, POSITIONS, CASH_NOK);

  // Featured report card follows the AI portfolio's largest holding (falls back to DNB before any
  // holding is priced), so it reflects the actual book rather than a fixed name.
  const reportTicker = [...port.rows].sort((a, b) => b.valueNok - a.valueNok)[0]?.ticker || 'DNB';
  const reportYahoo = STOCK_YAHOO[reportTicker] || 'DNB.OL';
  const rcFund = useFundamentals(reportYahoo);

  // Once-a-day: accrue interest on idle cash at the live Norges Bank policy rate and take a
  // real NAV snapshot (rather than a fabricated equity curve) so a genuine, if sparse,
  // performance history builds up across the days the app is actually opened.
  useEffect(() => {
    if (!ledger) return;
    const last = ledger.navHistory[ledger.navHistory.length - 1];
    if (last && last.date === todayISO) return;
    // Price the holdings inline from `live` (so `live` is an honest dependency). Wait until every
    // held name has a live quote before snapshotting, otherwise the recorded NAV would fall back
    // to cost basis and ignore the day's real market move.
    const usdnok = live['USDNOK=X']?.price ?? null; // no fabricated FX; wait for the real rate
    const priced = ledger.holdings.map((h) => {
      const q = live[STOCK_YAHOO[h.ticker]];
      if (!q) return null;
      if (q.currency === 'USD') return usdnok != null ? q.price * usdnok : null;
      return q.price;
    });
    if (ledger.holdings.length > 0 && priced.some((p) => p == null)) return;
    const daysElapsed = last ? Math.max(1, Math.round((new Date(todayISO).getTime() - new Date(last.date).getTime()) / 86400000)) : 0;
    const rate = (macro.policyRate ?? 4.25) / 100;
    const accruedCash = daysElapsed > 0 ? ledger.cashNok * Math.pow(1 + rate / 365, daysElapsed) : ledger.cashNok;
    const holdingsValueNow = ledger.holdings.reduce((s, h, i) => s + (h.qty > 0 && priced[i] != null ? h.qty * priced[i]! : h.costNok), 0);
    setLedger({ ...ledger, cashNok: accruedCash, navHistory: [...ledger.navHistory, { date: todayISO, totalValue: holdingsValueNow + accruedCash, bench: live['OSEBX.OL']?.price ?? null }] });
  }, [ledger, todayISO, live, macro.policyRate]);

  // Rebalance only trades names entering or leaving the model's current selection — it doesn't
  // force existing holdings back to exact equal-weight, so cost basis for unchanged positions
  // (and therefore their real gain/loss) stays intact rather than being reset on every click.
  const runRebalance = () => {
    if (!ledger || !quantModel.ready) return;
    const targetTickers = rankByLiveScore(qmOpts.topN ?? 5, qmOpts.scoreThreshold ?? 0);
    const targetSet = new Set(targetTickers);
    const prevMap = new Map(ledger.holdings.map((h) => [h.ticker, h] as const));
    const kept = ledger.holdings.filter((h) => targetSet.has(h.ticker));
    const sold = ledger.holdings.filter((h) => !targetSet.has(h.ticker));
    const newTickers = targetTickers.filter((t) => !prevMap.has(t));

    if (sold.length === 0 && newTickers.length === 0) {
      window.alert('No changes — current holdings already match the model.');
      return;
    }

    let cash = ledger.cashNok;
    const actions: RebalanceAction[] = [];
    const newTransactions: LedgerTransaction[] = [];
    for (const h of sold) {
      const pn = priceNokFor(h.ticker);
      const proceeds = pn != null ? h.qty * pn : h.costNok;
      cash += proceeds;
      actions.push({ text: `Sold ${h.ticker}`, detail: `${fmtNum(proceeds, 0)} NOK`, dir: -1 });
      const isOslo = STOCK_YAHOO[h.ticker]?.endsWith('.OL') ?? false;
      newTransactions.push({
        date: todayLabel(), side: 'SELL', ticker: h.ticker, qty: h.qty,
        price: nativePriceFor(h.ticker) ?? h.costNok / h.qty, priceCcy: isOslo ? 'NOK' : 'USD',
        account: isOslo ? 'Aksjesparekonto' : 'Investeringskonto',
      });
    }

    const keptValue = kept.reduce((s, h) => {
      const pn = priceNokFor(h.ticker);
      return s + (pn != null ? h.qty * pn : h.costNok);
    }, 0);
    const currentTotal = keptValue + cash;
    const cashFrac = targetTickers.length > 0 ? CASH_FRACTION[risk] : 1;
    const investedTarget = Math.max(0, currentTotal * (1 - cashFrac));
    const perName = targetTickers.length > 0 ? investedTarget / targetTickers.length : 0;

    const newHoldings: LedgerHolding[] = newTickers.map((t) => {
      const pn = priceNokFor(t);
      const qty = pn && pn > 0 ? Math.max(1, Math.round(perName / pn)) : 0;
      const costNok = qty > 0 && pn != null ? qty * pn : perName;
      cash -= costNok;
      const sig = quantModel.signals.find((s) => s.ticker === t);
      actions.push({ text: `Bought ${t}`, detail: sig?.reason || 'Selected by the factor model', dir: 1 });
      if (qty > 0) {
        const isOslo = STOCK_YAHOO[t]?.endsWith('.OL') ?? false;
        newTransactions.push({
          date: todayLabel(), side: 'BUY', ticker: t, qty,
          price: nativePriceFor(t) ?? costNok / qty, priceCcy: isOslo ? 'NOK' : 'USD',
          account: isOslo ? 'Aksjesparekonto' : 'Investeringskonto',
        });
      }
      return { ticker: t, qty, theme: THEME_OF[t] || 'Other', costNok };
    });

    const changesLabel = [...newTickers.map((t) => `+${t}`), ...sold.map((h) => `−${h.ticker}`)].join(' ');
    setLedger({
      ...ledger,
      holdings: [...kept, ...newHoldings],
      cashNok: Math.max(0, cash),
      transactions: [...ledger.transactions, ...newTransactions],
      log: [
        {
          date: todayLabel(),
          changes: changesLabel,
          reasoning: `Rebalanced to the model's current top ${targetTickers.length || (qmOpts.topN ?? 5)} name(s) for the ${risk} risk level.`,
          actions,
        },
        ...ledger.log,
      ],
    });
  };

  // Wipes the persisted ledger so the next render re-seeds a fresh book from today's
  // model selection (new inception date, cost basis = today, empty history). Lets a user
  // start over — e.g. after the tracked universe changes or they want a clean slate.
  const resetPortfolio = () => {
    if (!window.confirm('Reset the AI portfolio? This clears its saved holdings, cost basis and history, then rebuilds from today’s model selection. This cannot be undone.')) return;
    localStorage.removeItem('nordlys_portfolio_ledger');
    setLedger(null);
  };

  // How far the held book has drifted from the model's current pick, so the manual "Rebalance
  // now" button can say whether it's actually worth clicking (buys pending + sells pending).
  const pendingRebalance = (() => {
    if (!ledger || !quantModel.ready) return 0;
    const target = new Set(rankByLiveScore(qmOpts.topN ?? 5, qmOpts.scoreThreshold ?? 0));
    const held = new Set(ledger.holdings.map((h) => h.ticker));
    let n = 0;
    for (const t of target) if (!held.has(t)) n++;
    for (const t of held) if (!target.has(t)) n++;
    return n;
  })();
  const sinceIncStr = (port.sinceInception >= 0 ? '+' : '') + port.sinceInception.toFixed(1) + '%';
  // Weight pairs (fraction of total portfolio value) for the real risk engine.
  const riskPairs = port.rows
    .map((r) => {
      const y = STOCK_YAHOO[r.ticker];
      const w = port.totalValue > 0 ? r.valueNok / port.totalValue : 0;
      return y && w > 0 ? `${y}:${w.toFixed(4)}` : null;
    })
    .filter(Boolean) as string[];
  const riskStats = useRiskStats(riskPairs, macro.policyRate ?? 4.25);
  const backtest = useBacktest(riskPairs, macro.policyRate ?? 4.25);

  // ---- Real conviction engine ------------------------------------------------
  // Per-holding conviction is computed from live analyst consensus (target upside
  // + rating) and 1-year price momentum, then value-weighted into an overall
  // 0–100 risk-appetite score. The chosen stance scales the net signal. Falls
  // back to a neutral read where a name has no free consensus/history data.
  const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
  const stanceCfg: Record<RiskLevel, { k: number; cash: string; stance: string; tilt: string; note: string }> = {
    conservative: { k: 0.62, cash: '15%', stance: 'Cautious', tilt: 'Capital-preservation · larger fund & cash core', note: 'Lower beta: single-stock tilts trimmed, more diversified funds and cash.' },
    balanced: { k: 1.0, cash: '6.5%', stance: 'Risk-on', tilt: 'Risk-on · tilt to energy & defence', note: 'Default stance: acts on high-conviction signals, keeps a modest cash buffer.' },
    aggressive: { k: 1.32, cash: '2%', stance: 'Max risk-on', tilt: 'Max risk-on · concentrated, higher beta', note: 'Higher beta: concentrated energy & defence tilt, minimal cash, faster signal action.' },
  };
  // Signed −1..+1 signal for one holding from whatever live data exists.
  const holdingSignal = (sym: string): { sig: number; parts: number; up: number | null; ret: number | null } => {
    const y = STOCK_YAHOO[sym];
    const s = y ? summary[y] : undefined;
    const px = localPrice(sym);
    const ret = y != null && riskStats.holdingReturns[y] != null ? riskStats.holdingReturns[y] : null;
    let sig = 0, wsum = 0;
    // Analyst target upside (fraction), normalised to ±25%.
    if (s && s.targetMean != null && px) {
      const up = (s.targetMean - px) / px;
      sig += 0.42 * clamp(up / 0.25, -1, 1); wsum += 0.42;
    }
    // Analyst rating: recMean 1 (strong buy) → +1, 3 (hold) → 0, 5 (sell) → −1.
    if (s && s.recMean != null) {
      sig += 0.33 * clamp((3 - s.recMean) / 2, -1, 1); wsum += 0.33;
    }
    // 1-year price momentum, normalised to ±40%.
    if (ret != null) {
      sig += 0.25 * clamp(ret / 40, -1, 1); wsum += 0.25;
    }
    const up = s && s.targetMean != null && px ? (s.targetMean - px) / px * 100 : null;
    return { sig: wsum > 0 ? sig / wsum : 0, parts: wsum, up, ret };
  };
  // Per-holding conviction score/label, value-weighted net signal.
  const convHold: Record<string, { score: number; label: string; up: number | null; ret: number | null }> = {};
  let netW = 0, netAcc = 0;
  let sumUp = 0, nUp = 0, sumRet = 0, nRet = 0, buyCnt = 0, ratedCnt = 0;
  for (const p of POSITIONS) {
    const { sig, parts, up, ret } = holdingSignal(p.ticker);
    const score = clamp(Math.round(50 + sig * 46), 3, 99);
    const label = score >= 66 ? 'High' : score >= 46 ? 'Medium' : 'Trim';
    convHold[p.ticker] = { score, label, up, ret };
    const w = port.totalValue > 0 ? port.valueOf(p.ticker) / port.totalValue : 0;
    if (parts > 0) { netW += w; netAcc += w * sig; }
    if (up != null) { sumUp += up; nUp++; }
    if (ret != null) { sumRet += ret; nRet++; }
    const y = STOCK_YAHOO[p.ticker];
    const s = y ? summary[y] : undefined;
    if (s && s.recMean != null) { ratedCnt++; if (s.recMean < 2.5) buyCnt++; }
  }
  const netSignal = netW > 0 ? netAcc / netW : 0; // −1..+1
  const convDataReady = netW > 0.4 && ratedCnt >= 3;
  const avgUpside = nUp ? sumUp / nUp : 0;
  const avgRet = nRet ? sumRet / nRet : 0;
  const benchRet = riskStats.benchReturn ?? 0;

  // Explanatory factor bars, computed from the same live aggregates.
  const realFactors = convDataReady
    ? [
        { label: 'Analyst upside', why: `Avg target ${avgUpside >= 0 ? '+' : ''}${avgUpside.toFixed(0)}% across held names`, val: Math.round(clamp(avgUpside / 20, -1, 1) * 24) },
        { label: 'Price momentum', why: `Book ${avgRet >= 0 ? '+' : ''}${avgRet.toFixed(0)}% vs OSEBX ${benchRet >= 0 ? '+' : ''}${benchRet.toFixed(0)}% (1y)`, val: Math.round(clamp((avgRet - benchRet) / 25, -1, 1) * 18) },
        { label: 'Analyst breadth', why: `${buyCnt}/${ratedCnt} held names rated buy or better`, val: Math.round((ratedCnt ? buyCnt / ratedCnt - 0.4 : 0) * 22) },
        { label: 'Rates & macro', why: macro.policyRate != null ? `Norges Bank policy rate ${macro.policyRate.toFixed(2)}%${macro.cpi != null ? ` · CPI ${macro.cpi.toFixed(1)}%` : ''}` : 'Norges Bank policy backdrop', val: macro.cpi != null && macro.policyRate != null ? Math.round(clamp((macro.policyRate - macro.cpi) / 3, -1, 1) * 12) : 8 },
        { label: 'Volatility & drawdown', why: riskStats.annVol != null ? `Realised vol ${riskStats.annVol.toFixed(0)}% annualised` : 'Realised volatility', val: riskStats.annVol != null ? -Math.round(clamp((riskStats.annVol - 18) / 12, 0, 1) * 12) : -7 },
        { label: 'Concentration', why: `Top holding ${port.rows.length ? (Math.max(...port.rows.map((r) => port.totalValue > 0 ? r.valueNok / port.totalValue * 100 : 0))).toFixed(0) : '—'}% of book`, val: -Math.round(clamp((Math.max(0, ...port.rows.map((r) => port.totalValue > 0 ? r.valueNok / port.totalValue : 0)) - 0.12) / 0.1, 0, 1) * 8) },
      ]
    : [
        { label: 'Geopolitical risk premium', why: 'Mideast shipping risk + NATO rearmament lift energy & defence', val: 22 },
        { label: 'Earnings momentum', why: 'Q2 beats trend positive across held names', val: 12 },
        { label: 'Rates & macro', why: 'Norges Bank signals autumn cut — supportive', val: 14 },
        { label: 'Market breadth', why: 'Broad participation in the OSEBX advance', val: 9 },
        { label: 'Trade & tariffs', why: 'US metals-tariff threat is an unresolved overhang', val: -8 },
        { label: 'Volatility & drawdown', why: 'Realised vol elevated vs 3-month average', val: -7 },
      ];
  const stC = stanceCfg[risk] || stanceCfg.balanced;
  const rawNet = convDataReady ? Math.round(netSignal * 58) : realFactors.reduce((s, f) => s + f.val, 0);
  const convNetNum = Math.round(rawNet * stC.k);
  const convScoreNum = clamp(30 + convNetNum, 5, 98);

  const watchlist = order.map((sym) => ({
    ticker: sym,
    name: S[sym].name,
    last: S[sym].last,
    chg: chgEl(S[sym].chg),
    open: open(sym),
  }));

  // No free live source exposes real bid/ask (Yahoo's unauthenticated chart endpoint doesn't
  // return it), so these show '—' rather than a fabricated number next to the live Last price.
  const watchFull = order.map((sym) => ({
    ticker: sym, name: S[sym].name, last: S[sym].last,
    chg: chgEl(S[sym].chg, 13),
    bid: '—', ask: '—', vol: S[sym].vol, range: S[sym].range,
    sparkEl: realSpark(sparkSeries[STOCK_YAHOO[sym] || sym] || []),
    open: open(sym),
  }));

  const cur = S[stock as string] || S.EQNR;


  const convFactors = realFactors.map((f) => ({ ...f, barEl: factorBar(f.val), valEl: factorVal(f.val) }));

  const isOsloListed = (t: string) => STOCK_YAHOO[t]?.endsWith('.OL') ?? false;
  const EXCHANGE_OF: Record<string, string> = { NVDA: 'NASDAQ', LMT: 'NYSE', XOM: 'NYSE' };
  // Renders the model's per-name factor z-scores as small labelled chips, so a holding's
  // selection is auditable at a glance rather than being a black box. "—" where a factor
  // couldn't be computed (e.g. no P/B from Yahoo). Higher = more favourable for every factor.
  const zColor = (v: number | null) => (v == null ? '#5B626C' : v > 0.15 ? '#3DBB84' : v < -0.15 ? '#E4655E' : '#8A929E');
  const zStr = (v: number | null) => (v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(1));
  const factorChips = (fz: FactorZ) => {
    const items: { k: string; v: number | null }[] = [
      { k: 'Mom', v: fz.momentum }, { k: 'Trend', v: fz.trend }, { k: 'Low-vol', v: fz.lowVol }, { k: 'Val/Qual', v: fz.valueQuality },
    ];
    return (
      <div style={css("display:flex; flex-wrap:wrap; gap:5px; margin-top:5px;")}>
        {items.map((it) => (
          <span key={it.k} className="mono" style={css(`display:inline-flex; gap:4px; align-items:center; font-size:9.5px; padding:1.5px 6px; border-radius:4px; background:#14181D; border:1px solid #23272E; color:#7C8492;`)}>
            {it.k}<span style={css(`color:${zColor(it.v)}; font-weight:600;`)}>{zStr(it.v)}</span>
          </span>
        ))}
      </div>
    );
  };
  const EMPTY_FZ = { momentum: null, trend: null, lowVol: null, valueQuality: null };
  const aiHoldings = POSITIONS.map((p) => {
    const sig = quantModel.signals.find((s) => s.ticker === p.ticker);
    return {
      ticker: p.ticker,
      name: base[p.ticker]?.name || p.ticker,
      type: `Share · ${EXCHANGE_OF[p.ticker] || 'Oslo Børs'} · ${p.theme}`,
      driver: sig?.reason || 'Selected by the momentum/trend/low-volatility factor model.',
      factorZ: sig?.factorZ ?? EMPTY_FZ,
      conv: '—', // no fabricated conviction until the real engine has data
      ask: isOsloListed(p.ticker),
    };
  }).map((h) => {
    const ch = convHold[h.ticker];
    const conv = convDataReady && ch ? ch.label : h.conv;
    // Data-driven driver line where consensus/momentum exists, else the factor-model reason above.
    let driver = h.driver;
    if (convDataReady && ch && (ch.up != null || ch.ret != null)) {
      if (ch.up != null && Math.abs(ch.up) >= 3) driver = `Analyst target ${ch.up >= 0 ? '+' : ''}${ch.up.toFixed(0)}%`;
      else if (ch.ret != null) driver = `1y ${ch.ret >= 0 ? '+' : ''}${ch.ret.toFixed(0)}% vs OSEBX`;
    }
    return {
      ...h,
      conv,
      driver,
      alloc: port.allocOf(h.ticker).toFixed(1) + '%',
      value: fmtNum(port.valueOf(h.ticker), 0),
      chgEl: chgEl(liveChg(h.ticker, 0), 12.5),
      convEl: convBadge(conv),
      askEl: askTag(h.ask),
      open: S[h.ticker] ? open(h.ticker) : undefined,
    };
  });

  // Signal feed derived from real newswire headlines (E24 + Oslo Børs). Each item
  // is classified by keyword sentiment and mapped to affected held names.
  const HOLD_NAMES: Record<string, string[]> = {
    EQNR: ['equinor'], KOG: ['kongsberg'], AKRBP: ['aker bp'], NHY: ['hydro'], YAR: ['yara'],
    MOWI: ['mowi'], DNB: ['dnb'], TEL: ['telenor'], NVDA: ['nvidia'], LMT: ['lockheed'], XOM: ['exxon'], SALM: ['salmar'],
  };
  const BULL = /(raise|raises|beat|beats|wins?|win |contract|record|higher|upgrade|surge|jump|approv|expand|growth|strong)/i;
  const BEAR = /(cut|cuts|fall|falls|slip|drop|tariff|probe|warn|lower|downgrade|loss|weak|delay|miss|strike|halt)/i;
  const classify = (t: string) => (BULL.test(t) ? 'Bullish' : BEAR.test(t) ? 'Bearish' : 'Watch');
  const newsSignals = (marketNews || [])
    .map((n) => {
      const lc = n.title.toLowerCase();
      const hits: string[] = [];
      for (const t of Object.keys(HOLD_NAMES)) {
        if ((n.ticker && n.ticker.toUpperCase() === t) || HOLD_NAMES[t].some((nm) => lc.includes(nm))) hits.push(t);
      }
      return {
        cat: n.ticker ? 'Company' : 'Market',
        source: n.source,
        sent: classify(n.title),
        text: n.title,
        tickers: hits.length ? hits.join(' · ') : (n.ticker || '—'),
        time: n.time ? fmtTime(n.time) : '',
        rel: hits.length,
      };
    })
    .sort((a, b) => b.rel - a.rel)
    .slice(0, 6);
  // Real newswire headlines only — no fabricated fallback. Empty until the live feed responds.
  const aiSignals = newsSignals.map((sg) => ({ ...sg, sentEl: sentBadge(sg.sent) }));

  // The portfolio's only action so far is today's initial buy into each model-selected name —
  // no fabricated intraday trade history, consistent with the empty rebalance history above.
  const aiActions = POSITIONS.map((p) => {
    const sig = quantModel.signals.find((s) => s.ticker === p.ticker);
    return {
      dir: 1 as const,
      text: `Initial buy ${p.ticker} · ${port.allocOf(p.ticker).toFixed(1)}%`,
      time: todayLabel(),
      basis: 'Factor model',
      conf: 'High',
      impact: `${port.allocOf(p.ticker).toFixed(1)}% NAV`,
      why: sig?.reason || 'Selected by the momentum/trend/low-volatility factor model.',
    };
  }).map((a) => ({ ...a, dotEl: dot(a.dir) }));

  // Next-actions table is the same model output that picked the current holdings above:
  // BUY names not yet held would be added at the next rebalance, SELL names currently held
  // would be dropped. No separate fabricated recommendation list.
  const heldSet = new Set(POSITIONS.map((p) => p.ticker));
  const aiRecos = quantModel.signals
    .filter((s) => s.act !== 'HOLD' && (s.act === 'BUY' ? !heldSet.has(s.ticker) : heldSet.has(s.ticker)))
    .map((s) => {
      const prefix = isOsloListed(s.ticker) ? '' : '$';
      const y = STOCK_YAHOO[s.ticker];
      const q = y ? live[y] : undefined;
      const now = q ? q.price : null;
      const nowStr = now != null ? prefix + (now >= 500 ? fmtNum(now, 0) : fmtNum(now, 1)) : '—';
      const targetLabel = s.target != null ? prefix + (s.target >= 500 ? fmtNum(s.target, 0) : fmtNum(s.target, 1)) : '—';
      return {
        ticker: s.ticker,
        name: s.name,
        act: s.act,
        nowTarget: `${nowStr} → ${targetLabel}`,
        actEl: actBadge(s.act),
        upsideEl: upside(s.upsidePct),
        askEl: askTag(isOsloListed(s.ticker)),
        reason: s.reason,
        open: S[s.ticker] ? open(s.ticker) : undefined,
      };
    });

  // Real transaction history from the persisted ledger (newest first) — not a re-derived
  // snapshot of current holdings, so it stays correct across multiple real rebalances.
  const portfolioLog = (ledger?.transactions ?? []).slice().reverse().map((t) => ({
    date: t.date, side: t.side, ticker: t.ticker, name: base[t.ticker]?.name || t.ticker,
    qty: `${t.side === 'BUY' ? '+' : '−'}${t.qty}`,
    price: (t.priceCcy === 'USD' ? '$' : '') + fmtNum(t.price, 2),
    account: t.account,
  })).map((t) => ({ ...t, sideEl: side(t.side) }));

  const exportPortfolioCsv = () => {
    const header = ['Date', 'Side', 'Ticker', 'Name', 'Qty', 'Price', 'Currency', 'Account'];
    const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const rows = (ledger?.transactions ?? []).map((t) => [
      t.date, t.side, t.ticker, base[t.ticker]?.name || t.ticker,
      String(t.qty), t.price.toFixed(2), t.priceCcy, t.account,
    ]);
    const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nordlys-portfolio-log-${todayISO}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Conviction display values come from the real engine above; the stance
  // supplies the cash target, label and narrative note.
  const rc = {
    score: `${convScoreNum} / 100`,
    net: `${convNetNum >= 0 ? '+' : ''}${convNetNum}`,
    stance: stC.stance, cash: stC.cash, tilt: stC.tilt, note: stC.note,
  };
  const segBase = 'padding:5px 13px; border-radius:6px; font-size:12px; cursor:pointer; color:#8A929E;';
  const segOn = 'padding:5px 13px; border-radius:6px; font-size:12px; cursor:pointer; color:#fff; background:linear-gradient(135deg,#7C5CFF,#4B33C7);';

  // ---- Attribution (real, from the history engine; 1y trailing) ----
  const attrLive = riskStats.portReturn != null && Object.keys(riskStats.holdingReturns).length > 0;
  const attrTotal = attrLive ? (riskStats.portReturn as number) : 0;
  const attrBench = attrLive ? (riskStats.benchReturn as number) : 0;
  const attrActive = attrTotal - attrBench;
  // Per-holding contribution = weight × holding return (percentage points).
  const contribRaw = POSITIONS.map((p) => {
    const y = STOCK_YAHOO[p.ticker];
    const ret = y ? riskStats.holdingReturns[y] : undefined;
    const w = port.totalValue > 0 ? port.valueOf(p.ticker) / port.totalValue : 0;
    return ret != null ? { ticker: p.ticker, theme: p.theme, v: (w * ret) } : null;
  }).filter(Boolean) as { ticker: string; theme: string; v: number }[];

  const contribBase = attrLive && contribRaw.length ? [...contribRaw].sort((a, b) => b.v - a.v) : [];
  const contribMax = Math.max(3, ...contribBase.map((h) => Math.abs(h.v)));
  const contribHoldings = contribBase.map((h) => ({ ...h, barEl: contribBar(h.v, contribMax), valEl: ppVal(h.v), open: S[h.ticker] ? open(h.ticker) : undefined }));
  const topContrib = contribHoldings[0];
  const ppStr = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  const attrTotalStr = attrLive ? ppStr(attrTotal) : '—';
  const attrBenchStr = attrLive ? ppStr(attrBench) : '—';
  const attrActiveStr = attrLive ? ppStr(attrActive) : '—';
  const topContribStr = topContrib ? (topContrib.v >= 0 ? '+' : '') + topContrib.v.toFixed(1) + ' pp' : '—';

  const themeMap = new Map<string, number>();
  (attrLive ? contribRaw : []).forEach((c) => themeMap.set(c.theme, (themeMap.get(c.theme) || 0) + c.v));
  const contribThemes = [...themeMap.entries()]
    .map(([label, v]) => ({ label, v }))
    .sort((a, b) => b.v - a.v)
    .map((t) => ({ ...t, barEl: contribBar(t.v, 4.5), valEl: ppVal(t.v) }));

  // Real book-vs-benchmark decomposition (1y trailing). A full Brinson allocation/selection split
  // needs benchmark sector weights, which the free Yahoo data doesn't expose — so instead of the
  // previous fabricated 5-effect split (fixed numbers rescaled to the active return) we show the
  // genuinely computed pieces: portfolio return, OSEBX return, and their difference.
  const attrDecomp = [
    { label: 'Book (portfolio)', val: attrTotalStr, color: '#F2F4F7' },
    { label: 'OSEBX benchmark', val: attrBenchStr, color: '#9AA1AC' },
  ];

  const fxHoldings = [...port.rows]
    .sort((a, b) => b.valueNok - a.valueNok)
    .map((r) => {
      const ccy = CCY[r.ticker] || 'NOK';
      const weight = port.totalValue > 0 ? (r.valueNok / port.totalValue) * 100 : 0;
      const risk = ccy === 'USD' ? 'High' : ccy === 'Mixed' ? 'Medium' : 'None';
      return {
        ticker: r.ticker,
        name: S[r.ticker]?.name || r.ticker,
        ccy,
        weight: weight.toFixed(0) + '%',
        value: fmtNum(r.valueNok, 0),
        risk,
        ccyEl: ccyPill(ccy),
        riskEl: fxRisk(risk),
        open: S[r.ticker] ? open(r.ticker) : undefined,
      };
    });

  const rbBase = 'flex:0 0 auto; border:1px solid #23272E; border-radius:8px; padding:8px 11px; cursor:pointer;';
  const rbActive = 'flex:0 0 auto; border:1px solid #7C5CFF; background:#181233; border-radius:8px; padding:8px 11px; cursor:pointer;';
  // Real rebalance log from the persisted ledger — one entry for the initial allocation, plus
  // one per "Rebalance now" click since. Newest first; the oldest entry is always inception.
  const rebalLog = ledger?.log ?? [];
  const rebalEvents = rebalLog.map((rb, i) => ({
    date: rb.date, changes: rb.changes, deltaEl: deltaBadge(null),
    cardStyle: rbEvent === i ? rbActive : rbBase,
    select: () => setRbEvent((prev) => (prev === i ? null : i)),
  }));
  const rbSelRaw = rbEvent != null ? rebalLog[rbEvent] : null;
  const isInceptionEntry = rbSelRaw != null && rbSelRaw === rebalLog[rebalLog.length - 1];
  const rbSel = rbSelRaw
    ? {
        date: rbSelRaw.date,
        trigType: isInceptionEntry ? 'Inception' : 'Manual rebalance',
        condition: isInceptionEntry ? 'Model cold-start from today’s live factor scores' : 'Triggered manually via “Rebalance now”',
        reasoning: rbSelRaw.reasoning,
        deltaEl: deltaBadge(null),
        actions: rbSelRaw.actions.map((a) => ({ text: a.text, detail: a.detail, dotEl: dot(a.dir) })),
      }
    : { date: '', trigType: '', condition: '', reasoning: '', deltaEl: deltaBadge(null), actions: [] as { text: string; detail: string; dotEl: React.ReactNode }[] };
  // Real, if sparse, equity curve from daily NAV snapshots (recorded once per calendar day the
  // app is opened) — not a fabricated multi-month chart. OSEBX is drawn as a second line,
  // rebased to the portfolio's starting value, so "beating the index" becomes literally readable.
  const NAV_W = 720, NAV_H = 200, NAV_PT = 15, NAV_PB = 10;
  const navChart = (() => {
    const hist = ledger?.navHistory ?? [];
    if (hist.length < 2) return null;
    const navVals = hist.map((n) => n.totalValue);
    // Benchmark rebasing + relative-return math live in ledger.ts as a pure, unit-tested function
    // (rebaseBenchmark); this block only turns the numbers into SVG geometry.
    const { benchRebased, relPct } = rebaseBenchmark(hist);
    const benchPts = benchRebased.filter((v): v is number => v != null);
    const min = Math.min(...navVals, ...benchPts);
    const max = Math.max(...navVals, ...benchPts);
    const span = max - min || 1;
    const innerH = NAV_H - NAV_PT - NAV_PB;
    const xy = (i: number, v: number) => [(i / (hist.length - 1)) * NAV_W, NAV_PT + (1 - (v - min) / span) * innerH] as const;
    const navCoords = navVals.map((v, i) => xy(i, v));
    const navLine = navCoords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const navArea = `M${navCoords[0][0].toFixed(1)},${navCoords[0][1].toFixed(1)} ` +
      navCoords.slice(1).map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ') +
      ` L${NAV_W},${NAV_H} L0,${NAV_H} Z`;
    const benchLine = benchRebased
      .map((v, i) => (v == null ? null : xy(i, v)))
      .filter((c): c is readonly [number, number] => c != null)
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const up = navVals[navVals.length - 1] >= navVals[0];
    const benchVal = benchPts.length >= 2 ? benchLine : null;
    const relStr = relPct == null ? null : `${relPct >= 0 ? '+' : ''}${relPct.toFixed(1)}% vs OSEBX`;
    return { navLine, navArea, benchLine: benchVal, up, relStr };
  })();

  // Live sector exposure (from the portfolio's theme allocation, ex-cash).
  const sectorExp = port.themeAlloc
    .filter((t) => t.label !== 'Cash')
    .map((e) => {
      const color = THEME_COLORS[e.label] || '#6FA8FF';
      return { label: e.label, val: e.pct.toFixed(0) + '%', pct: e.pct, color, barEl: hbar(e.pct, color) };
    });

  // Live concentration — top holdings by value.
  const concSorted = [...port.rows].sort((a, b) => b.valueNok - a.valueNok);
  const concExp = concSorted.slice(0, 6).map((r) => {
    const pct = port.totalValue > 0 ? (r.valueNok / port.totalValue) * 100 : 0;
    const bar = Math.min(pct * 5, 100);
    return { label: r.ticker, val: pct.toFixed(0) + '%', pct: bar, barEl: hbar(bar, '#6FA8FF') };
  });
  const top5Pct = concSorted.slice(0, 5).reduce((s, r) => s + (port.totalValue > 0 ? (r.valueNok / port.totalValue) * 100 : 0), 0);

  // ---- Derived live values ----
  const indexTiles = INDEX_TILES.map((t) => {
    const q = live[t.symbol];
    const dec = t.kind === 'fx' ? 3 : 2;
    const prefix = t.kind === 'usd' ? '$' : '';
    return { label: t.label, value: q ? prefix + fmtNum(q.price, dec) : null, chgPct: q ? q.changePct : null };
  });

  const osebx = live['OSEBX.OL'];

  // Only names with a live quote can be ranked — no fabricated change values padding the list.
  const ranked = rankByChange(order.map((sym) => ({ sym, chg: liveChg(sym, NaN) })));
  const gainers = ranked.slice(0, 4);
  const losers = ranked.slice(-4).reverse();

  const fxRates = FX_RATES.map((t) => {
    const q = live[t.symbol];
    return { label: t.label, value: q ? fmtFx(q.price) : null, chgPct: q ? q.changePct : null };
  });

  const idxPath = buildChartPath(idxCloses, 700, 210, 20, 30);
  const detailPath = buildChartPath(detailCloses, 660, 240, 20, 20);

  // Real newswire only — empty until the live feed responds (honest "awaiting" state in the
  // render), never a fabricated headline list.
  const feedItems = marketNews.slice(0, 8).map((n) => ({
    ticker: n.ticker ? n.ticker.replace('.OL', '') : 'MKT',
    source: n.source || 'News',
    time: fmtTime(n.time),
    title: n.title,
    link: n.link,
    image: n.image || '',
  }));

  // Real headlines only — no fabricated fallback list. Empty until the live newswire responds,
  // and the render shows an honest "awaiting feed" state rather than invented stories.
  const sdNews = stockNews.slice(0, 4).map((n) => ({ title: n.title, meta: `${n.source || 'News'} · ${fmtTime(n.time)}`, link: n.link }));

  const mostRead = marketNews.length > 8 ? marketNews.slice(8, 12).map((n) => ({ title: n.title, link: n.link })) : [];

  const todayKey = new Date().toISOString().slice(0, 10);
  const condLabel = (t: { cond: 'above' | 'below' | 'pct'; price: number }) =>
    t.cond === 'above' ? `crossed above ${fmtNum(t.price, 2)}`
    : t.cond === 'below' ? `fell below ${fmtNum(t.price, 2)}`
    : `moved ±${t.price.toFixed(1)}% today`;

  // Sector day-moves derived purely from live constituent quotes. Only sectors with tracked
  // constituents are shown, and a sector whose members have no live quote yet renders "—"
  // (pct=null) instead of a fabricated number — no designed placeholder values.
  const SECTOR_MEMBERS: Record<string, string[]> = {
    Energy: ['EQNR', 'AKRBP'],
    Materials: ['NHY', 'YAR'],
    Financials: ['DNB'],
    Seafood: ['MOWI', 'SALM'],
    Industrials: ['KOG'],
    Telecom: ['TEL'],
  };
  const sectorTiles = Object.entries(SECTOR_MEMBERS).map(([name, members]) => {
    const vals = members.map((t) => liveChg(t, NaN)).filter((v) => !Number.isNaN(v));
    const pct = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    return { name, pct };
  });

  // ---- Analyst consensus (Yahoo), falls back to the designed table ----
  const ratingFromKey = (key: string | null, mean: number | null): string => {
    const k = (key || '').toLowerCase();
    if (k === 'strong_buy' || k === 'buy') return 'Buy';
    if (k.includes('under') || k.includes('sell')) return 'Sell';
    if (k) return 'Hold';
    if (mean != null) return mean <= 2.2 ? 'Buy' : mean >= 3.2 ? 'Sell' : 'Hold';
    return 'Hold';
  };
  const consensus = OSLO_SET.map((t) => ({ t, s: sumOf(t) })).filter((x) => x.s && x.s.targetMean != null);
  const analystRecsLive = consensus.map(({ t, s }) => {
    const now = localPrice(t);
    const up = s!.targetMean != null && now ? ((s!.targetMean - now) / now) * 100 : null;
    const r = ratingFromKey(s!.recKey, s!.recMean);
    return {
      broker: `Consensus · ${s!.numAnalysts ?? '—'} an.`,
      ticker: t,
      name: S[t]?.name || t,
      rating: r,
      target: fmtNum(s!.targetMean as number, 0),
      prev: s!.targetLow != null && s!.targetHigh != null ? `(${fmtNum(s!.targetLow, 0)}–${fmtNum(s!.targetHigh, 0)})` : '',
      date: up != null ? (up >= 0 ? '+' : '') + up.toFixed(1) + '%' : '—',
      ratingEl: rating(r),
      open: S[t] ? open(t) : undefined,
    };
  });
  // Real analyst consensus only (Yahoo) — no fabricated broker table. Empty → honest empty state.
  const analystDisplay = analystRecsLive;
  const buyN = analystDisplay.filter((r) => r.rating === 'Buy').length;
  const holdN = analystDisplay.filter((r) => r.rating === 'Hold').length;
  const sellN = analystDisplay.filter((r) => r.rating === 'Sell').length;

  // ---- Earnings calendar + held-name reports (Yahoo calendarEvents) ----
  // Yahoo's calendarEvents.earnings.earningsDate[0] sometimes only has the *last reported* date
  // (no confirmed next one yet, common for smaller caps) rather than a genuinely upcoming one, so
  // this filters to future dates only rather than showing a stale report as "upcoming".
  const nowSec = Date.now() / 1000;
  // Only real, future earnings dates from Yahoo's calendarEvents — no hardcoded fallback list.
  // Empty until the consensus feed responds, so the panel shows an honest "awaiting" state rather
  // than stale invented dates.
  const earningsRows = OSLO_SET.map((t) => ({ t, e: sumOf(t)?.earningsDate ?? null })).filter((x) => x.e && x.e > nowSec) as { t: string; e: number }[];
  const calendarDisplay = earningsRows
    .sort((a, b) => a.e - b.e)
    .slice(0, 6)
    .map((x) => {
      const dm = fmtDayMon(x.e);
      return {
        day: dm.day,
        mon: dm.mon,
        name: `${S[x.t]?.name || x.t} · Q results`,
        when: new Date(x.e * 1000).toLocaleDateString('en-GB', { weekday: 'long' }),
        ticker: x.t,
        period: 'Q',
      };
    });

  const heldReportSyms = POSITIONS.map((p) => p.ticker);
  const heldReportsLive = heldReportSyms
    .map((t) => ({ t, e: sumOf(t)?.earningsDate ?? null }))
    .filter((x) => x.e && x.e > nowSec)
    .sort((a, b) => (a.e as number) - (b.e as number))
    .slice(0, 4)
    .map((x) => ({ ticker: x.t, period: 'Q results', date: fmtDayMon(x.e).label, open: S[x.t] ? open(x.t) : undefined }));
  const holdingReportsDisplay = heldReportsLive; // real future earnings only; empty → honest "awaiting" state

  // ---- Dividends (Yahoo events) — real amounts + yield vs live price ----
  const divsLive = POSITIONS.map((p) => p.ticker)
    .map((t) => {
      const y = STOCK_YAHOO[t];
      const di = y ? dividends[y] : undefined;
      if (!di || di.latest == null) return null;
      const now = localPrice(t);
      const yld = di.trailing && now ? (di.trailing / now) * 100 : null;
      const pfx = di.currency === 'USD' ? '$' : 'NOK ';
      return { ticker: t, ex: fmtDayMon(di.latestDate).label, amount: pfx + fmtNum(di.latest, 2), yield: yld != null ? yld.toFixed(1) + '%' : '—' };
    })
    .filter(Boolean) as { ticker: string; ex: string; amount: string; yield: string }[];
  // Real dividend history (Yahoo events) only — empty → honest empty state, no invented rows.
  const divsDisplay = divsLive;
  const divsLabel = 'Latest dividends';

  // ---- Insider trades (official Oslo Børs Newsweb) ----
  const insiderDisplay = insiderLive.length
    ? insiderLive.slice(0, 10).map((t) => ({
        date: fmtDayMon(Math.floor(new Date(t.date).getTime() / 1000)).label,
        ticker: t.ticker,
        company: t.company,
        title: t.title,
        side: t.side,
        link: t.link,
        sideEl: t.side ? side(t.side) : React.createElement('span', { className: 'mono', style: { fontSize: 10, color: '#7C8492' } }, '—'),
      }))
    : null;
  const insiderBuys = insiderLive.filter((t) => t.side === 'BUY').length;
  const insiderSells = insiderLive.filter((t) => t.side === 'SELL').length;
  const insiderUnclassified = insiderLive.length - insiderBuys - insiderSells;
  // Newsweb's category-1102 listing gives a title/company/date per disclosure, not a parsed
  // transaction value, and many real titles ("Mandatory Notification of Trade") don't say
  // buy or sell — so a NOK net-flow or largest-transaction figure isn't derivable from this feed.
  const insiderDisclosuresLabel = insiderLive.length
    ? insiderUnclassified > 0
      ? `last 45 days · Newsweb · ${insiderUnclassified} unclassified`
      : 'last 45 days · Newsweb'
    : '3:1 ratio';
  const insiderSentiment = insiderBuys > insiderSells ? 'Bullish' : insiderSells > insiderBuys ? 'Bearish' : 'Mixed';
  const insiderSentimentNote = !insiderLive.length
    ? 'awaiting Newsweb feed'
    : insiderBuys === 0 && insiderSells === 0
      ? 'no disclosures classified buy/sell'
      : `${insiderBuys} buy vs ${insiderSells} sell disclosures`;

  // ---- Portfolio beta (weighted average of holdings' Yahoo betas) ----
  let betaNum = 0;
  let betaW = 0;
  POSITIONS.forEach((p) => {
    const s = sumOf(p.ticker);
    if (s && s.beta != null) {
      const w = port.allocOf(p.ticker) / 100;
      betaNum += w * s.beta;
      betaW += w;
    }
  });
  const portBeta = betaW > 0 ? betaNum / betaW : null;

  // Stress scenarios are now a genuine first-order sensitivity: portfolio impact = beta × index
  // move, using the real beta (history-engine regression beta, or the allocation-weighted average
  // of holdings' Yahoo betas as a live fallback). No fabricated geopolitical pp figures. Impacts
  // show "—" until a beta is available. This is a linear approximation — it deliberately excludes
  // idiosyncratic/sector effects, which the subtitle states.
  const effBeta = riskStats.beta ?? portBeta;
  const betaRanked = POSITIONS
    .map((p) => ({ t: p.ticker, b: sumOf(p.ticker)?.beta ?? null }))
    .filter((x): x is { t: string; b: number } => x.b != null)
    .sort((a, b) => b.b - a.b);
  const topBetaName = betaRanked.length ? betaRanked[0].t : null;
  const mostExposed = topBetaName ? `${topBetaName} (β ${betaRanked[0].b.toFixed(2)})` : '—';
  const scenarios = [
    { name: 'OSEBX −10%', how: 'Broad market drawdown — beta amplifies the index move.', shock: -10 },
    { name: 'OSEBX −5%', how: 'Moderate risk-off across Oslo Børs.', shock: -5 },
    { name: 'OSEBX −2%', how: 'Mild market pullback.', shock: -2 },
    { name: 'OSEBX +5%', how: 'Broad relief rally — beta works in your favour.', shock: 5 },
    { name: 'OSEBX +10%', how: 'Strong risk-on move.', shock: 10 },
  ].map((sc) => {
    const v = effBeta != null ? effBeta * sc.shock : null;
    return {
      ...sc,
      hit: mostExposed,
      impactEl: v == null ? <span className="mono" style={css('color:#8A929E;')}>—</span> : scImpact(v),
    };
  });

  // Real risk metrics from the history engine. While it loads (or if it fails) show '—' rather
  // than fabricated-looking designed numbers. Beta keeps a genuine live fallback: the allocation-
  // weighted average of the holdings' own Yahoo betas (not a made-up constant).
  const rLoaded = riskStats.beta != null || riskStats.annVol != null;
  const rBeta = riskStats.beta != null ? riskStats.beta.toFixed(2) : portBeta != null ? portBeta.toFixed(2) : '—';
  const rVol = riskStats.annVol != null ? riskStats.annVol.toFixed(1) + '%' : '—';
  const rVar = riskStats.var95 != null ? riskStats.var95.toFixed(1) + '%' : '—';
  const rVarNok = riskStats.var95 != null ? '−NOK ' + fmtNum(Math.abs((riskStats.var95 / 100) * port.totalValue), 0) : rLoaded ? '' : 'loading…';
  const rMdd = riskStats.maxDrawdown != null ? riskStats.maxDrawdown.toFixed(1) + '%' : '—';
  const rSharpe = riskStats.sharpe != null ? riskStats.sharpe.toFixed(2) : '—';
  const rVolNote = riskStats.annVol != null ? (riskStats.annVol > 20 ? 'elevated' : riskStats.annVol > 12 ? 'moderate' : 'low') : rLoaded ? '' : 'awaiting 1y history';

  // ---- Currency exposure derived from the live portfolio ----
  const ccyTotals: Record<string, number> = { NOK: port.cashNok, USD: 0, Mixed: 0 };
  port.rows.forEach((r) => {
    const c = CCY[r.ticker] || 'NOK';
    ccyTotals[c] += r.valueNok;
  });
  const totV = port.totalValue || 1;
  const usdPct = (ccyTotals.USD / totV) * 100;
  const mixedPct = (ccyTotals.Mixed / totV) * 100;
  const foreignPct = ((ccyTotals.USD + ccyTotals.Mixed) / totV) * 100;
  const nokPct = (ccyTotals.NOK / totV) * 100;
  const fxCurrencyRows = [
    { label: 'NOK — Norwegian krone', value: ccyTotals.NOK, pct: nokPct, color: '#3DBB84' },
    { label: 'USD — US dollar', value: ccyTotals.USD, pct: usdPct, color: '#2F6E90' },
    { label: 'Global fund (basket)', value: ccyTotals.Mixed, pct: mixedPct, color: '#7C5CFF' },
  ].filter((r) => r.value > 0);
  // Geography & account eligibility for the Risk tab, derived live from the same holdings (was
  // previously hardcoded 60/23/17, which contradicted the real currency split on the FX tab).
  const geoRows = [
    { label: 'Norway · NOK', pct: nokPct, color: '#3DBB84' },
    { label: 'United States · USD', pct: usdPct, color: '#2F6E90' },
    { label: 'Global / diversified', pct: mixedPct, color: '#7C5CFF' },
  ].filter((r) => r.pct > 0.05);
  // US shares can't sit in an aksjesparekonto (ASK); everything else (Oslo shares, funds, cash) can.
  const askPct = ((ccyTotals.NOK + ccyTotals.Mixed) / totV) * 100;
  const outsideAskPct = usdPct;

  // ---- Featured report card (Yahoo fundamentals) ----
  const fmtBn = (v: number | null, cur = 'NOK') => {
    if (v == null) return '—';
    const pfx = cur === 'USD' ? '$' : 'NOK ';
    if (Math.abs(v) >= 1e9) return pfx + (v / 1e9).toFixed(1) + 'bn';
    if (Math.abs(v) >= 1e6) return pfx + (v / 1e6).toFixed(0) + 'm';
    return pfx + fmtNum(v, 0);
  };
  const rcCur = rcFund?.currency || 'NOK';
  const rcRev = rcFund ? fmtBn(rcFund.revenue, rcCur) : '—';
  const rcNI = rcFund ? fmtBn(rcFund.netIncome, rcCur) : '—';
  const rcEps = rcFund && rcFund.eps != null ? rcFund.eps.toFixed(2) : '—';
  const rcRoe = rcFund && rcFund.roe != null ? (rcFund.roe * 100).toFixed(1) + '%' : '—';
  const rcBeat = rcFund ? rcFund.beat : null;
  const revTrend = rcFund?.revenueTrend?.length ? rcFund.revenueTrend.slice(-8) : null;
  const revBars = revTrend
    ? (() => {
        const max = Math.max(...revTrend);
        const n = revTrend.length;
        const slot = 420 / n;
        return revTrend.map((v, i) => {
          const h = Math.max(6, (v / max) * 76);
          return { x: i * slot + 3, y: 90 - h, w: slot - 6, h, fill: i === n - 1 ? '#3DBB84' : i >= n - 2 ? '#2F6E90' : '#22303A' };
        });
      })()
    : null;

  // ---- Backtest (real, from 10y monthly history) ----
  const btOk = backtest.ok && backtest.metrics && backtest.pEquity && backtest.bEquity;
  const bm = backtest.metrics;
  const sgn = (v: number, dec = 1, suf = '%') => (v >= 0 ? '+' : '') + v.toFixed(dec) + suf;
  // Dual equity curve scaled to a shared range within viewBox 900×260.
  let btChart: { p: string; pArea: string; bLine: string } | null = null;
  if (btOk) {
    const pe = backtest.pEquity as number[];
    const be = backtest.bEquity as number[];
    const W = 900, H = 260, padT = 20, padB = 30;
    const min = Math.min(...pe, ...be);
    const max = Math.max(...pe, ...be);
    const span = max - min || 1;
    const xy = (arr: number[]) => arr.map((v, i) => [(i / (arr.length - 1)) * W, padT + (1 - (v - min) / span) * (H - padT - padB)] as const);
    const pc = xy(pe), bc = xy(be);
    const line = (c: readonly (readonly [number, number])[]) => c.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    btChart = {
      p: line(pc),
      pArea: `M${pc[0][0].toFixed(1)},${pc[0][1].toFixed(1)} ` + pc.slice(1).map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ` L${W},${H} L0,${H} Z`,
      bLine: line(bc),
    };
  }
  // Empty (→ loading state) rather than fabricated calendar-year returns until the real backtest lands.
  const btAnnual = btOk && backtest.annual && backtest.annual.length
    ? backtest.annual.map((a) => ({ year: a.year, v: a.p, bench: sgn(a.b), barEl: contribBar(a.p, 35), stratEl: ppVal(a.p) }))
    : [];
  // While the 10y backtest loads (or if it fails), show '—' rather than fabricated-looking
  // designed numbers next to the "Loading…" pill.
  const btm = {
    cagr: btOk ? sgn(bm!.cagr) : '—',
    total: btOk ? sgn(bm!.totalReturn, 0) : '—',
    vol: btOk ? bm!.annVol.toFixed(1) + '%' : '—',
    sharpe: btOk ? bm!.sharpe.toFixed(2) : '—',
    sortino: btOk ? bm!.sortino.toFixed(2) : '—',
    mdd: btOk ? bm!.maxDrawdown.toFixed(1) + '%' : '—',
    alpha: btOk ? sgn(bm!.alpha) : '—',
    beta: btOk ? bm!.beta.toFixed(2) : '—',
    win: btOk ? bm!.winRate.toFixed(0) + '%' : '—',
    best: btOk ? sgn(bm!.bestYear) : '—',
    worst: btOk ? bm!.worstYear.toFixed(1) + '%' : '—',
    turnover: btOk ? bm!.turnover.toFixed(0) + '%' : '—',
  };

  const navMarkets = tab === 'markets' ? active : idle;
  const navWatch = tab === 'watchlist' ? active : idle;
  const navNews = tab === 'news' ? active : idle;
  const navReports = tab === 'reports' ? active : idle;
  const navAlerts = tab === 'alerts' ? active : idle;
  const navAI = tab === 'ai' ? active : idle;
  const navRisk = tab === 'risk' ? active : idle;
  const navFx = tab === 'fx' ? active : idle;
  const navAttr = tab === 'attr' ? active : idle;
  const navIns = tab === 'ins' ? active : idle;
  const navBt = tab === 'bt' ? active : idle;
  const goMarkets = set('markets'), goWatch = set('watchlist'), goNews = set('news'), goReports = set('reports'), goAlerts = set('alerts');
  const goAI = set('ai'), goRisk = set('risk'), goFx = set('fx'), goAttr = set('attr'), goIns = set('ins'), goBt = set('bt');
  const isMarkets = tab === 'markets', isWatch = tab === 'watchlist', isNews = tab === 'news', isReports = tab === 'reports', isAlerts = tab === 'alerts';
  const isAI = tab === 'ai', isRisk = tab === 'risk', isFx = tab === 'fx', isAttr = tab === 'attr', isIns = tab === 'ins', isBt = tab === 'bt';

  const rbOpen = rbEvent != null;
  const convScore = rc.score, convTilt = rc.tilt, convNet = rc.net, convStance = rc.stance, riskNote = rc.note;
  const riskConsStyle = risk === 'conservative' ? segOn : segBase;
  const riskBalStyle = risk === 'balanced' ? segOn : segBase;
  const riskAggStyle = risk === 'aggressive' ? segOn : segBase;
  const setRiskCons = () => setRisk('conservative');
  const setRiskBal = () => setRisk('balanced');
  const setRiskAgg = () => setRisk('aggressive');
  const toggleConv = () => setShowConv((v) => !v);
  const convToggleLabel = showConv ? 'ⓘ Hide' : 'ⓘ Explain';
  const hasStock = !!stock;
  const closeStock = () => setStock(null);
  const sSym = stock || 'EQNR', sName = cur.name, sLast = cur.last, sOpen = cur.open, sRange = cur.range, sVol = cur.vol;
  const sCur = cur.cur || 'NOK', sChgEl = chgEl(cur.chg, 14);
  // Stat tiles come from real data, not the static thesis: analyst consensus target (Yahoo),
  // upside vs the live price, the model's own current signal, and — if the name is actually held —
  // its live allocation and the ledger inception date. Everything falls back to "—" when absent,
  // so nothing here is a fabricated per-stock number.
  const sYh = STOCK_YAHOO[sSym];
  const sSum = sYh ? summary[sYh] : undefined;
  // Real market cap from Yahoo (native currency), formatted; "—" until it loads.
  const sCap = (() => {
    const v = sSum?.marketCap ?? null;
    if (v == null) return '—';
    const pfx = sSum?.marketCapCcy === 'USD' ? '$' : sSum?.marketCapCcy ? sSum.marketCapCcy + ' ' : '';
    if (v >= 1e12) return pfx + (v / 1e12).toFixed(2) + 'T';
    if (v >= 1e9) return pfx + (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return pfx + (v / 1e6).toFixed(0) + 'M';
    return pfx + fmtNum(v, 0);
  })();
  const sLivePrice = sYh ? live[sYh]?.price : undefined;
  const sPfx = isOsloListed(sSym) ? '' : '$';
  const sTarget = sSum?.targetMean != null ? sPfx + fmtNum(sSum.targetMean, sSum.targetMean >= 500 ? 0 : 1) : '—';
  const sUpsidePct = sSum?.targetMean != null && sLivePrice ? ((sSum.targetMean - sLivePrice) / sLivePrice) * 100 : null;
  const sUpsideEl = sUpsidePct == null ? <span className="mono" style={css('font-size:14px; color:#8A929E;')}>—</span> : upside(sUpsidePct);
  const sHeld = POSITIONS.some((p) => p.ticker === sSym);
  const sSize = sHeld ? port.allocOf(sSym).toFixed(1) + '%' : 'Not held';
  const sSince = sHeld && ledger ? ledger.inceptionDate : '—';
  const sSig = quantModel.signals.find((s) => s.ticker === sSym);
  const sModelAct = sSig?.act ?? 'HOLD';
  const sRecoEl = actBadge(sModelAct);
  const sTracked = !!sYh; // a name the factor model covers → show the model-view panel
  const sFactorZ = sSig?.factorZ ?? EMPTY_FZ;
  const sReason = sSig?.reason ?? null;

  const qmReady = quantModel.ready && !!quantModel.backtest;
  const qmAsOf = quantModel.backtest?.weekKeys.at(-1);
  const qmSignals = quantModel.signals.map((s) => ({
    ...s,
    actEl: actBadge(s.act),
    upsideEl: upside(s.upsidePct),
    targetStr: s.target != null ? fmtPrice(s.target) : '—',
  }));
  const qmStatusLabel = quantModel.error ? quantModel.error : qmReady ? `Real weekly prices · week of ${qmAsOf}` : 'Loading…';
  const qmTopN = RISK_OPTIONS[risk].topN;

  return (


<div className="app-root" style={css("height:100vh; display:flex; flex-direction:column; background:#14171B; color:#D5D9E0;")}>

  <a href="#main-content" className="skip-link" style={css("position:absolute; left:8px; top:-40px; z-index:100; background:#2D5BD0; color:#fff; padding:8px 14px; border-radius:0 0 8px 8px; font-size:13px; text-decoration:none;")}>Skip to content</a>
  <h1 className="sr-only">Nordlys Terminal — Norwegian markets &amp; systematic AI portfolio</h1>

  <div className="topbar" style={css("display:flex; align-items:center; gap:20px; padding:0 18px; height:48px; background:#0E1013; border-bottom:1px solid #23272E; flex:0 0 auto;")}>
    <div style={css("display:flex; align-items:center; gap:9px;")}>
      <div style={css("width:16px; height:16px; border-radius:50%; background:radial-gradient(circle at 30% 30%, #6FA8FF, #2D5BD0);")}></div>
      <span style={css("font-weight:600; font-size:14px; letter-spacing:0.02em; color:#F2F4F7;")}>NORDLYS</span>
    </div>
    <nav className="nav" style={css("display:flex; gap:2px;")} aria-label="Primary">
      <span {...clickable(goMarkets)} aria-current={tab === 'markets' ? 'page' : undefined} style={css(navMarkets)}>Markets</span>
      <span {...clickable(goWatch)} aria-current={tab === 'watchlist' ? 'page' : undefined} style={css(navWatch)}>Watchlist</span>
      <span {...clickable(goNews)} aria-current={tab === 'news' ? 'page' : undefined} style={css(navNews)}>News</span>
      <span {...clickable(goReports)} aria-current={tab === 'reports' ? 'page' : undefined} style={css(navReports)}>Reports</span>
      <span {...clickable(goAlerts)} aria-current={tab === 'alerts' ? 'page' : undefined} style={css(navAlerts)}>Alerts</span>
      <span {...clickable(goAI)} aria-current={tab === 'ai' ? 'page' : undefined} style={css(navAI)}>AI Portfolio</span>
      <span {...clickable(goRisk)} aria-current={tab === 'risk' ? 'page' : undefined} style={css(navRisk)}>Risk</span>
      <span {...clickable(goFx)} aria-current={tab === 'fx' ? 'page' : undefined} style={css(navFx)}>Currency</span>
      <span {...clickable(goAttr)} aria-current={tab === 'attr' ? 'page' : undefined} style={css(navAttr)}>Attribution</span>
      <span {...clickable(goIns)} aria-current={tab === 'ins' ? 'page' : undefined} style={css(navIns)}>Insider</span>
      <span {...clickable(goBt)} aria-current={tab === 'bt' ? 'page' : undefined} style={css(navBt)}>Backtest</span>
    </nav>
    <div style={css("flex:1;")}></div>
    <div className="hide-sm" style={css(`display:flex; align-items:center; gap:8px; background:#191D24; border:1px solid ${searchMiss ? '#5C2A2A' : '#23272E'}; border-radius:7px; padding:6px 11px; width:220px; font-size:12.5px; position:relative;`)}>
      <span className="mono" style={css(`color:${searchMiss ? '#E4938E' : '#5B626C'};`)}>⌕</span>
      <input
        value={searchInput}
        onChange={(e) => { setSearchInput(e.target.value); if (searchMiss) setSearchMiss(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
        placeholder="Search symbol…"
        aria-label="Search symbol"
        className="mono"
        style={css("flex:1; min-width:0; background:transparent; border:none; outline:none; color:#EDEFF2; font-size:12.5px; font-family:inherit;")}
      />
      {searchMiss && <span role="status" style={css("position:absolute; top:100%; left:0; margin-top:4px; font-size:10.5px; color:#E4938E; background:#191D24; border:1px solid #23272E; border-radius:6px; padding:4px 8px; white-space:nowrap;")}>No match for “{searchInput.trim()}”</span>}
    </div>
    {(() => {
      const { status, newest } = pipelineStatus(dataHealth);
      const meta: Record<string, { color: string; label: string }> = {
        live: { color: '#0E8A5F', label: 'LIVE DATA' },
        delayed: { color: '#C79A3D', label: 'DATA DELAYED' },
        offline: { color: '#E4655E', label: 'DATA OFFLINE' },
        connecting: { color: '#5B626C', label: 'CONNECTING…' },
      };
      const m = meta[status];
      const upd = newest ? new Date(newest).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
      const title =
        status === 'live' ? `All live data sources responding · last update ${upd}`
        : status === 'delayed' ? `Some sources are slow or failing · freshest update ${upd || '—'}`
        : status === 'offline' ? 'Live data sources are unreachable right now — figures shown as “—”'
        : 'Connecting to live data sources…';
      return (
        <div className="mono hide-sm" role="status" aria-live="polite" title={title} aria-label={title} style={css(`display:flex; align-items:center; gap:6px; font-size:11.5px; color:#8A929E;`)}>
          <span style={css(`width:7px; height:7px; border-radius:50%; background:${m.color}; box-shadow:0 0 0 3px ${m.color}2E;`)}></span>
          {m.label}{status === 'live' && upd ? ` · ${upd}` : ''}
        </div>
      );
    })()}
    <div className="mono hide-sm" style={css("display:flex; align-items:center; gap:6px; font-size:11.5px; color:#8A929E;")}>
      <span style={css(`width:7px; height:7px; border-radius:50%; background:${clock.open ? '#0E8A5F' : '#5B626C'}; box-shadow:0 0 0 3px rgba(14,138,95,0.18);`)}></span>
      {clock.open ? 'OSLO OPEN' : 'OSLO CLOSED'} · {clock.time}
    </div>
    <div style={css("width:28px; height:28px; border-radius:50%; background:#2A2F37; display:flex; align-items:center; justify-content:center; font-size:11px; color:#C6CCD4;")}>JA</div>
  </div>

  
  <div className="mono" style={css("display:flex; align-items:center; height:34px; background:#0B0D10; border-bottom:1px solid #23272E; padding:0 4px; flex:0 0 auto; overflow-x:auto;")}>
    {indexTiles.map((t, i) => (
      <div key={i} style={css(`display:flex; align-items:baseline; gap:7px; padding:0 16px; ${i < indexTiles.length - 1 ? 'border-right:1px solid #1D2229;' : ''} font-size:12px; flex:0 0 auto;`)}>
        <span style={css("color:#8A929E;")}>{t.label}</span>
        <span style={css("color:#F2F4F7;")}>{t.value ?? '—'}</span>
        <span style={css(`color:${t.chgPct == null ? '#5B626C' : pctColor(t.chgPct)};`)}>{t.chgPct == null ? '·' : pctText(t.chgPct)}</span>
      </div>
    ))}
  </div>

  
  <main id="main-content" className="screen-area" style={css("flex:1; position:relative; min-height:0;")}>

    
    {isMarkets && <MarketsTab watchlist={watchlist} editWatch={editWatch} removeWatchSymbol={removeWatchSymbol} addWatchSymbol={addWatchSymbol} setEditWatch={setEditWatch} tfSpan={tfSpan} idxRange={idxRange} setIdxRange={setIdxRange} osebx={osebx} idxPath={idxPath} sectorTiles={sectorTiles} gainers={gainers} losers={losers} order={order} open={open} feedItems={feedItems} triggeredToday={triggeredToday} condLabel={condLabel} />}

    
    {isWatch && <WatchlistTab watchFull={watchFull} editWatch={editWatch} setEditWatch={setEditWatch} addWatchSymbol={addWatchSymbol} removeWatchSymbol={removeWatchSymbol} />}

    
    {isNews && <NewsTab feedItems={feedItems} mostRead={mostRead} macro={macro} />}

    
    {isReports && <ReportsTab calendarDisplay={calendarDisplay} reportTicker={reportTicker} reportName={base[reportTicker]?.name || reportTicker} rcBeat={rcBeat} rcRev={rcRev} rcNI={rcNI} rcEps={rcEps} rcRoe={rcRoe} revBars={revBars} buyN={buyN} holdN={holdN} sellN={sellN} analystDisplay={analystDisplay} />}

    
    {isAlerts && <AlertsTab alertRules={alertRules} triggeredToday={triggeredToday} todayKey={todayKey} removeAlertRule={removeAlertRule} base={base} newAlertSym={newAlertSym} setNewAlertSym={setNewAlertSym} newAlertCond={newAlertCond} setNewAlertCond={setNewAlertCond} newAlertPrice={newAlertPrice} setNewAlertPrice={setNewAlertPrice} createAlertRule={createAlertRule} />}

    
    {isAI && <AiPortfolioTab ledger={ledger} port={port} quantModel={quantModel} pendingRebalance={pendingRebalance} resetPortfolio={resetPortfolio} runRebalance={runRebalance} clickable={clickable} factorChips={factorChips} themeColors={THEME_COLORS} todayLabelStr={todayLabel()} risk={risk} riskConsStyle={riskConsStyle} riskBalStyle={riskBalStyle} riskAggStyle={riskAggStyle} riskNote={riskNote} setRiskCons={setRiskCons} setRiskBal={setRiskBal} setRiskAgg={setRiskAgg} sinceIncStr={sinceIncStr} showConv={showConv} toggleConv={toggleConv} convToggleLabel={convToggleLabel} convScore={convScore} convTilt={convTilt} convNet={convNet} convStance={convStance} convFactors={convFactors} aiRecos={aiRecos} navChart={navChart} rebalEvents={rebalEvents} rbOpen={rbOpen} rbSel={rbSel} aiHoldings={aiHoldings} exportPortfolioCsv={exportPortfolioCsv} portfolioLog={portfolioLog} aiSignals={aiSignals} aiActions={aiActions} divsLabel={divsLabel} divsDisplay={divsDisplay} holdingReportsDisplay={holdingReportsDisplay} />}

    
    {isRisk && <RiskTab portTotalValue={port.totalValue} clockTime={clock.time} rBeta={rBeta} rVol={rVol} rVolNote={rVolNote} rVar={rVar} rVarNok={rVarNok} rMdd={rMdd} rSharpe={rSharpe} sectorExp={sectorExp} geoRows={geoRows} askPct={askPct} outsideAskPct={outsideAskPct} concExp={concExp} top5Pct={top5Pct} effBeta={effBeta} scenarios={scenarios} />}

    
    {isFx && <FxTab clock={clock} foreignPct={foreignPct} usdPct={usdPct} ccyTotals={ccyTotals} fxCurrencyRows={fxCurrencyRows} fxRates={fxRates} fxHoldings={fxHoldings} />}

    
    {isAttr && <AttributionTab attrTotalStr={attrTotalStr} attrBenchStr={attrBenchStr} attrActiveStr={attrActiveStr} topContrib={topContrib} topContribStr={topContribStr} attrDecomp={attrDecomp} contribHoldings={contribHoldings} contribThemes={contribThemes} />}

    
    {isIns && <InsiderTab insiderCount={insiderLive.length} insiderBuys={insiderBuys} insiderSells={insiderSells} insiderDisclosuresLabel={insiderDisclosuresLabel} insiderSentiment={insiderSentiment} insiderSentimentNote={insiderSentimentNote} insiderDisplay={insiderDisplay} />}

    
    {isBt && <BacktestTab backtest={backtest} btChart={btChart} btm={btm} btAnnual={btAnnual} qmTopN={qmTopN} risk={risk} quantModel={quantModel} qmStatusLabel={qmStatusLabel} qmSignals={qmSignals} />}

  </main>

  <div className="app-footer" style={css("flex:0 0 auto; display:flex; align-items:center; gap:10px; padding:6px 18px; background:#0E1013; border-top:1px solid #23272E; font-size:10.5px; color:#5B626C; line-height:1.4;")}>
    <span style={css("color:#7C8492;")}>Illustrative — not investment advice.</span>
    <span className="hide-sm">AI allocation is a systematic factor model on a small universe; live data via Yahoo Finance, Norges Bank, SSB &amp; Oslo Børs.</span>
    <div style={css("flex:1;")}></div>
    <span className="mono hide-sm">Nordlys Terminal</span>
  </div>


  {hasStock && (<>
  <div className="stock-overlay" style={css("position:absolute; inset:0; background:rgba(6,8,11,0.55); z-index:40;")} onClick={closeStock}></div>
  <div ref={stockPanelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${sName} details`} data-screen-label="Stock detail" className="stock-panel" style={css("position:absolute; top:0; right:0; bottom:0; width:720px; background:#101317; border-left:1px solid #23272E; z-index:41; overflow-y:auto; box-shadow:-30px 0 60px rgba(0,0,0,0.4); outline:none;")}>
    <div style={css("padding:20px 26px; border-bottom:1px solid #23272E; display:flex; align-items:flex-start; gap:14px;")}>
      <div>
        <div style={css("display:flex; align-items:center; gap:10px;")}>
          <span style={css("font-size:20px; font-weight:600; color:#F2F4F7;")}>{sName}</span>
          <span className="mono" style={css("font-size:12px; color:#8A929E; background:#191D24; padding:2px 8px; border-radius:5px;")}>{sSym} · OSE</span>
        </div>
        <div style={css("display:flex; align-items:baseline; gap:12px; margin-top:10px;")}>
          <span className="mono" style={css("font-size:32px; font-weight:600; color:#F2F4F7;")}>{sLast}</span>
          <span style={css("font-size:13px; color:#8A929E;")}>{sCur}</span>
          <span className="mono" style={css("font-size:14px;")}>{sChgEl}</span>
        </div>
      </div>
      <div style={css("flex:1;")}></div>
      <div style={css("display:flex; gap:8px; align-items:center;")}>
        <button onClick={() => setWatchTickers((prev) => prev.includes(sSym) ? prev.filter((t) => t !== sSym) : [...prev, sSym])} className="hide-sm" style={css("border:1px solid #2A2F37; background:#191D24; color:#DDE1E7; font-size:12.5px; padding:8px 13px; border-radius:8px; cursor:pointer; font-family:inherit;")}>{watchTickers.includes(sSym) ? '✓ Watchlist' : '＋ Watchlist'}</button>
        <button onClick={() => { setNewAlertSym(sSym); setStock(null); setTab('alerts'); }} className="hide-sm" style={css("border:none; background:#2D5BD0; color:#fff; font-size:12.5px; padding:8px 13px; border-radius:8px; cursor:pointer; font-family:inherit;")}>Set alert</button>
        <span {...clickable(closeStock, 'Close stock detail')} style={css("width:32px; height:32px; border-radius:8px; background:#191D24; border:1px solid #2A2F37; display:flex; align-items:center; justify-content:center; color:#9AA1AC; cursor:pointer; font-size:16px;")}>✕</span>
      </div>
    </div>
    <div style={css("padding:16px 26px 6px;")}>
      <div className="mono" style={css("display:flex; gap:3px; font-size:11px; margin-bottom:10px;")}>
        {TF_DETAIL.map(([label, rng]) => tfSpan(label, rng, detailRange, setDetailRange, 'padding:4px 10px;'))}
      </div>
      <svg viewBox="0 0 660 240" preserveAspectRatio="none" style={css("width:100%; height:240px; display:block;")} role="img" aria-label={`${sName} price chart`}>
        <defs>
          <linearGradient id="dtgradUp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3DBB84" stopOpacity="0.26"/><stop offset="100%" stopColor="#3DBB84" stopOpacity="0"/></linearGradient>
          <linearGradient id="dtgradDown" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E4655E" stopOpacity="0.26"/><stop offset="100%" stopColor="#E4655E" stopOpacity="0"/></linearGradient>
        </defs>
        <line x1="0" y1="60" x2="660" y2="60" stroke="#20242B" strokeWidth="1"/>
        <line x1="0" y1="120" x2="660" y2="120" stroke="#20242B" strokeWidth="1"/>
        <line x1="0" y1="180" x2="660" y2="180" stroke="#20242B" strokeWidth="1"/>
        {detailPath ? (<>
          <path d={detailPath.area} fill={`url(#${detailPath.up ? 'dtgradUp' : 'dtgradDown'})`}/>
          <polyline points={detailPath.line} fill="none" stroke={detailPath.up ? '#3DBB84' : '#E4655E'} strokeWidth="2.2"/>
        </>) : (
          <text x="330" y="120" textAnchor="middle" fill="#5B626C" fontSize="12" className="mono">Loading price history…</text>
        )}
      </svg>
    </div>
    <div style={css("padding:12px 26px 6px;")}>
      <div className="mono" style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:0; border:1px solid #23272E; border-radius:10px; overflow:hidden;")}>
        <div style={css("padding:12px 14px; border-right:1px solid #23272E;")}><div style={css("font-size:11px; color:#7C8492;")}>Open</div><div style={css("font-size:15px; color:#F2F4F7; margin-top:3px;")}>{sOpen}</div></div>
        <div style={css("padding:12px 14px; border-right:1px solid #23272E;")}><div style={css("font-size:11px; color:#7C8492;")}>Day range</div><div style={css("font-size:15px; color:#F2F4F7; margin-top:3px;")}>{sRange}</div></div>
        <div style={css("padding:12px 14px; border-right:1px solid #23272E;")}><div style={css("font-size:11px; color:#7C8492;")}>Volume</div><div style={css("font-size:15px; color:#F2F4F7; margin-top:3px;")}>{sVol}</div></div>
        <div style={css("padding:12px 14px;")}><div style={css("font-size:11px; color:#7C8492;")}>Mkt cap</div><div style={css("font-size:15px; color:#F2F4F7; margin-top:3px;")}>{sCap}</div></div>
      </div>
    </div>
    {sTracked && (<>
    <div style={css("margin:16px 26px 0; border:1px solid #3B2F63; border-radius:12px; background:#120E22; overflow:hidden;")}>
      <div style={css("display:flex; align-items:center; gap:10px; padding:13px 18px; border-bottom:1px solid #221B38;")}>
        <span style={css("font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#B79BFF; font-weight:600;")}>Model view</span>
        <span className="mono" style={css("font-size:10px; color:#7C8492;")}>factor-model signal:</span>
        <span style={css("margin-left:auto;")}>{sRecoEl}</span>
      </div>
      <div style={css("padding:16px 18px;")}>
        <div className="mono" style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:0; border:1px solid #221B38; border-radius:10px; overflow:hidden;")}>
          <div style={css("padding:11px 13px; border-right:1px solid #221B38;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Allocation</div><div style={css("font-size:14px; color:#F2F4F7; margin-top:3px;")}>{sSize}</div></div>
          <div style={css("padding:11px 13px; border-right:1px solid #221B38;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Consensus target</div><div style={css("font-size:14px; color:#F2F4F7; margin-top:3px;")}>{sTarget}</div></div>
          <div style={css("padding:11px 13px; border-right:1px solid #221B38;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Upside</div><div style={css("font-size:14px; margin-top:3px;")}>{sUpsideEl}</div></div>
          <div style={css("padding:11px 13px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Held since</div><div style={css("font-size:14px; color:#F2F4F7; margin-top:3px;")}>{sSince}</div></div>
        </div>
        <div className="mono" style={css("font-size:9.5px; color:#5B626C; margin-top:6px;")}>Target = Yahoo analyst consensus · upside vs live price · allocation &amp; held-since from the live ledger.</div>

        <div style={css("margin-top:16px;")}>
          <div style={css("font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:7px;")}>Factor scores driving the signal</div>
          {factorChips(sFactorZ)}
          {sReason && <div style={css("font-size:11.5px; color:#9AA1AC; line-height:1.5; margin-top:9px;")}>{sReason}</div>}
        </div>
      </div>
    </div>
    </>)}
    <div style={css("padding:18px 26px;")}>
      <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Latest news</span>
      <div style={css("margin-top:12px; display:flex; flex-direction:column; gap:2px;")}>
        {sdNews.length ? sdNews.map((n, i) => (
          <a key={i} href={n.link || undefined} target="_blank" rel="noreferrer" style={css(`display:block; padding:12px 0; ${i < sdNews.length - 1 ? 'border-bottom:1px solid #191D23;' : ''} text-decoration:none;`)}><div style={css("font-size:13.5px; color:#DDE1E7; line-height:1.4; font-weight:500;")}>{n.title}</div><div className="mono" style={css("font-size:11px; color:#5B626C; margin-top:5px;")}>{n.meta}</div></a>
        )) : (
          <span className="mono" style={css("font-size:11.5px; color:#5B626C; padding:8px 0; line-height:1.5;")}>No recent headlines for this name in the live feed yet.</span>
        )}
      </div>
    </div>
  </div>
  </>)}

</div>
  );
}
