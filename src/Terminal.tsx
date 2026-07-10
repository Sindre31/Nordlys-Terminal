import React, { useState } from 'react';

function css(str: string): React.CSSProperties {
  const obj: Record<string, string> = {};
  str.split(';').forEach((decl) => {
    const idx = decl.indexOf(':');
    if (idx === -1) return;
    const prop = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (!prop || !val) return;
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    obj[camel] = val;
  });
  return obj as React.CSSProperties;
}

function deltaBadge(v: number | null | undefined) {
  if (v === null || v === undefined)
    return React.createElement('span', { className: 'mono', style: { color: '#9AA1AC', fontSize: 10 } }, '—');
  const up = v >= 0;
  return React.createElement(
    'span',
    { className: 'mono', style: { color: up ? '#3DBB84' : '#E4655E', fontSize: 10 } },
    (up ? '+' : '') + v.toFixed(1) + '%',
  );
}

function factorBar(val: number) {
  const up = val >= 0;
  const pct = Math.min((Math.abs(val) / 25) * 50, 50);
  return React.createElement(
    'div',
    { style: { position: 'relative', height: 8, background: '#1E1834', borderRadius: 4 } },
    React.createElement('div', {
      style: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: '#3A3358' },
    }),
    React.createElement('div', {
      style: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        borderRadius: 4,
        background: up ? '#3DBB84' : '#E4655E',
        left: up ? '50%' : 50 - pct + '%',
        width: pct + '%',
      },
    }),
  );
}
function factorVal(val: number) {
  const up = val >= 0;
  return React.createElement(
    'span',
    {
      className: 'mono',
      style: { fontSize: 12.5, fontWeight: 600, color: up ? '#3DBB84' : '#E4655E', width: 34, display: 'inline-block', textAlign: 'right' },
    },
    (up ? '+' : '') + val,
  );
}

function stocks() {
  return {
    EQNR: { name: 'Equinor', last: '312.40', chg: 1.24, open: '309.10', range: '308.2 – 313.9', vol: '4.21M', cap: '861B' },
    DNB: { name: 'DNB Bank', last: '223.10', chg: 0.45, open: '222.05', range: '221.4 – 224.0', vol: '1.88M', cap: '328B' },
    TEL: { name: 'Telenor', last: '138.65', chg: -0.32, open: '139.10', range: '138.1 – 139.6', vol: '1.41M', cap: '194B' },
    NHY: { name: 'Norsk Hydro', last: '68.92', chg: 2.08, open: '67.55', range: '67.4 – 69.2', vol: '6.04M', cap: '140B' },
    MOWI: { name: 'Mowi', last: '194.30', chg: -1.15, open: '196.60', range: '193.8 – 197.1', vol: '2.33M', cap: '100B' },
    YAR: { name: 'Yara International', last: '341.80', chg: 0.88, open: '338.80', range: '337.9 – 343.0', vol: '0.92M', cap: '86B' },
    AKRBP: { name: 'Aker BP', last: '258.90', chg: 1.62, open: '254.80', range: '253.5 – 260.1', vol: '1.12M', cap: '163B' },
    KOG: { name: 'Kongsberg Gruppen', last: '1 084.0', chg: 0.19, open: '1 082.0', range: '1 076 – 1 090', vol: '0.55M', cap: '190B' },
    SALM: { name: 'SalMar', last: '612.50', chg: -0.74, open: '617.00', range: '610.0 – 618.5', vol: '0.41M', cap: '80B' },
    LMT: { name: 'Lockheed Martin', last: '512.40', chg: 1.41, open: '505.60', range: '504.1 – 514.8', vol: '1.2M', cap: '$122B', cur: 'USD' },
    XOM: { name: 'Exxon Mobil', last: '118.20', chg: 0.97, open: '117.05', range: '116.8 – 119.0', vol: '12.4M', cap: '$472B', cur: 'USD' },
    NVDA: { name: 'NVIDIA', last: '172.30', chg: 1.88, open: '169.10', range: '168.4 – 173.5', vol: '188M', cap: '$4.1T', cur: 'USD' },
    GLOBAL: { name: 'Nordnet Indeksfond Global', last: '248.60', chg: 0.41, open: '247.55', range: '247.0 – 249.1', vol: '—', cap: '—', cur: 'NOK' },
    DNBTEK: { name: 'DNB Teknologi A', last: '612.10', chg: 0.62, open: '608.80', range: '607.5 – 614.0', vol: '—', cap: '—', cur: 'NOK' },
  } as Record<string, { name: string; last: string; chg: number; open: string; range: string; vol: string; cap: string; cur?: string }>;
}

function thesis() {
  return {
    EQNR: {
      reco: 'HOLD', size: '15.0%', target: '340 NOK', upside: 8.8, since: '21 Feb 2026',
      role: 'Core energy anchor and the portfolio’s largest single position.',
      text: 'Equinor is held as the primary expression of the AI’s risk-premium tilt to oil. A Middle-East shipping-risk premium plus resilient European gas prices support cash flow, while the raised dividend and fresh buyback shrink the share count. Valuation stays undemanding at ~8x earnings, giving downside cushion if the geopolitical bid fades.',
      drivers: [
        { text: 'Tanker reroutes near the Strait of Hormuz add a crude supply premium', sent: 'Bullish', meta: 'Conflict · Bloomberg · 12:20' },
        { text: 'Q2 cash flow beat; dividend raised and $1.2bn buyback launched', sent: 'Bullish', meta: 'Earnings · Reuters · 14:21' },
        { text: 'Trump “drill, baby, drill” rhetoric a medium-term supply risk', sent: 'Watch', meta: 'US Politics · Reuters · 08:55' },
      ],
      risks: ['A ceasefire that removes the crude risk premium', 'Faster-than-expected US supply growth capping prices'],
    },
    KOG: {
      reco: 'BUY', size: '12.0%', target: '1 240 NOK', upside: 14.4, since: '12 May 2026',
      role: 'Highest-conviction defence position; structural, multi-year theme.',
      text: 'Kongsberg is the AI’s cleanest Nordnet-listed play on European rearmament. Summit pledges to lift defence budgets translate into a visible, growing order book — a durable re-rating rather than a headline pop. Position was increased +2.0% at the latest rebalance.',
      drivers: [
        { text: 'European members pledged higher defence budgets at summit', sent: 'Bullish', meta: 'Defence · AP · 11:05' },
        { text: 'NOK 4.3bn NATO-partner contract win', sent: 'Bullish', meta: 'Orders · Reuters · yesterday' },
      ],
      risks: ['A broad peace deal that slows the rearmament cycle', 'Execution/delivery delays on a fast-growing order book'],
    },
    AKRBP: {
      reco: 'BUY', size: '8.0%', target: '285 NOK', upside: 10.1, since: '24 Jun 2026',
      role: 'High-beta satellite to the core energy sleeve.',
      text: 'Aker BP amplifies the energy tilt with higher operational leverage to the crude price than Equinor. Added +1.5% on the shipping-disruption supply premium; sized to be trimmed quickly if tensions ease.',
      drivers: [
        { text: 'Crude supply premium from Mideast shipping risk', sent: 'Bullish', meta: 'Conflict · Bloomberg · 12:20' },
        { text: '2026 production guidance raised after Yggdrasil ramp-up', sent: 'Bullish', meta: 'Guidance · E24 · 10:44' },
      ],
      risks: ['High beta cuts both ways if oil rolls over', 'Single-basin concentration in the North Sea'],
    },
    NHY: {
      reco: 'HOLD', size: '10.0%', target: '72 NOK', upside: 4.5, since: '03 Apr 2026',
      role: 'Materials exposure; flagged for review on policy risk.',
      text: 'Norsk Hydro benefits from stronger European aluminium demand and raised output guidance, but a Trump proposal for a 25% tariff on European aluminium is a binary policy overhang. The AI holds rather than adds, and has flagged the name pending a concrete decision.',
      drivers: [
        { text: 'Aluminium output guidance raised on European demand', sent: 'Bullish', meta: 'Guidance · E24 · 13:58' },
        { text: 'Trump floats 25% tariff on European aluminium imports', sent: 'Watch', meta: 'US Politics · Reuters · 13:52' },
      ],
      risks: ['Tariff decision goes against European exporters', 'Aluminium price sensitive to a China demand slowdown'],
    },
    YAR: {
      reco: 'HOLD', size: '6.0%', target: '360 NOK', upside: 5.3, since: '03 Apr 2026',
      role: 'Grain-disruption hedge within materials.',
      text: 'Yara is held as a hedge on conflict-driven grain and fertilizer disruption. Modest sizing reflects offsetting pressure from softer gas input costs and a mixed pricing outlook.',
      drivers: [{ text: 'Conflict-driven grain-supply disruption supports fertilizer demand', sent: 'Bullish', meta: 'Conflict · AFP · 10:18' }],
      risks: ['A peace agreement easing grain-supply fears', 'Natural-gas input-cost swings compressing margins'],
    },
    MOWI: {
      reco: 'TRIM', size: '9.0%', target: '188 NOK', upside: -3.2, since: '21 Feb 2026',
      role: 'Seafood diversifier being reduced on price weakness.',
      text: 'Mowi is a diversifier the AI is actively trimming. Salmon spot prices have fallen for three straight weeks, pressuring Q3 margins. Reduced −1.0% rather than exited to retain some seafood exposure while the price trend confirms.',
      drivers: [
        { text: 'Salmon spot prices fall for a third straight week', sent: 'Bearish', meta: 'Sector · DN · 13:40' },
        { text: 'Exporters warn of margin squeeze into Q3', sent: 'Bearish', meta: 'Sector · DN · today' },
      ],
      risks: ['Continued spot-price weakness into Q3', 'Biological/regulatory cost inflation'],
    },
    LMT: {
      reco: 'BUY', size: '9.0%', target: '$560', upside: 9.3, since: '12 May 2026',
      role: 'US defence exposure — booked outside ASK.',
      text: 'Lockheed Martin extends the defence theme into the US market, the most direct beneficiary of a rising US defence budget. As a non-EEA holding it sits on the Nordnet investeringskonto, outside the aksjesparekonto.',
      drivers: [{ text: 'US defence budget upcycle and allied procurement', sent: 'Bullish', meta: 'Defence · AP · 11:05' }],
      risks: ['US budget/appropriations gridlock', 'FX: USD/NOK swings affect NOK returns'],
    },
    XOM: {
      reco: 'HOLD', size: '8.0%', target: '$128', upside: 8.3, since: '12 May 2026',
      role: 'US energy exposure — booked outside ASK.',
      text: 'Exxon Mobil diversifies the energy sleeve into US supermajors, carrying the same crude supply-premium logic with a large, integrated cash-return profile. Non-EEA, so held outside ASK.',
      drivers: [{ text: 'Crude supply premium from geopolitical risk', sent: 'Bullish', meta: 'Conflict · Bloomberg · 12:20' }],
      risks: ['US supply growth capping oil prices', 'FX: USD/NOK translation risk'],
    },
    NVDA: {
      reco: 'HOLD', size: '6.0%', target: '$190', upside: 10.3, since: '12 May 2026',
      role: 'Growth/tech ballast — booked outside ASK.',
      text: 'NVIDIA provides growth ballast uncorrelated to the geopolitical trades, riding the AI-capex cycle with support from an expected rate-cut path. Kept modest given elevated volatility; non-EEA, held outside ASK.',
      drivers: [
        { text: 'Norges Bank / Fed rate-cut path supports long-duration growth', sent: 'Bullish', meta: 'Rates · macro · 09:30' },
        { text: 'Sustained AI data-centre capex', sent: 'Bullish', meta: 'Sector · CNBC · today' },
      ],
      risks: ['High valuation and realised volatility', 'AI-capex digestion / demand air-pocket'],
    },
    GLOBAL: {
      reco: 'HOLD', size: '11.0%', target: '—', upside: 0, since: '21 Feb 2026',
      role: 'Diversified global-equity base layer.',
      text: 'The Nordnet global index fund is the portfolio’s low-cost base layer, capturing broad market beta and a trade-de-escalation tailwind while keeping single-stock concentration in check.',
      drivers: [{ text: 'Signs of US–China tariff de-escalation lift global risk appetite', sent: 'Bullish', meta: 'Trade · CNBC · 09:40' }],
      risks: ['Global growth disappointment', 'Broad de-risking event'],
    },
    DNBTEK: {
      reco: 'HOLD', size: '5.0%', target: '—', upside: 0, since: '12 May 2026',
      role: 'Actively-managed tech sleeve.',
      text: 'DNB Teknologi adds an actively-managed technology tilt that benefits from the expected rate-cut tailwind, complementing the passive global fund.',
      drivers: [{ text: 'Rate-cut expectations support tech multiples', sent: 'Bullish', meta: 'Rates · macro · 09:30' }],
      risks: ['Rate path surprises to the upside', 'Concentration in a few large tech names'],
    },
  } as Record<
    string,
    { reco: string; size: string; target: string; upside: number; since: string; role: string; text: string; drivers: { text: string; sent: string; meta: string }[]; risks: string[] }
  >;
}

function spark(up: boolean) {
  const pts = up ? '0,16 16,14 32,17 48,10 64,8 80,4' : '0,7 16,9 32,8 48,13 64,15 80,18';
  const color = up ? '#3DBB84' : '#E4655E';
  return React.createElement(
    'svg',
    { viewBox: '0 0 80 22', style: { width: 80, height: 22 } },
    React.createElement('polyline', { points: pts, fill: 'none', stroke: color, strokeWidth: 1.6 }),
  );
}

function chgEl(chg: number, size?: number) {
  const up = chg >= 0;
  return React.createElement(
    'span',
    { className: 'mono', style: { color: up ? '#3DBB84' : '#E4655E', fontSize: size || 12 } },
    (up ? '+' : '') + chg.toFixed(2) + '%',
  );
}

function sentBadge(kind: string) {
  const map: Record<string, [string, string]> = { Bullish: ['#3DBB84', '#12271F'], Bearish: ['#E4655E', '#2A1917'], Watch: ['#C79A3D', '#2A2314'] };
  const c = map[kind] || map.Watch;
  return React.createElement(
    'span',
    { className: 'mono', style: { color: c[0], background: c[1], borderRadius: 4, padding: '2px 7px', fontSize: 9.5, letterSpacing: '0.04em', textTransform: 'uppercase' } },
    kind,
  );
}
function convBadge(kind: string) {
  const map: Record<string, [string, string]> = { High: ['#B79BFF', '#211B33'], Medium: ['#8A929E', '#1B1F25'], Trim: ['#E4655E', '#2A1917'] };
  const c = map[kind] || map.Medium;
  return React.createElement(
    'span',
    { className: 'mono', style: { color: c[0], background: c[1], borderRadius: 20, padding: '3px 10px', fontSize: 10.5 } },
    kind,
  );
}
function askTag(ok: boolean) {
  if (ok) return null;
  return React.createElement(
    'span',
    { className: 'mono', style: { color: '#C79A3D', border: '1px solid #4A3E1E', background: '#211B0E', borderRadius: 20, padding: '1px 7px', fontSize: 9, letterSpacing: '0.03em', whiteSpace: 'nowrap' } },
    '◔ Outside ASK',
  );
}
function dot(dir: number) {
  return React.createElement('span', {
    style: { display: 'block', width: 8, height: 8, borderRadius: 2, background: dir > 0 ? '#3DBB84' : dir < 0 ? '#E4655E' : '#7C5CFF' },
  });
}
function actBadge(kind: string) {
  const map: Record<string, [string, string]> = {
    BUY: ['#3DBB84', '#12271F'], ADD: ['#3DBB84', '#12271F'], HOLD: ['#8A929E', '#1B1F25'], TRIM: ['#C79A3D', '#2A2314'], SELL: ['#E4655E', '#2A1917'],
  };
  const c = map[kind] || map.HOLD;
  return React.createElement(
    'span',
    { className: 'mono', style: { color: c[0], background: c[1], borderRadius: 5, padding: '4px 0', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', width: 58, textAlign: 'center', display: 'inline-block' } },
    kind,
  );
}
function upside(v: number) {
  if (!v) return React.createElement('span', { className: 'mono', style: { fontSize: 12.5, color: '#7C8492' } }, '—');
  const up = v >= 0;
  return React.createElement('span', { className: 'mono', style: { fontSize: 12.5, color: up ? '#3DBB84' : '#E4655E' } }, (up ? '+' : '') + v.toFixed(1) + '%');
}
function rating(kind: string) {
  const map: Record<string, [string, string]> = { Buy: ['#3DBB84', '#12271F'], Sell: ['#E4655E', '#2A1917'], Hold: ['#8A929E', '#1B1F25'], Neutral: ['#8A929E', '#1B1F25'] };
  const c = map[kind] || map.Hold;
  return React.createElement(
    'span',
    { className: 'mono', style: { color: c[0], background: c[1], borderRadius: 5, padding: '3px 0', fontSize: 10.5, fontWeight: 600, width: 64, textAlign: 'center', display: 'inline-block' } },
    kind,
  );
}
function hbar(pct: number, color: string) {
  return React.createElement('div', { style: { height: '100%', width: pct + '%', background: color, borderRadius: 5 } });
}
function swatch(color: string) {
  return React.createElement('span', { style: { display: 'block', width: 12, height: 12, borderRadius: 3, background: color } });
}
function contribBar(v: number, max: number) {
  const up = v >= 0;
  const pct = Math.min((Math.abs(v) / max) * 50, 50);
  const line = React.createElement('div', { key: 'l', style: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: '#3A414B' } });
  const seg = React.createElement('div', {
    key: 's',
    style: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3, background: up ? '#3DBB84' : '#E4655E', left: up ? '50%' : 50 - pct + '%', width: pct + '%' },
  });
  return React.createElement('div', { style: { position: 'absolute', inset: 0 } }, line, seg);
}
function ppVal(v: number) {
  const up = v >= 0;
  return React.createElement('span', { className: 'mono', style: { fontSize: 12.5, fontWeight: 600, color: up ? '#3DBB84' : '#E4655E' } }, (up ? '+' : '') + v.toFixed(1));
}
function ccyPill(ccy: string) {
  const map: Record<string, [string, string]> = { NOK: ['#9AA1AC', '#1B1F25'], USD: ['#7FB0D8', '#12222E'], Mixed: ['#B79BFF', '#211B33'] };
  const c = map[ccy] || map.NOK;
  return React.createElement('span', { className: 'mono', style: { color: c[0], background: c[1], borderRadius: 5, padding: '2px 0', fontSize: 10.5, width: 52, textAlign: 'center', display: 'inline-block' } }, ccy);
}
function fxRisk(kind: string) {
  const map: Record<string, [string, string]> = { None: ['#7C8492', '#1B1F25'], Medium: ['#C79A3D', '#2A2314'], High: ['#E4655E', '#2A1917'] };
  const c = map[kind] || map.None;
  return React.createElement('span', { className: 'mono', style: { color: c[0], background: c[1], borderRadius: 20, padding: '2px 0', fontSize: 10, width: 64, textAlign: 'center', display: 'inline-block' } }, kind);
}
function side(kind: string) {
  const buy = kind === 'BUY';
  return React.createElement(
    'span',
    { className: 'mono', style: { color: buy ? '#3DBB84' : '#E4655E', background: buy ? '#12271F' : '#2A1917', borderRadius: 4, padding: '2px 0', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', width: 48, textAlign: 'center', display: 'inline-block' } },
    kind,
  );
}
function scImpact(v: number) {
  const up = v >= 0;
  return React.createElement('span', { className: 'mono', style: { fontSize: 13.5, fontWeight: 600, color: up ? '#3DBB84' : '#E4655E' } }, (up ? '+' : '') + v.toFixed(1) + '%');
}

type Tab = 'markets' | 'watchlist' | 'news' | 'reports' | 'alerts' | 'ai' | 'risk' | 'fx' | 'attr' | 'ins' | 'bt';
type RiskLevel = 'conservative' | 'balanced' | 'aggressive';

export default function Terminal() {
  const [tab, setTab] = useState<Tab>('markets');
  const [stock, setStock] = useState<string | null>(null);
  const [showConv, setShowConv] = useState(false);
  const [rbEvent, setRbEvent] = useState<number | null>(null);
  const [risk, setRisk] = useState<RiskLevel>('balanced');

  const active = 'padding:5px 12px; border-radius:5px; background:#1D2229; color:#fff; cursor:pointer; font-size:12.5px;';
  const idle = 'padding:5px 12px; border-radius:5px; color:#8A929E; cursor:pointer; font-size:12.5px;';
  const set = (t: Tab) => () => { setTab(t); setStock(null); };
  const open = (sym: string) => () => setStock(sym);
  const S = stocks();
  const order = ['EQNR', 'DNB', 'TEL', 'NHY', 'MOWI', 'YAR', 'AKRBP', 'KOG', 'SALM'];

  const watchlist = order.map((sym) => ({
    ticker: sym,
    name: S[sym].name,
    last: S[sym].last,
    chg: React.createElement('span', { className: 'mono', style: { color: S[sym].chg >= 0 ? '#3DBB84' : '#E4655E' } }, (S[sym].chg >= 0 ? '+' : '') + S[sym].chg.toFixed(2) + '%'),
    open: open(sym),
  }));

  const bidAsk: Record<string, [string, string]> = {
    EQNR: ['312.30', '312.50'], DNB: ['223.00', '223.20'], TEL: ['138.60', '138.75'], NHY: ['68.90', '68.95'], MOWI: ['194.20', '194.45'],
    YAR: ['341.60', '342.00'], AKRBP: ['258.70', '259.10'], KOG: ['1 083', '1 085'], SALM: ['612.00', '613.00'],
  };
  const watchFull = order.map((sym) => ({
    ticker: sym, name: S[sym].name, last: S[sym].last,
    chg: chgEl(S[sym].chg, 13),
    bid: bidAsk[sym][0], ask: bidAsk[sym][1], vol: S[sym].vol, range: S[sym].range,
    sparkEl: spark(S[sym].chg >= 0),
    open: open(sym),
  }));

  const newsList = [
    { ticker: 'NHY', source: 'E24', time: '13:58', title: 'Norsk Hydro raises aluminium output guidance on stronger European demand' },
    { ticker: 'MOWI', source: 'DN', time: '13:40', title: 'Mowi shares slip as salmon spot prices fall for a third straight week' },
    { ticker: 'DNB', source: 'Bloomberg', time: '12:55', title: 'DNB reiterates 2026 return-on-equity target ahead of Q2 report' },
    { ticker: 'KOG', source: 'Reuters', time: '11:20', title: 'Kongsberg wins NOK 4.3bn defence contract from NATO partner' },
    { ticker: 'AKRBP', source: 'E24', time: '10:44', title: 'Aker BP raises 2026 production guidance after Yggdrasil ramp-up' },
    { ticker: 'MKT', source: 'DN', time: '09:30', title: 'Norges Bank holds policy rate at 4.25%, signals cut in autumn' },
  ];

  const calendar = [
    { day: '22', name: 'Equinor · Q2 2026', when: 'Before open', ticker: 'EQNR', period: 'Q2' },
    { day: '24', name: 'DNB Bank · Q2 2026', when: '07:00 CET', ticker: 'DNB', period: 'Q2' },
    { day: '25', name: 'Yara International · Q2 2026', when: '06:30 CET', ticker: 'YAR', period: 'Q2' },
    { day: '28', name: 'Mowi · Q2 2026', when: '06:30 CET', ticker: 'MOWI', period: 'Q2' },
    { day: '30', name: 'Aker BP · Q2 2026', when: 'After close', ticker: 'AKRBP', period: 'Q2' },
  ];

  const cur = S[stock as string] || S.EQNR;

  const analystRecs = [
    { broker: 'DNB Carnegie', ticker: 'EQNR', name: 'Equinor', rating: 'Buy', target: '340', prev: '(325)', date: '09 Jul' },
    { broker: 'ABG Sundal Collier', ticker: 'KOG', name: 'Kongsberg Gr.', rating: 'Buy', target: '1 250', prev: '(1 150)', date: '08 Jul' },
    { broker: 'Pareto Securities', ticker: 'AKRBP', name: 'Aker BP', rating: 'Buy', target: '290', prev: '(275)', date: '08 Jul' },
    { broker: 'Arctic Securities', ticker: 'MOWI', name: 'Mowi', rating: 'Hold', target: '200', prev: '(230)', date: '07 Jul' },
    { broker: 'Kepler Cheuvreux', ticker: 'NHY', name: 'Norsk Hydro', rating: 'Sell', target: '62', prev: '(70)', date: '04 Jul' },
    { broker: 'Nordea', ticker: 'YAR', name: 'Yara Int.', rating: 'Buy', target: '370', prev: '(360)', date: '03 Jul' },
    { broker: 'SEB', ticker: 'DNB', name: 'DNB Bank', rating: 'Hold', target: '230', prev: '(230)', date: '05 Jul' },
    { broker: 'Goldman Sachs', ticker: 'TEL', name: 'Telenor', rating: 'Neutral', target: '140', prev: '(145)', date: '02 Jul' },
  ].map((ar) => ({ ...ar, ratingEl: rating(ar.rating), open: S[ar.ticker] ? open(ar.ticker) : undefined }));

  const convFactors = [
    { label: 'Geopolitical risk premium', why: 'Mideast shipping risk + NATO rearmament lift energy & defence', val: 22 },
    { label: 'Earnings momentum', why: 'Q2 beats trend positive across held names', val: 12 },
    { label: 'Rates & macro', why: 'Norges Bank signals autumn cut — supportive', val: 14 },
    { label: 'Market breadth', why: 'Broad participation in the OSEBX advance', val: 9 },
    { label: 'Trade & tariffs', why: 'US metals-tariff threat is an unresolved overhang', val: -8 },
    { label: 'Volatility & drawdown', why: 'Realised vol elevated vs 3-month average', val: -7 },
  ].map((f) => ({ ...f, barEl: factorBar(f.val), valEl: factorVal(f.val) }));

  const aiHoldings = [
    { ticker: 'EQNR', name: 'Equinor', type: 'Share · Oslo Børs · Energy', alloc: '15.0%', value: '192 675', chg: 1.24, conv: 'High', driver: 'Oil bid on Mideast risk', ask: true },
    { ticker: 'KOG', name: 'Kongsberg Gruppen', type: 'Share · Oslo Børs · Defence', alloc: '12.0%', value: '154 140', chg: 0.19, conv: 'High', driver: 'NATO rearmament spend', ask: true },
    { ticker: 'LMT', name: 'Lockheed Martin', type: 'Share · NYSE · Defence', alloc: '9.0%', value: '115 605', chg: 1.41, conv: 'High', driver: 'US defence budget upcycle', ask: false },
    { ticker: 'XOM', name: 'Exxon Mobil', type: 'Share · NYSE · Energy', alloc: '8.0%', value: '102 760', chg: 0.97, conv: 'Medium', driver: 'Crude supply premium', ask: false },
    { ticker: 'AKRBP', name: 'Aker BP', type: 'Share · Oslo Børs · Energy', alloc: '8.0%', value: '102 760', chg: 1.62, conv: 'High', driver: 'North Sea leverage to oil', ask: true },
    { ticker: 'NHY', name: 'Norsk Hydro', type: 'Share · Oslo Børs · Materials', alloc: '10.0%', value: '128 450', chg: 2.08, conv: 'Medium', driver: 'US metals tariff watch', ask: true },
    { ticker: 'GLOBAL', name: 'Nordnet Indeksfond Global', type: 'Fund · Global equity', alloc: '11.0%', value: '141 295', chg: 0.41, conv: 'Medium', driver: 'Trade-thaw beta', ask: true },
    { ticker: 'NVDA', name: 'NVIDIA', type: 'Share · NASDAQ · Tech', alloc: '6.0%', value: '77 070', chg: 1.88, conv: 'Medium', driver: 'Rate-cut + AI capex', ask: false },
    { ticker: 'YAR', name: 'Yara International', type: 'Share · Oslo Børs · Materials', alloc: '6.0%', value: '77 070', chg: 0.88, conv: 'Medium', driver: 'Grain-disruption hedge', ask: true },
    { ticker: 'MOWI', name: 'Mowi', type: 'Share · Oslo Børs · Seafood', alloc: '9.0%', value: '115 605', chg: -1.15, conv: 'Trim', driver: 'Spot price weakness', ask: true },
  ].map((h) => ({ ...h, chgEl: chgEl(h.chg, 12.5), convEl: convBadge(h.conv), askEl: askTag(h.ask), open: S[h.ticker] ? open(h.ticker) : undefined }));

  const aiSignals = [
    { cat: 'US Politics', source: 'Reuters', sent: 'Watch', text: 'Trump floats 25% tariff on European aluminium imports at rally', tickers: 'NHY · YAR', time: '13:52' },
    { cat: 'Conflict', source: 'Bloomberg', sent: 'Bullish', text: 'Tanker reroutes reported near Strait of Hormuz after new incident', tickers: 'EQNR · AKRBP · FRO', time: '12:20' },
    { cat: 'Defence', source: 'AP', sent: 'Bullish', text: 'European members pledge higher defence budgets at summit', tickers: 'KOG', time: '11:05' },
    { cat: 'Peace', source: 'AFP', sent: 'Bearish', text: 'Ceasefire talks reported to advance — could ease crude risk premium', tickers: 'EQNR · KOG', time: '10:18' },
    { cat: 'Trade', source: 'CNBC', sent: 'Bullish', text: 'Signs of US–China tariff de-escalation lift global risk appetite', tickers: 'GLOBAL · DNBTEK', time: '09:40' },
    { cat: 'US Politics', source: 'Reuters', sent: 'Watch', text: 'Trump reiterates push to “drill, baby, drill” — medium-term oil supply risk', tickers: 'EQNR · AKRBP', time: '08:55' },
  ].map((sg) => ({ ...sg, sentEl: sentBadge(sg.sent) }));

  const aiActions = [
    { dir: 1, text: 'Increased KOG +2.0%', time: '14:05', basis: 'Defence', conf: 'High', impact: '+0.9% NAV',
      why: 'European members pledged higher defence budgets at the summit. Kongsberg is the most direct Nordnet-listed beneficiary; order-book visibility supports a durable, not headline-only, re-rating.' },
    { dir: 1, text: 'Added AKRBP +1.5%', time: '12:22', basis: 'Conflict', conf: 'Medium', impact: '+0.6% NAV',
      why: 'Tanker reroutes near the Strait of Hormuz add a supply-risk premium to crude. Paired with existing EQNR to lift energy beta while the shipping disruption persists; sized to trim quickly if tensions ease.' },
    { dir: -1, text: 'Trimmed MOWI −1.0%', time: '11:40', basis: 'Sector', conf: 'Medium', impact: '-0.3% NAV',
      why: 'Salmon spot prices fell for a third straight week, pressuring Q3 margins. Reduced rather than exited to keep seafood diversification while the price trend confirms.' },
    { dir: 0, text: 'Flagged NHY for review', time: '08:56', basis: 'US Politics', conf: 'Watch', impact: 'no trade',
      why: 'Trump floated a 25% tariff on European aluminium. Binary policy risk cuts both ways for Hydro, so position is held and flagged pending a concrete decision rather than traded on the rumour.' },
  ].map((a) => ({ ...a, dotEl: dot(a.dir) }));

  const aiRecos = [
    { ticker: 'KOG', name: 'Kongsberg Gruppen', act: 'BUY', nowTarget: '1 084 → 1 240', up: 14.4, ask: true, reason: 'Add on European defence-budget upcycle; durable order book.' },
    { ticker: 'AKRBP', name: 'Aker BP', act: 'BUY', nowTarget: '258.9 → 285', up: 10.1, ask: true, reason: 'High-beta crude play while shipping-risk premium persists.' },
    { ticker: 'LMT', name: 'Lockheed Martin', act: 'BUY', nowTarget: '$512 → $560', up: 9.3, ask: false, reason: 'US defence budget upcycle; diversifies the defence theme.' },
    { ticker: 'MOWI', name: 'Mowi', act: 'TRIM', nowTarget: '194.3 → 188', up: -3.2, ask: true, reason: 'Reduce on third weekly salmon-price drop and Q3 margin risk.' },
    { ticker: 'NHY', name: 'Norsk Hydro', act: 'HOLD', nowTarget: '68.9 → 72', up: 4.5, ask: true, reason: 'Hold pending Trump aluminium-tariff decision (binary risk).' },
    { ticker: 'SALM', name: 'SalMar', act: 'SELL', nowTarget: '612.5 → exit', up: -4.9, ask: true, reason: 'Exit residual seafood beta; redeploy into defence.' },
  ].map((rc) => ({ ...rc, actEl: actBadge(rc.act), upsideEl: upside(rc.up), askEl: askTag(rc.ask), open: S[rc.ticker] ? open(rc.ticker) : undefined }));

  const portfolioLog = [
    { date: '08 Jul', side: 'BUY', ticker: 'KOG', name: 'Kongsberg', qty: '+140', price: '1 081.0', account: 'Aksjesparekonto' },
    { date: '08 Jul', side: 'BUY', ticker: 'LMT', name: 'Lockheed Martin', qty: '+22', price: '$505.60', account: 'Investeringskonto' },
    { date: '24 Jun', side: 'BUY', ticker: 'AKRBP', name: 'Aker BP', qty: '+310', price: '254.8', account: 'Aksjesparekonto' },
    { date: '24 Jun', side: 'SELL', ticker: 'MOWI', name: 'Mowi', qty: '−180', price: '201.4', account: 'Aksjesparekonto' },
    { date: '12 May', side: 'BUY', ticker: 'XOM', name: 'Exxon Mobil', qty: '+180', price: '$112.10', account: 'Investeringskonto' },
    { date: '12 May', side: 'BUY', ticker: 'NVDA', name: 'NVIDIA', qty: '+60', price: '$154.20', account: 'Investeringskonto' },
    { date: '03 Apr', side: 'BUY', ticker: 'NHY', name: 'Norsk Hydro', qty: '+900', price: '64.10', account: 'Aksjesparekonto' },
  ].map((t) => ({ ...t, sideEl: side(t.side) }));

  const th = thesis()[stock as string];
  const sDrivers = th ? th.drivers.map((d) => ({ ...d, sentEl: sentBadge(d.sent) })) : [];

  const annualReturns = [
    { year: '2017', v: 24.1, bench: '+17.0%' }, { year: '2018', v: -6.2, bench: '−1.8%' },
    { year: '2019', v: 28.4, bench: '+19.2%' }, { year: '2020', v: 12.6, bench: '+4.6%' },
    { year: '2021', v: 33.1, bench: '+23.4%' }, { year: '2022', v: -11.8, bench: '−1.0%' },
    { year: '2023', v: 19.7, bench: '+9.9%' }, { year: '2024', v: 26.3, bench: '+9.1%' },
    { year: '2025', v: 21.5, bench: '+14.2%' }, { year: '2026', v: 18.4, bench: '+11.6%' },
  ].map((y) => ({ ...y, barEl: contribBar(y.v, 35), stratEl: ppVal(y.v) }));

  const insiderTrades = [
    { date: '09 Jul', ticker: 'EQNR', company: 'Equinor', person: 'Torgrim Reitan', role: 'CFO', side: 'BUY', shares: '15 000', value: 'NOK 4.68m', holding: '84 200' },
    { date: '08 Jul', ticker: 'KOG', company: 'Kongsberg Gr.', person: 'Geir Håøy', role: 'CEO', side: 'BUY', shares: '5 000', value: 'NOK 5.42m', holding: '41 500' },
    { date: '08 Jul', ticker: 'DNB', company: 'DNB Bank', person: 'Kjerstin Braathen', role: 'CEO', side: 'BUY', shares: '8 000', value: 'NOK 1.78m', holding: '62 300' },
    { date: '05 Jul', ticker: 'MOWI', company: 'Mowi', person: 'Board member', role: 'Primary insider', side: 'SELL', shares: '40 000', value: 'NOK 7.84m', holding: '0' },
    { date: '04 Jul', ticker: 'NHY', company: 'Norsk Hydro', person: 'Pål Kildemo', role: 'CFO', side: 'BUY', shares: '60 000', value: 'NOK 4.13m', holding: '210 000' },
    { date: '03 Jul', ticker: 'TEL', company: 'Telenor', person: 'Primary insider', role: 'EVP', side: 'SELL', shares: '12 000', value: 'NOK 1.66m', holding: '5 000' },
    { date: '02 Jul', ticker: 'AKRBP', company: 'Aker BP', person: 'Karl Johnny Hersvik', role: 'CEO', side: 'BUY', shares: '10 000', value: 'NOK 2.55m', holding: '120 000' },
    { date: '01 Jul', ticker: 'SALM', company: 'SalMar', person: 'Chair', role: 'Board chair', side: 'BUY', shares: '3 000', value: 'NOK 1.84m', holding: '22 000' },
  ].map((t) => ({ ...t, sideEl: side(t.side), open: S[t.ticker] ? open(t.ticker) : undefined }));

  const riskCfg: Record<RiskLevel, { score: string; net: string; stance: string; cash: string; tilt: string; note: string }> = {
    conservative: { score: '48 / 100', net: '+18', stance: 'Cautious', cash: '15%', tilt: 'Capital-preservation · larger fund & cash core', note: 'Lower beta: single-stock tilts trimmed, more diversified funds and cash.' },
    balanced: { score: '72 / 100', net: '+42', stance: 'Risk-on', cash: '6.5%', tilt: 'Risk-on · tilt to energy & defence', note: 'Default stance: acts on high-conviction signals, keeps a modest cash buffer.' },
    aggressive: { score: '88 / 100', net: '+58', stance: 'Max risk-on', cash: '2%', tilt: 'Max risk-on · concentrated, higher beta', note: 'Higher beta: concentrated energy & defence tilt, minimal cash, faster signal action.' },
  };
  const rc = riskCfg[risk] || riskCfg.balanced;
  const segBase = 'padding:5px 13px; border-radius:6px; font-size:12px; cursor:pointer; color:#8A929E;';
  const segOn = 'padding:5px 13px; border-radius:6px; font-size:12px; cursor:pointer; color:#fff; background:linear-gradient(135deg,#7C5CFF,#4B33C7);';

  const attrEffects = [
    { label: 'Allocation effect', v: 2.6 },
    { label: 'Selection effect', v: 3.4 },
    { label: 'FX effect', v: 1.2 },
    { label: 'Timing / rebalance', v: 0.4 },
    { label: 'Costs & fees', v: -0.8 },
  ].map((e) => ({ ...e, barEl: contribBar(e.v, 4), valEl: ppVal(e.v) }));

  const contribHoldings = [
    { ticker: 'KOG', v: 2.9 }, { ticker: 'EQNR', v: 2.1 }, { ticker: 'NHY', v: 1.6 }, { ticker: 'LMT', v: 1.2 },
    { ticker: 'AKRBP', v: 1.1 }, { ticker: 'NVDA', v: 0.9 }, { ticker: 'XOM', v: 0.6 }, { ticker: 'YAR', v: 0.4 },
    { ticker: 'GLOBAL', v: 0.3 }, { ticker: 'MOWI', v: -1.1 },
  ].map((h) => ({ ...h, barEl: contribBar(h.v, 3), valEl: ppVal(h.v), open: S[h.ticker] ? open(h.ticker) : undefined }));

  const contribThemes = [
    { label: 'Energy', v: 3.8 }, { label: 'Defence', v: 4.1 }, { label: 'Materials', v: 2.0 },
    { label: 'Tech', v: 1.2 }, { label: 'Global fund', v: 0.3 }, { label: 'Seafood', v: -1.1 },
  ].map((t) => ({ ...t, barEl: contribBar(t.v, 4.5), valEl: ppVal(t.v) }));

  const fxBreakdown = [
    { label: 'NOK — Norwegian krone', value: 'NOK 771 000', pct: 60, pctLabel: '60%', color: '#3DBB84' },
    { label: 'USD — US dollar', value: 'NOK 295 000', pct: 23, pctLabel: '23%', color: '#2F6E90' },
    { label: 'Global fund (basket)', value: 'NOK 141 000', pct: 11, pctLabel: '11%', color: '#7C5CFF' },
    { label: 'DNB Tek (USD look-through)', value: 'NOK 77 000', pct: 6, pctLabel: '6%', color: '#C79A3D' },
  ].map((c) => ({ ...c, dotEl: swatch(c.color) }));

  const fxHoldings = [
    { ticker: 'EQNR', name: 'Equinor', ccy: 'NOK', weight: '15%', value: '192 675', risk: 'None' },
    { ticker: 'NHY', name: 'Norsk Hydro', ccy: 'NOK', weight: '10%', value: '128 450', risk: 'None' },
    { ticker: 'KOG', name: 'Kongsberg Gr.', ccy: 'NOK', weight: '12%', value: '154 140', risk: 'None' },
    { ticker: 'LMT', name: 'Lockheed Martin', ccy: 'USD', weight: '9%', value: '115 605', risk: 'High' },
    { ticker: 'XOM', name: 'Exxon Mobil', ccy: 'USD', weight: '8%', value: '102 760', risk: 'High' },
    { ticker: 'NVDA', name: 'NVIDIA', ccy: 'USD', weight: '6%', value: '77 070', risk: 'High' },
    { ticker: 'GLOBAL', name: 'Nordnet Global', ccy: 'Mixed', weight: '11%', value: '141 295', risk: 'Medium' },
    { ticker: 'DNBTEK', name: 'DNB Teknologi', ccy: 'Mixed', weight: '6%', value: '77 070', risk: 'Medium' },
    { ticker: 'AKRBP', name: 'Aker BP', ccy: 'NOK', weight: '8%', value: '102 760', risk: 'None' },
    { ticker: 'MOWI', name: 'Mowi', ccy: 'NOK', weight: '9%', value: '115 605', risk: 'None' },
  ].map((h) => ({ ...h, ccyEl: ccyPill(h.ccy), riskEl: fxRisk(h.risk), open: S[h.ticker] ? open(h.ticker) : undefined }));

  const divs = [
    { ticker: 'EQNR', ex: '05 Aug', amount: 'NOK 3.90', yield: '4.9%' },
    { ticker: 'AKRBP', ex: '12 Aug', amount: 'NOK 5.60', yield: '5.4%' },
    { ticker: 'KOG', ex: '20 Aug', amount: 'NOK 12.50', yield: '2.3%' },
    { ticker: 'XOM', ex: '08 Aug', amount: '$0.99', yield: '3.3%' },
  ];
  const holdingReports = [
    { ticker: 'EQNR', period: 'Q2 2026 results', date: '22 Jul' },
    { ticker: 'YAR', period: 'Q2 2026 results', date: '25 Jul' },
    { ticker: 'MOWI', period: 'Q2 2026 results', date: '28 Jul' },
    { ticker: 'AKRBP', period: 'Q2 2026 results', date: '30 Jul' },
  ].map((r) => ({ ...r, open: S[r.ticker] ? open(r.ticker) : undefined }));

  const rbBase = 'flex:0 0 auto; border:1px solid #23272E; border-radius:8px; padding:8px 11px; cursor:pointer;';
  const rbActive = 'flex:0 0 auto; border:1px solid #7C5CFF; background:#181233; border-radius:8px; padding:8px 11px; cursor:pointer;';
  const rebalData = [
    { date: '08 Jul', changes: '+KOG +LMT', delta: 0.9, trigType: 'Breaking signal',
      condition: 'defence_signal_score ≥ +15  ∧  conviction ≥ 65',
      reasoning: 'A breaking defence signal (European members pledging higher budgets) pushed the defence factor score above the +15 trigger while overall conviction stayed risk-on. The model tilted into the theme intraday rather than waiting for the daily run.',
      actions: [{ dir: 1, text: 'Bought Kongsberg', detail: '+2.0% → 12.0%' }, { dir: 1, text: 'Opened Lockheed Martin', detail: '+9.0% · outside ASK' }] },
    { date: '24 Jun', changes: '+AKRBP −MOWI', delta: 0.6, trigType: 'Signal + risk band',
      condition: 'crude_risk_premium = ON  ∧  seafood_momentum_3w < −5%',
      reasoning: 'Shipping reroutes near Hormuz switched the crude supply-risk premium on, while salmon 3-week momentum broke below −5%. The model funded added energy beta by trimming the weakest-momentum diversifier.',
      actions: [{ dir: 1, text: 'Added Aker BP', detail: '+1.5%' }, { dir: -1, text: 'Trimmed Mowi', detail: '−1.0%' }] },
    { date: '12 May', changes: '+XOM +NVDA', delta: -0.2, trigType: 'Scheduled monthly',
      condition: 'calendar = monthly 08:00  →  diversify geography & factor',
      reasoning: 'The scheduled monthly rebalance flagged the book as too concentrated in NOK and value. The model added US energy and growth exposure to broaden geography and factor balance; small negative same-day mark as it bought into strength.',
      actions: [{ dir: 1, text: 'Opened Exxon Mobil', detail: '+8.0% · outside ASK' }, { dir: 1, text: 'Opened NVIDIA', detail: '+6.0% · outside ASK' }] },
    { date: '03 Apr', changes: '+NHY, deploy cash', delta: 1.3, trigType: 'Threshold band',
      condition: 'cash_weight > 8% target band  →  deploy',
      reasoning: 'Cash had drifted above the 8% upper band after dividends landed. The threshold rule redeployed the excess into the highest-conviction underweight (materials) rather than holding idle cash.',
      actions: [{ dir: 1, text: 'Bought Norsk Hydro', detail: '+3.0%' }, { dir: 0, text: 'Cash reduced', detail: '11.2% → 6.5%' }] },
    { date: '21 Feb', changes: 'Initial build', delta: null, trigType: 'Inception',
      condition: 'model cold-start from baseline signal weights',
      reasoning: 'First allocation. The model seeded the portfolio from baseline macro & geopolitical signal weights, establishing the energy / defence tilt and the diversified fund core.',
      actions: [{ dir: 0, text: 'Initial 10-line allocation', detail: '93.5% invested' }] },
  ];
  const rebalEvents = rebalData.map((rb, i) => ({
    date: rb.date, changes: rb.changes, deltaEl: deltaBadge(rb.delta),
    cardStyle: rbEvent === i ? rbActive : rbBase,
    select: () => setRbEvent((prev) => (prev === i ? null : i)),
  }));
  const rbSelRaw = rbEvent != null ? rebalData[rbEvent] : null;
  const rbSel = rbSelRaw
    ? {
        date: rbSelRaw.date, trigType: rbSelRaw.trigType, condition: rbSelRaw.condition, reasoning: rbSelRaw.reasoning,
        deltaEl: deltaBadge(rbSelRaw.delta),
        actions: rbSelRaw.actions.map((a) => ({ text: a.text, detail: a.detail, dotEl: dot(a.dir) })),
      }
    : { date: '', trigType: '', condition: '', reasoning: '', deltaEl: null, actions: [] as { text: string; detail: string; dotEl: React.ReactNode }[] };

  const sectorExp = [
    { label: 'Energy', val: '31%', pct: 31, color: '#3DBB84' },
    { label: 'Defence', val: '21%', pct: 21, color: '#7C5CFF' },
    { label: 'Materials', val: '16%', pct: 16, color: '#C79A3D' },
    { label: 'Tech', val: '11%', pct: 11, color: '#2F6E90' },
    { label: 'Global fund', val: '11%', pct: 11, color: '#4E9E8A' },
    { label: 'Seafood', val: '9%', pct: 9, color: '#B85C54' },
  ].map((e) => ({ ...e, barEl: hbar(e.pct, e.color) }));

  const concExp = [
    { label: 'EQNR', val: '15%', pct: 75 },
    { label: 'KOG', val: '12%', pct: 60 },
    { label: 'NHY', val: '10%', pct: 50 },
    { label: 'LMT', val: '9%', pct: 45 },
    { label: 'MOWI', val: '9%', pct: 45 },
    { label: 'AKRBP', val: '8%', pct: 40 },
  ].map((e) => ({ ...e, barEl: hbar(e.pct, '#6FA8FF') }));

  const scenarios = [
    { name: 'Trump 25% EU metals tariff', how: 'European aluminium exporters de-rate; input-cost noise across materials.', v: -1.8, hit: 'NHY · YAR' },
    { name: 'Mideast ceasefire', how: 'Crude risk premium unwinds; energy and defence give back gains.', v: -2.4, hit: 'EQNR · KOG · XOM' },
    { name: 'Oil +10% supply shock', how: 'Higher crude lifts producers and oil-services leverage.', v: 2.9, hit: 'AKRBP · EQNR · XOM' },
    { name: 'Norges Bank surprise hold', how: 'Rate-cut hopes fade; long-duration growth and funds soften.', v: -0.9, hit: 'NVDA · DNBTEK' },
    { name: 'Broad risk-off (−5% equities)', how: 'Beta 1.18 amplifies a market-wide drawdown.', v: -5.9, hit: 'All beta' },
    { name: 'US–China trade deal', how: 'Global risk appetite improves; diversified beta rallies.', v: 1.6, hit: 'GLOBAL · NVDA' },
  ].map((sc) => ({ ...sc, impactEl: scImpact(sc.v) }));

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
  const convScore = rc.score, convTilt = rc.tilt, convNet = rc.net, convStance = rc.stance, cashPct = rc.cash, riskNote = rc.note;
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
  const sSym = stock || 'EQNR', sName = cur.name, sLast = cur.last, sOpen = cur.open, sRange = cur.range, sVol = cur.vol, sCap = cur.cap;
  const sCur = cur.cur || 'NOK', sChgEl = chgEl(cur.chg, 14);
  const sHasThesis = !!th;
  const sThesis = th ? th.text : '', sSize = th ? th.size : '', sTarget = th ? th.target : '', sSince = th ? th.since : '', sRole = th ? th.role : '';
  const sUpsideEl = upside(th ? th.upside : 0);
  const sRecoEl = actBadge(th ? th.reco : 'HOLD');
  const sRisks = th ? th.risks : [];

  return (


<div style={css("height:100vh; display:flex; flex-direction:column; background:#14171B; color:#D5D9E0;")}>

  
  <div style={css("display:flex; align-items:center; gap:20px; padding:0 18px; height:48px; background:#0E1013; border-bottom:1px solid #23272E; flex:0 0 auto;")}>
    <div style={css("display:flex; align-items:center; gap:9px;")}>
      <div style={css("width:16px; height:16px; border-radius:50%; background:radial-gradient(circle at 30% 30%, #6FA8FF, #2D5BD0);")}></div>
      <span style={css("font-weight:600; font-size:14px; letter-spacing:0.02em; color:#F2F4F7;")}>NORDLYS</span>
    </div>
    <div style={css("display:flex; gap:2px;")}>
      <span onClick={goMarkets} style={css(navMarkets)}>Markets</span>
      <span onClick={goWatch} style={css(navWatch)}>Watchlist</span>
      <span onClick={goNews} style={css(navNews)}>News</span>
      <span onClick={goReports} style={css(navReports)}>Reports</span>
      <span onClick={goAlerts} style={css(navAlerts)}>Alerts</span>
      <span onClick={goAI} style={css(navAI)}>AI Portfolio</span>
      <span onClick={goRisk} style={css(navRisk)}>Risk</span>
      <span onClick={goFx} style={css(navFx)}>Currency</span>
      <span onClick={goAttr} style={css(navAttr)}>Attribution</span>
      <span onClick={goIns} style={css(navIns)}>Insider</span>
      <span onClick={goBt} style={css(navBt)}>Backtest</span>
    </div>
    <div style={css("flex:1;")}></div>
    <div style={css("display:flex; align-items:center; gap:8px; background:#191D24; border:1px solid #23272E; border-radius:7px; padding:6px 11px; width:220px; color:#5B626C; font-size:12.5px;")}>
      <span className="mono">⌕</span> Search symbol…
    </div>
    <div className="mono" style={css("display:flex; align-items:center; gap:6px; font-size:11.5px; color:#8A929E;")}>
      <span style={css("width:7px; height:7px; border-radius:50%; background:#0E8A5F; box-shadow:0 0 0 3px rgba(14,138,95,0.18);")}></span>
      OSLO OPEN · 14:32 CET
    </div>
    <div style={css("width:28px; height:28px; border-radius:50%; background:#2A2F37; display:flex; align-items:center; justify-content:center; font-size:11px; color:#C6CCD4;")}>JA</div>
  </div>

  
  <div className="mono" style={css("display:flex; align-items:center; height:34px; background:#0B0D10; border-bottom:1px solid #23272E; padding:0 4px; flex:0 0 auto; overflow:hidden;")}>
    <div style={css("display:flex; align-items:baseline; gap:7px; padding:0 16px; border-right:1px solid #1D2229; font-size:12px;")}><span style={css("color:#8A929E;")}>OSEBX</span><span style={css("color:#F2F4F7;")}>1 486.20</span><span style={css("color:#3DBB84;")}>+0.62%</span></div>
    <div style={css("display:flex; align-items:baseline; gap:7px; padding:0 16px; border-right:1px solid #1D2229; font-size:12px;")}><span style={css("color:#8A929E;")}>OBX</span><span style={css("color:#F2F4F7;")}>1 342.55</span><span style={css("color:#3DBB84;")}>+0.71%</span></div>
    <div style={css("display:flex; align-items:baseline; gap:7px; padding:0 16px; border-right:1px solid #1D2229; font-size:12px;")}><span style={css("color:#8A929E;")}>USD/NOK</span><span style={css("color:#F2F4F7;")}>10.612</span><span style={css("color:#E4655E;")}>-0.18%</span></div>
    <div style={css("display:flex; align-items:baseline; gap:7px; padding:0 16px; border-right:1px solid #1D2229; font-size:12px;")}><span style={css("color:#8A929E;")}>EUR/NOK</span><span style={css("color:#F2F4F7;")}>11.481</span><span style={css("color:#E4655E;")}>-0.09%</span></div>
    <div style={css("display:flex; align-items:baseline; gap:7px; padding:0 16px; border-right:1px solid #1D2229; font-size:12px;")}><span style={css("color:#8A929E;")}>BRENT</span><span style={css("color:#F2F4F7;")}>$82.14</span><span style={css("color:#3DBB84;")}>+1.04%</span></div>
    <div style={css("display:flex; align-items:baseline; gap:7px; padding:0 16px; font-size:12px;")}><span style={css("color:#8A929E;")}>GOLD</span><span style={css("color:#F2F4F7;")}>$2 388</span><span style={css("color:#3DBB84;")}>+0.31%</span></div>
  </div>

  
  <div style={css("flex:1; position:relative; min-height:0;")}>

    
    {isMarkets && (<>
    <div data-screen-label="Markets" style={css("position:absolute; inset:0; display:grid; grid-template-columns:340px 1fr 356px; min-height:0;")}>
      
      <div style={css("border-right:1px solid #23272E; display:flex; flex-direction:column; min-height:0;")}>
        <div style={css("display:flex; align-items:center; justify-content:space-between; padding:11px 14px; border-bottom:1px solid #23272E;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Watchlist</span>
          <span className="mono" style={css("font-size:11px; color:#5B626C;")}>9 · NOK</span>
        </div>
        <div className="mono" style={css("display:grid; grid-template-columns:52px 1fr 66px 62px; gap:6px; padding:6px 14px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #1A1E24;")}>
          <span>Ticker</span><span></span><span style={css("text-align:right;")}>Last</span><span style={css("text-align:right;")}>Chg</span>
        </div>
        <div style={css("overflow-y:auto; flex:1;")}>
          {watchlist.map((row, i) => (<React.Fragment key={i}>
            <div onClick={row.open} style={css("display:grid; grid-template-columns:52px 1fr 66px 62px; gap:6px; align-items:center; padding:8px 14px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-a">
              <span className="mono" style={css("font-weight:600; color:#F2F4F7; font-size:12.5px;")}>{row.ticker}</span>
              <span style={css("color:#7C8492; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;")}>{row.name}</span>
              <span className="mono" style={css("text-align:right; color:#EDEFF2; font-size:12.5px;")}>{row.last}</span>
              <span className="mono" style={css("text-align:right; font-size:12px;")} >{row.chg}</span>
            </div>
          </React.Fragment>))}
        </div>
        <div style={css("padding:10px 14px; border-top:1px solid #23272E; font-size:11px; color:#5B626C; display:flex; justify-content:space-between;")}>
          <span style={css("cursor:pointer;")}>+ Add symbol</span><span className="mono" style={css("cursor:pointer;")}>Edit</span>
        </div>
      </div>

      
      <div style={css("border-right:1px solid #23272E; display:flex; flex-direction:column; min-height:0; overflow-y:auto;")}>
        <div style={css("padding:14px 18px 10px; border-bottom:1px solid #23272E;")}>
          <div style={css("display:flex; align-items:baseline; gap:12px;")}>
            <span style={css("font-size:16px; font-weight:600; color:#F2F4F7;")}>OSEBX</span>
            <span style={css("font-size:12px; color:#8A929E;")}>Oslo Børs Benchmark Index</span>
            <div style={css("flex:1;")}></div>
            <div className="mono" style={css("display:flex; gap:3px; font-size:11px;")}>
              <span style={css("padding:3px 8px; border-radius:4px; color:#8A929E; cursor:pointer;")}>1D</span>
              <span style={css("padding:3px 8px; border-radius:4px; background:#1D2229; color:#fff; cursor:pointer;")}>1W</span>
              <span style={css("padding:3px 8px; border-radius:4px; color:#8A929E; cursor:pointer;")}>1M</span>
              <span style={css("padding:3px 8px; border-radius:4px; color:#8A929E; cursor:pointer;")}>1Y</span>
            </div>
          </div>
          <div style={css("display:flex; align-items:baseline; gap:10px; margin-top:6px;")}>
            <span className="mono" style={css("font-size:26px; font-weight:600; color:#F2F4F7;")}>1 486.20</span>
            <span className="mono" style={css("font-size:13px; color:#3DBB84;")}>+9.14 (+0.62%)</span>
          </div>
        </div>
        <div style={css("padding:6px 6px 0;")}>
          <svg viewBox="0 0 700 210" preserveAspectRatio="none" style={css("width:100%; height:210px; display:block;")}>
            <defs><linearGradient id="mkgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3DBB84" stopOpacity="0.28"/><stop offset="100%" stopColor="#3DBB84" stopOpacity="0"/></linearGradient></defs>
            <line x1="0" y1="52" x2="700" y2="52" stroke="#20242B" strokeWidth="1"/>
            <line x1="0" y1="105" x2="700" y2="105" stroke="#20242B" strokeWidth="1"/>
            <line x1="0" y1="158" x2="700" y2="158" stroke="#20242B" strokeWidth="1"/>
            <path d="M0,150 L46,140 L93,156 L140,120 L186,132 L233,101 L280,112 L326,80 L373,96 L420,70 L466,86 L513,54 L560,66 L606,44 L653,52 L700,30 L700,210 L0,210 Z" fill="url(#mkgrad)"/>
            <polyline points="0,150 46,140 93,156 140,120 186,132 233,101 280,112 326,80 373,96 420,70 466,86 513,54 560,66 606,44 653,52 700,30" fill="none" stroke="#3DBB84" strokeWidth="2"/>
          </svg>
        </div>
        <div style={css("padding:12px 18px 8px; border-top:1px solid #23272E;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Sectors today</span>
          <div style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-top:9px;")}>
            <div style={css("background:#12583C; border-radius:5px; padding:9px 10px;")}><div style={css("font-size:11px; color:#C8E6D8;")}>Energy</div><div className="mono" style={css("font-size:14px; font-weight:600; color:#fff;")}>+1.41%</div></div>
            <div style={css("background:#134C36; border-radius:5px; padding:9px 10px;")}><div style={css("font-size:11px; color:#C8E6D8;")}>Materials</div><div className="mono" style={css("font-size:14px; font-weight:600; color:#fff;")}>+0.92%</div></div>
            <div style={css("background:#1B2C27; border-radius:5px; padding:9px 10px;")}><div style={css("font-size:11px; color:#9FB4AB;")}>Financials</div><div className="mono" style={css("font-size:14px; font-weight:600; color:#DCEBE3;")}>+0.34%</div></div>
            <div style={css("background:#4A2320; border-radius:5px; padding:9px 10px;")}><div style={css("font-size:11px; color:#EBC9C6;")}>Seafood</div><div className="mono" style={css("font-size:14px; font-weight:600; color:#fff;")}>-0.88%</div></div>
            <div style={css("background:#123F31; border-radius:5px; padding:9px 10px;")}><div style={css("font-size:11px; color:#B9D6C8;")}>Industrials</div><div className="mono" style={css("font-size:14px; font-weight:600; color:#fff;")}>+0.58%</div></div>
            <div style={css("background:#5A2A26; border-radius:5px; padding:9px 10px;")}><div style={css("font-size:11px; color:#EBC9C6;")}>Telecom</div><div className="mono" style={css("font-size:14px; font-weight:600; color:#fff;")}>-0.41%</div></div>
            <div style={css("background:#1B2C27; border-radius:5px; padding:9px 10px;")}><div style={css("font-size:11px; color:#9FB4AB;")}>Shipping</div><div className="mono" style={css("font-size:14px; font-weight:600; color:#DCEBE3;")}>+0.12%</div></div>
            <div style={css("background:#11543A; border-radius:5px; padding:9px 10px;")}><div style={css("font-size:11px; color:#C8E6D8;")}>Tech</div><div className="mono" style={css("font-size:14px; font-weight:600; color:#fff;")}>+1.06%</div></div>
          </div>
        </div>
        <div style={css("display:grid; grid-template-columns:1fr 1fr; border-top:1px solid #23272E;")}>
          <div style={css("border-right:1px solid #23272E; padding:11px 16px;")}>
            <span style={css("font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#3DBB84; font-weight:600;")}>▲ Top gainers</span>
            <div className="mono" style={css("margin-top:8px; font-size:12px;")}>
              <div style={css("display:flex; justify-content:space-between; padding:4px 0;")}><span style={css("color:#EDEFF2;")}>NHY</span><span style={css("color:#3DBB84;")}>+2.08%</span></div>
              <div style={css("display:flex; justify-content:space-between; padding:4px 0;")}><span style={css("color:#EDEFF2;")}>AKRBP</span><span style={css("color:#3DBB84;")}>+1.62%</span></div>
              <div style={css("display:flex; justify-content:space-between; padding:4px 0;")}><span style={css("color:#EDEFF2;")}>EQNR</span><span style={css("color:#3DBB84;")}>+1.24%</span></div>
              <div style={css("display:flex; justify-content:space-between; padding:4px 0;")}><span style={css("color:#EDEFF2;")}>TOM</span><span style={css("color:#3DBB84;")}>+1.11%</span></div>
            </div>
          </div>
          <div style={css("padding:11px 16px;")}>
            <span style={css("font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#E4655E; font-weight:600;")}>▼ Top losers</span>
            <div className="mono" style={css("margin-top:8px; font-size:12px;")}>
              <div style={css("display:flex; justify-content:space-between; padding:4px 0;")}><span style={css("color:#EDEFF2;")}>MOWI</span><span style={css("color:#E4655E;")}>-1.15%</span></div>
              <div style={css("display:flex; justify-content:space-between; padding:4px 0;")}><span style={css("color:#EDEFF2;")}>SALM</span><span style={css("color:#E4655E;")}>-0.74%</span></div>
              <div style={css("display:flex; justify-content:space-between; padding:4px 0;")}><span style={css("color:#EDEFF2;")}>FRO</span><span style={css("color:#E4655E;")}>-0.52%</span></div>
              <div style={css("display:flex; justify-content:space-between; padding:4px 0;")}><span style={css("color:#EDEFF2;")}>TEL</span><span style={css("color:#E4655E;")}>-0.32%</span></div>
            </div>
          </div>
        </div>
      </div>

      
      <div style={css("display:flex; flex-direction:column; min-height:0;")}>
        <div style={css("display:flex; align-items:center; justify-content:space-between; padding:11px 14px; border-bottom:1px solid #23272E;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Newsflow</span>
          <span className="mono" style={css("font-size:11px; color:#5B626C;")}>Live</span>
        </div>
        <div style={css("overflow-y:auto; flex:1;")}>
          <div style={css("padding:11px 14px; border-bottom:1px solid #191D23;")}><div className="mono" style={css("display:flex; gap:8px; font-size:10.5px; color:#5B626C; margin-bottom:4px;")}><span style={css("color:#6FA8FF;")}>EQNR</span><span>14:21</span><span style={css("color:#8A929E;")}>Reuters</span></div><div style={css("font-size:12.5px; line-height:1.4; color:#DDE1E7;")}>Equinor lifts quarterly dividend, announces new $1.2bn buyback tranche</div></div>
          <div style={css("padding:11px 14px; border-bottom:1px solid #191D23;")}><div className="mono" style={css("display:flex; gap:8px; font-size:10.5px; color:#5B626C; margin-bottom:4px;")}><span style={css("color:#6FA8FF;")}>NHY</span><span>13:58</span><span style={css("color:#8A929E;")}>E24</span></div><div style={css("font-size:12.5px; line-height:1.4; color:#DDE1E7;")}>Norsk Hydro raises aluminium output guidance on stronger European demand</div></div>
          <div style={css("padding:11px 14px; border-bottom:1px solid #191D23;")}><div className="mono" style={css("display:flex; gap:8px; font-size:10.5px; color:#5B626C; margin-bottom:4px;")}><span style={css("color:#6FA8FF;")}>MOWI</span><span>13:40</span><span style={css("color:#8A929E;")}>DN</span></div><div style={css("font-size:12.5px; line-height:1.4; color:#DDE1E7;")}>Mowi shares slip as salmon spot prices fall for a third straight week</div></div>
          <div style={css("padding:11px 14px; border-bottom:1px solid #191D23;")}><div className="mono" style={css("display:flex; gap:8px; font-size:10.5px; color:#5B626C; margin-bottom:4px;")}><span style={css("color:#6FA8FF;")}>DNB</span><span>12:55</span><span style={css("color:#8A929E;")}>Bloomberg</span></div><div style={css("font-size:12.5px; line-height:1.4; color:#DDE1E7;")}>DNB reiterates 2026 return-on-equity target ahead of Q2 report</div></div>
          <div style={css("padding:11px 14px; border-bottom:1px solid #191D23;")}><div className="mono" style={css("display:flex; gap:8px; font-size:10.5px; color:#5B626C; margin-bottom:4px;")}><span style={css("color:#6FA8FF;")}>MKT</span><span>12:30</span><span style={css("color:#8A929E;")}>E24</span></div><div style={css("font-size:12.5px; line-height:1.4; color:#DDE1E7;")}>Oslo Børs opens higher as Brent crude rebounds above $82</div></div>
        </div>
        <div style={css("border-top:1px solid #23272E;")}>
          <div style={css("padding:11px 14px 8px;")}><span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Triggered alerts</span></div>
          <div style={css("padding:9px 14px; display:flex; align-items:center; gap:10px; border-top:1px solid #191D23;")}><span style={css("width:8px; height:8px; border-radius:2px; background:#3DBB84; flex:0 0 auto;")}></span><span className="mono" style={css("font-size:12px; color:#EDEFF2;")}>EQNR</span><span style={css("font-size:12px; color:#9AA1AC;")}>crossed above 310.00</span><span className="mono" style={css("margin-left:auto; font-size:11px; color:#5B626C;")}>14:02</span></div>
          <div style={css("padding:9px 14px; display:flex; align-items:center; gap:10px; border-top:1px solid #191D23;")}><span style={css("width:8px; height:8px; border-radius:2px; background:#E4655E; flex:0 0 auto;")}></span><span className="mono" style={css("font-size:12px; color:#EDEFF2;")}>MOWI</span><span style={css("font-size:12px; color:#9AA1AC;")}>fell below 195.00</span><span className="mono" style={css("margin-left:auto; font-size:11px; color:#5B626C;")}>13:41</span></div>
        </div>
      </div>
    </div>
    </>)}

    
    {isWatch && (<>
    <div data-screen-label="Watchlist" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:18px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Watchlist</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>9 instruments · Oslo Børs · NOK</span>
        <div style={css("flex:1;")}></div>
        <button style={css("border:1px solid #2D5BD0; background:#2D5BD0; color:#fff; font-size:12.5px; font-weight:500; padding:7px 14px; border-radius:7px; cursor:pointer; font-family:inherit;")}>＋ Add symbol</button>
      </div>
      <div style={css("border:1px solid #23272E; border-radius:10px; overflow:hidden; background:#101317;")}>
        <div className="mono" style={css("display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1.4fr 100px; gap:10px; padding:10px 18px; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #23272E; background:#0E1013;")}>
          <span>Symbol</span><span style={css("text-align:right;")}>Last</span><span style={css("text-align:right;")}>Chg %</span><span style={css("text-align:right;")}>Bid</span><span style={css("text-align:right;")}>Ask</span><span style={css("text-align:right;")}>Volume</span><span style={css("text-align:right;")}>Day range</span><span style={css("text-align:right;")}>7d</span>
        </div>
        {watchFull.map((r, i) => (<React.Fragment key={i}>
          <div onClick={r.open} style={css("display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1.4fr 100px; gap:10px; align-items:center; padding:12px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
            <div><span className="mono" style={css("font-weight:600; font-size:13.5px; color:#F2F4F7;")}>{r.ticker}</span> <span style={css("font-size:12px; color:#7C8492;")}>{r.name}</span></div>
            <span className="mono" style={css("text-align:right; font-size:13.5px; color:#EDEFF2;")}>{r.last}</span>
            <span className="mono" style={css("text-align:right; font-size:13px;")}>{r.chg}</span>
            <span className="mono" style={css("text-align:right; font-size:13px; color:#9AA1AC;")}>{r.bid}</span>
            <span className="mono" style={css("text-align:right; font-size:13px; color:#9AA1AC;")}>{r.ask}</span>
            <span className="mono" style={css("text-align:right; font-size:13px; color:#9AA1AC;")}>{r.vol}</span>
            <span className="mono" style={css("text-align:right; font-size:12.5px; color:#7C8492;")}>{r.range}</span>
            <span style={css("justify-self:end;")}>{r.sparkEl}</span>
          </div>
        </React.Fragment>))}
      </div>
    </div>
    </>)}

    
    {isNews && (<>
    <div data-screen-label="News" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:16px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Newsflow</h2>
        <div style={css("flex:1;")}></div>
        <div className="mono" style={css("display:flex; gap:4px; font-size:11.5px;")}>
          <span style={css("padding:5px 11px; border-radius:6px; background:#1D2229; color:#fff; cursor:pointer;")}>All</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Watchlist</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Macro</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Insider</span>
        </div>
      </div>
      <div style={css("display:grid; grid-template-columns:1.4fr 1fr; gap:22px; align-items:start;")}>
        
        <div>
          <div style={css("border:1px solid #23272E; border-radius:12px; overflow:hidden; background:#101317;")}>
            <div style={css("height:170px; background:repeating-linear-gradient(135deg,#171B21,#171B21 11px,#1B2027 11px,#1B2027 22px); display:flex; align-items:flex-end; padding:16px;")}><span className="mono" style={css("font-size:11px; color:#4E5661;")}>[ lead image — Equinor Q2 ]</span></div>
            <div style={css("padding:18px 20px;")}>
              <div className="mono" style={css("display:flex; gap:9px; font-size:11px; color:#5B626C; margin-bottom:8px;")}><span style={css("color:#6FA8FF;")}>EQNR</span><span>Reuters</span><span>14:21 · today</span></div>
              <div style={css("font-size:18px; font-weight:600; line-height:1.35; color:#F2F4F7;")}>Equinor lifts quarterly dividend and unveils $1.2bn buyback as cash flow beats</div>
              <p style={css("font-size:13.5px; line-height:1.55; color:#9AA1AC; margin:10px 0 0;")}>The Norwegian energy major raised its ordinary dividend to $0.37 per share and launched a fresh buyback tranche, citing resilient gas prices and lower capex guidance for the second half.</p>
            </div>
          </div>
          <div style={css("margin-top:16px; border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            {newsList.map((n, i) => (<React.Fragment key={i}>
              <div style={css("display:flex; gap:14px; padding:14px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
                <div style={css("width:64px; height:52px; border-radius:7px; background:repeating-linear-gradient(135deg,#171B21,#171B21 7px,#1B2027 7px,#1B2027 14px); flex:0 0 auto;")}></div>
                <div style={css("min-width:0;")}>
                  <div className="mono" style={css("display:flex; gap:8px; font-size:10.5px; color:#5B626C; margin-bottom:4px;")}><span style={css("color:#6FA8FF;")}>{n.ticker}</span><span>{n.source}</span><span>{n.time}</span></div>
                  <div style={css("font-size:13.5px; line-height:1.4; color:#DDE1E7; font-weight:500;")}>{n.title}</div>
                </div>
              </div>
            </React.Fragment>))}
          </div>
        </div>
        
        <div style={css("display:flex; flex-direction:column; gap:16px;")}>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Most read</span>
            <div style={css("margin-top:12px; display:flex; flex-direction:column; gap:14px;")}>
              <div style={css("display:flex; gap:12px;")}><span className="mono" style={css("font-size:16px; color:#3A414B; font-weight:600;")}>01</span><span style={css("font-size:13px; line-height:1.4; color:#DDE1E7;")}>Kongsberg wins NOK 4.3bn defence contract from NATO partner</span></div>
              <div style={css("display:flex; gap:12px;")}><span className="mono" style={css("font-size:16px; color:#3A414B; font-weight:600;")}>02</span><span style={css("font-size:13px; line-height:1.4; color:#DDE1E7;")}>Aker BP raises 2026 production guidance after Yggdrasil ramp-up</span></div>
              <div style={css("display:flex; gap:12px;")}><span className="mono" style={css("font-size:16px; color:#3A414B; font-weight:600;")}>03</span><span style={css("font-size:13px; line-height:1.4; color:#DDE1E7;")}>Norges Bank holds policy rate at 4.25%, signals cut in autumn</span></div>
              <div style={css("display:flex; gap:12px;")}><span className="mono" style={css("font-size:16px; color:#3A414B; font-weight:600;")}>04</span><span style={css("font-size:13px; line-height:1.4; color:#DDE1E7;")}>Salmon exporters warn of margin squeeze into Q3</span></div>
            </div>
          </div>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Macro watch</span>
            <div className="mono" style={css("margin-top:12px; font-size:12.5px;")}>
              <div style={css("display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #191D23;")}><span style={css("color:#DDE1E7;")}>Norges Bank rate</span><span style={css("color:#F2F4F7;")}>4.25%</span></div>
              <div style={css("display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #191D23;")}><span style={css("color:#DDE1E7;")}>CPI (YoY)</span><span style={css("color:#F2F4F7;")}>3.1%</span></div>
              <div style={css("display:flex; justify-content:space-between; padding:7px 0;")}><span style={css("color:#DDE1E7;")}>10y NOK gov bond</span><span style={css("color:#F2F4F7;")}>3.62%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>)}

    
    {isReports && (<>
    <div data-screen-label="Reports" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:18px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Reports &amp; earnings</h2>
        <div style={css("flex:1;")}></div>
        <div className="mono" style={css("display:flex; gap:4px; font-size:11.5px;")}>
          <span style={css("padding:5px 11px; border-radius:6px; background:#1D2229; color:#fff; cursor:pointer;")}>Calendar</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Latest filings</span>
        </div>
      </div>
      <div style={css("display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start;")}>
        
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
          <div style={css("padding:14px 18px; border-bottom:1px solid #23272E; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Upcoming — July 2026</div>
          {calendar.map((c, i) => (<React.Fragment key={i}>
            <div style={css("display:flex; align-items:center; gap:14px; padding:13px 18px; border-bottom:1px solid #191D23;")}>
              <div style={css("width:46px; text-align:center; flex:0 0 auto;")}><div className="mono" style={css("font-size:17px; font-weight:600; color:#F2F4F7;")}>{c.day}</div><div style={css("font-size:10px; color:#5B626C; text-transform:uppercase;")}>Jul</div></div>
              <div style={css("flex:1;")}><div style={css("font-size:13.5px; font-weight:500; color:#EDEFF2;")}>{c.name}</div><div style={css("font-size:11.5px; color:#7C8492;")}>{c.when}</div></div>
              <span className="mono" style={css("font-size:11px; color:#6FA8FF;")}>{c.ticker}</span>
              <span style={css("font-size:10.5px; color:#5B626C; border:1px solid #2A2F37; border-radius:20px; padding:2px 9px;")}>{c.period}</span>
            </div>
          </React.Fragment>))}
        </div>
        
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
          <div style={css("padding:16px 20px; border-bottom:1px solid #23272E;")}>
            <div style={css("display:flex; align-items:center; gap:10px;")}><span className="mono" style={css("font-weight:600; font-size:15px; color:#F2F4F7;")}>DNB</span><span style={css("font-size:13px; color:#8A929E;")}>DNB Bank ASA · Q1 2026</span><span style={css("margin-left:auto; font-size:10.5px; color:#3DBB84; border:1px solid #1F5C43; border-radius:20px; padding:2px 9px;")}>Beat</span></div>
          </div>
          <div style={css("padding:18px 20px;")}>
            <div style={css("display:grid; grid-template-columns:1fr 1fr; gap:16px;")}>
              <div><div style={css("font-size:11.5px; color:#7C8492;")}>Net interest income</div><div className="mono" style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin-top:3px;")}>NOK 16.1bn</div><div className="mono" style={css("font-size:11.5px; color:#3DBB84; margin-top:2px;")}>+6.2% YoY</div></div>
              <div><div style={css("font-size:11.5px; color:#7C8492;")}>Profit after tax</div><div className="mono" style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin-top:3px;")}>NOK 9.4bn</div><div className="mono" style={css("font-size:11.5px; color:#3DBB84; margin-top:2px;")}>+4.1% YoY</div></div>
              <div><div style={css("font-size:11.5px; color:#7C8492;")}>EPS</div><div className="mono" style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin-top:3px;")}>6.02</div><div className="mono" style={css("font-size:11.5px; color:#3DBB84; margin-top:2px;")}>vs 5.78 est.</div></div>
              <div><div style={css("font-size:11.5px; color:#7C8492;")}>Return on equity</div><div className="mono" style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin-top:3px;")}>14.2%</div><div className="mono" style={css("font-size:11.5px; color:#9AA1AC; margin-top:2px;")}>target ≥13%</div></div>
            </div>
            <div style={css("margin-top:18px; border-top:1px solid #191D23; padding-top:14px;")}>
              <div style={css("font-size:11.5px; color:#7C8492; margin-bottom:8px;")}>Revenue trend (8 quarters)</div>
              <svg viewBox="0 0 420 90" preserveAspectRatio="none" style={css("width:100%; height:90px; display:block;")}>
                <rect x="6" y="46" width="38" height="44" fill="#22303A"/><rect x="54" y="40" width="38" height="50" fill="#22303A"/><rect x="102" y="44" width="38" height="46" fill="#22303A"/><rect x="150" y="34" width="38" height="56" fill="#22303A"/><rect x="198" y="30" width="38" height="60" fill="#2D4A5C"/><rect x="246" y="26" width="38" height="64" fill="#2D4A5C"/><rect x="294" y="20" width="38" height="70" fill="#2F6E90"/><rect x="342" y="14" width="38" height="76" fill="#3DBB84"/>
              </svg>
            </div>
            <div style={css("display:flex; gap:8px; margin-top:16px;")}>
              <button style={css("border:1px solid #2A2F37; background:#191D24; color:#DDE1E7; font-size:12px; padding:7px 13px; border-radius:7px; cursor:pointer; font-family:inherit;")}>Open full report (PDF)</button>
              <button style={css("border:1px solid #2A2F37; background:#191D24; color:#DDE1E7; font-size:12px; padding:7px 13px; border-radius:7px; cursor:pointer; font-family:inherit;")}>Presentation</button>
            </div>
          </div>
        </div>
      </div>

      
      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden; margin-top:22px;")}>
        <div style={css("display:flex; align-items:center; gap:12px; padding:12px 18px; border-bottom:1px solid #23272E;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Analyst recommendations</span>
          <span className="mono" style={css("font-size:10.5px; color:#5B626C;")}>brokers · last 7 days</span>
          <div style={css("flex:1;")}></div>
          <div className="mono" style={css("display:flex; align-items:center; gap:10px; font-size:11px;")}>
            <span style={css("color:#3DBB84;")}>6 Buy</span><span style={css("color:#8A929E;")}>3 Hold</span><span style={css("color:#E4655E;")}>1 Sell</span>
          </div>
        </div>
        <div className="mono" style={css("display:grid; grid-template-columns:1.7fr 1.9fr 84px 1.5fr 74px; gap:12px; padding:9px 18px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #191D23; background:#0E1013;")}>
          <span>Broker</span><span>Instrument</span><span style={css("text-align:center;")}>Rating</span><span style={css("text-align:right;")}>Target (prev)</span><span style={css("text-align:right;")}>Date</span>
        </div>
        {analystRecs.map((ar, i) => (<React.Fragment key={i}>
          <div onClick={ar.open} style={css("display:grid; grid-template-columns:1.7fr 1.9fr 84px 1.5fr 74px; gap:12px; align-items:center; padding:12px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
            <span style={css("font-size:12.5px; color:#DDE1E7;")}>{ar.broker}</span>
            <div style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{ar.ticker}</span> <span style={css("font-size:12px; color:#7C8492;")}>{ar.name}</span></div>
            <span style={css("text-align:center;")}>{ar.ratingEl}</span>
            <span className="mono" style={css("text-align:right; font-size:12.5px; color:#EDEFF2;")}>{ar.target} <span style={css("color:#5B626C;")}>{ar.prev}</span></span>
            <span className="mono" style={css("text-align:right; font-size:11.5px; color:#7C8492;")}>{ar.date}</span>
          </div>
        </React.Fragment>))}
      </div>
    </div>
    </>)}

    
    {isAlerts && (<>
    <div data-screen-label="Alerts" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:18px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Alerts</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>3 active · 2 triggered today</span>
      </div>
      <div style={css("display:grid; grid-template-columns:1.3fr 1fr; gap:22px; align-items:start;")}>
        <div style={css("display:flex; flex-direction:column; gap:16px;")}>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div style={css("padding:13px 18px; border-bottom:1px solid #23272E; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Active rules</div>
            <div style={css("display:flex; align-items:center; gap:12px; padding:14px 18px; border-bottom:1px solid #191D23;")}><span className="mono" style={css("font-weight:600; color:#F2F4F7; font-size:13.5px; width:56px;")}>EQNR</span><span style={css("font-size:13px; color:#DDE1E7;")}>Price crosses above</span><span className="mono" style={css("font-size:13px; color:#F2F4F7;")}>320.00</span><span style={css("margin-left:auto; width:34px; height:20px; border-radius:20px; background:#2D5BD0; position:relative;")}><span style={css("position:absolute; top:2px; right:2px; width:16px; height:16px; border-radius:50%; background:#fff;")}></span></span></div>
            <div style={css("display:flex; align-items:center; gap:12px; padding:14px 18px; border-bottom:1px solid #191D23;")}><span className="mono" style={css("font-weight:600; color:#F2F4F7; font-size:13.5px; width:56px;")}>MOWI</span><span style={css("font-size:13px; color:#DDE1E7;")}>Price falls below</span><span className="mono" style={css("font-size:13px; color:#F2F4F7;")}>190.00</span><span style={css("margin-left:auto; width:34px; height:20px; border-radius:20px; background:#2D5BD0; position:relative;")}><span style={css("position:absolute; top:2px; right:2px; width:16px; height:16px; border-radius:50%; background:#fff;")}></span></span></div>
            <div style={css("display:flex; align-items:center; gap:12px; padding:14px 18px;")}><span className="mono" style={css("font-weight:600; color:#F2F4F7; font-size:13.5px; width:56px;")}>NHY</span><span style={css("font-size:13px; color:#DDE1E7;")}>Daily change exceeds</span><span className="mono" style={css("font-size:13px; color:#F2F4F7;")}>±3.0%</span><span style={css("margin-left:auto; width:34px; height:20px; border-radius:20px; background:#2A2F37; position:relative;")}><span style={css("position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#8A929E;")}></span></span></div>
          </div>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div style={css("padding:13px 18px; border-bottom:1px solid #23272E; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Triggered today</div>
            <div style={css("padding:12px 18px; display:flex; align-items:center; gap:10px; border-bottom:1px solid #191D23;")}><span style={css("width:8px; height:8px; border-radius:2px; background:#3DBB84;")}></span><span className="mono" style={css("font-size:13px; color:#F2F4F7;")}>EQNR</span><span style={css("font-size:13px; color:#9AA1AC;")}>crossed above 310.00</span><span className="mono" style={css("margin-left:auto; font-size:11.5px; color:#5B626C;")}>14:02</span></div>
            <div style={css("padding:12px 18px; display:flex; align-items:center; gap:10px;")}><span style={css("width:8px; height:8px; border-radius:2px; background:#E4655E;")}></span><span className="mono" style={css("font-size:13px; color:#F2F4F7;")}>MOWI</span><span style={css("font-size:13px; color:#9AA1AC;")}>fell below 195.00</span><span className="mono" style={css("margin-left:auto; font-size:11.5px; color:#5B626C;")}>13:41</span></div>
          </div>
        </div>
        
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:18px 20px;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>New alert</span>
          <div style={css("margin-top:14px; display:flex; flex-direction:column; gap:12px;")}>
            <div><div style={css("font-size:11.5px; color:#7C8492; margin-bottom:5px;")}>Symbol</div><div className="mono" style={css("background:#191D24; border:1px solid #2A2F37; border-radius:8px; padding:10px 12px; font-size:13px; color:#F2F4F7;")}>EQNR — Equinor</div></div>
            <div><div style={css("font-size:11.5px; color:#7C8492; margin-bottom:5px;")}>Condition</div><div style={css("display:flex; gap:6px;")}><span style={css("flex:1; text-align:center; background:#2D5BD0; border-radius:8px; padding:9px; font-size:12.5px; color:#fff; cursor:pointer;")}>Above</span><span style={css("flex:1; text-align:center; background:#191D24; border:1px solid #2A2F37; border-radius:8px; padding:9px; font-size:12.5px; color:#9AA1AC; cursor:pointer;")}>Below</span><span style={css("flex:1; text-align:center; background:#191D24; border:1px solid #2A2F37; border-radius:8px; padding:9px; font-size:12.5px; color:#9AA1AC; cursor:pointer;")}>% move</span></div></div>
            <div><div style={css("font-size:11.5px; color:#7C8492; margin-bottom:5px;")}>Target price (NOK)</div><div className="mono" style={css("background:#191D24; border:1px solid #2A2F37; border-radius:8px; padding:10px 12px; font-size:13px; color:#F2F4F7;")}>320.00</div></div>
            <div><div style={css("font-size:11.5px; color:#7C8492; margin-bottom:5px;")}>Notify via</div><div style={css("display:flex; gap:8px; font-size:12.5px; color:#DDE1E7;")}><span style={css("background:#191D24; border:1px solid #2D5BD0; border-radius:20px; padding:5px 12px;")}>✓ Push</span><span style={css("background:#191D24; border:1px solid #2A2F37; border-radius:20px; padding:5px 12px; color:#9AA1AC;")}>Email</span></div></div>
            <button style={css("margin-top:4px; border:none; background:#2D5BD0; color:#fff; font-size:13px; font-weight:500; padding:11px; border-radius:8px; cursor:pointer; font-family:inherit;")}>Create alert</button>
          </div>
        </div>
      </div>
    </div>
    </>)}

    
    {isAI && (<>
    <div data-screen-label="AI Portfolio" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      
      <div style={css("display:flex; align-items:flex-start; gap:14px; margin-bottom:16px;")}>
        <div>
          <div style={css("display:flex; align-items:center; gap:10px;")}>
            <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>AI Portfolio</h2>
            <span style={css("font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:#B79BFF; border:1px solid #3B2F63; background:#211B33; border-radius:20px; padding:3px 9px;")}>Autonomous</span>
          </div>
          <p style={css("font-size:13px; color:#8A929E; margin:6px 0 0; max-width:620px; line-height:1.5;")}>Allocation is generated from macro &amp; geopolitical signals — US political headlines, conflict &amp; peace developments, trade &amp; energy flows — mapped to the full Nordnet universe of shares and funds — Oslo Børs, US markets and more. Non-EEA holdings are marked <span style={css("color:#C79A3D;")}>Outside ASK</span>.</p>
        </div>
        <div style={css("flex:1;")}></div>
        <div style={css("display:flex; flex-direction:column; align-items:flex-end; gap:8px;")}>
          <button style={css("border:none; background:linear-gradient(135deg,#7C5CFF,#4B33C7); color:#fff; font-size:12.5px; font-weight:500; padding:9px 16px; border-radius:8px; cursor:pointer; font-family:inherit;")}>↻ Rebalance now</button>
          <div className="mono" style={css("display:flex; align-items:center; gap:14px; font-size:11px; color:#5B626C;")}>
            <span>Last run 14:05 CET</span>
            <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:7px;height:7px;border-radius:50%;background:#3DBB84;box-shadow:0 0 0 3px rgba(14,138,95,0.18);")}></span>Nordnet · live prices</span>
          </div>
        </div>
      </div>

      
      <div style={css("display:flex; align-items:center; gap:16px; border:1px solid #23272E; border-radius:12px; background:#101317; padding:12px 16px; margin-bottom:16px;")}>
        <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; flex:0 0 auto;")}>AI risk level</span>
        <div style={css("display:flex; gap:4px; background:#0E1013; border:1px solid #23272E; border-radius:9px; padding:3px;")}>
          <span onClick={setRiskCons} style={css(riskConsStyle)}>Conservative</span>
          <span onClick={setRiskBal} style={css(riskBalStyle)}>Balanced</span>
          <span onClick={setRiskAgg} style={css(riskAggStyle)}>Aggressive</span>
        </div>
        <span style={css("font-size:12px; color:#8A929E; line-height:1.4;")}>{riskNote}</span>
      </div>

      
      <div style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:16px;")}>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:15px 17px;")}><div style={css("font-size:11.5px; color:#7C8492;")}>Portfolio value</div><div className="mono" style={css("font-size:23px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>NOK 1 284 500</div><div className="mono" style={css("font-size:12px; color:#3DBB84; margin-top:3px;")}>+18.4% since inception</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:15px 17px;")}><div style={css("font-size:11.5px; color:#7C8492;")}>Today</div><div className="mono" style={css("font-size:23px; font-weight:600; color:#3DBB84; margin-top:5px;")}>+11 240</div><div className="mono" style={css("font-size:12px; color:#3DBB84; margin-top:3px;")}>+0.88%</div></div>
        <div onClick={toggleConv} style={css("border:1px solid #3B2F63; border-radius:12px; background:#141026; padding:15px 17px; cursor:pointer;")} className="hov-c"><div style={css("display:flex; align-items:center; gap:6px;")}><span style={css("font-size:11.5px; color:#7C8492;")}>AI conviction</span><span className="mono" style={css("margin-left:auto; font-size:10px; color:#B79BFF;")}>{convToggleLabel}</span></div><div className="mono" style={css("font-size:23px; font-weight:600; color:#B79BFF; margin-top:5px;")}>{convScore}</div><div style={css("font-size:12px; color:#8A929E; margin-top:3px;")}>{convTilt}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:15px 17px;")}><div style={css("font-size:11.5px; color:#7C8492;")}>Cash / next rebalance</div><div className="mono" style={css("font-size:23px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>{cashPct}</div><div style={css("font-size:12px; color:#8A929E; margin-top:3px;")}>Auto · daily 08:00 &amp; on breaking signal</div></div>
      </div>

      
      {showConv && (<>
      <div style={css("border:1px solid #3B2F63; border-radius:12px; background:#120E22; padding:18px 20px; margin-bottom:16px;")}>
        <div style={css("display:flex; align-items:baseline; gap:12px; margin-bottom:4px;")}>
          <span style={css("font-size:14px; font-weight:600; color:#F2F4F7;")}>Why conviction is {convScore}</span>
          <span style={css("font-size:12px; color:#8A929E;")}>Weighted signal factors, rebased to a 0–100 risk-appetite score</span>
          <div style={css("flex:1;")}></div>
          <span onClick={toggleConv} style={css("font-size:11px; color:#B79BFF; cursor:pointer;")}>Hide ✕</span>
        </div>
        <div style={css("display:grid; grid-template-columns:1fr 1fr; column-gap:36px; row-gap:2px; margin-top:12px;")}>
          {convFactors.map((f, i) => (<React.Fragment key={i}>
            <div style={css("display:flex; align-items:center; gap:14px; padding:10px 0; border-bottom:1px solid #1E1834;")}>
              <div style={css("width:150px; flex:0 0 auto;")}><div style={css("font-size:12.5px; color:#EDEFF2;")}>{f.label}</div><div style={css("font-size:10.5px; color:#7C8492; line-height:1.35; margin-top:2px;")}>{f.why}</div></div>
              <div style={css("flex:1; min-width:0;")}>{f.barEl}</div>
              <span style={css("flex:0 0 auto;")}>{f.valEl}</span>
            </div>
          </React.Fragment>))}
        </div>
        <div style={css("display:flex; align-items:center; gap:10px; margin-top:14px; padding-top:12px; border-top:1px solid #1E1834;")}>
          <span className="mono" style={css("font-size:11px; color:#7C8492;")}>Base 30</span>
          <span className="mono" style={css("font-size:11px; color:#7C8492;")}>+ net signals {convNet}</span>
          <div style={css("flex:1;")}></div>
          <span className="mono" style={css("font-size:13px; color:#B79BFF; font-weight:600;")}>= {convScore} · {convStance}</span>
        </div>
      </div>
      </>)}

      
      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden; margin-bottom:16px;")}>
        <div style={css("display:flex; align-items:center; gap:10px; padding:12px 18px; border-bottom:1px solid #23272E;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Recommendations — next actions</span>
          <span className="mono" style={css("font-size:10.5px; color:#5B626C;")}>AI-generated · not advice</span>
          <div style={css("flex:1;")}></div>
          <span className="mono" style={css("font-size:10.5px; color:#5B626C;")}>click a row for full thesis</span>
        </div>
        <div className="mono" style={css("display:grid; grid-template-columns:74px 2fr 1.3fr 0.9fr 2.4fr; gap:10px; padding:9px 18px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #191D23; background:#0E1013;")}>
          <span>Action</span><span>Instrument</span><span style={css("text-align:right;")}>Now → target</span><span style={css("text-align:right;")}>Upside</span><span>Rationale</span>
        </div>
        {aiRecos.map((rc, i) => (<React.Fragment key={i}>
          <div onClick={rc.open} style={css("display:grid; grid-template-columns:74px 2fr 1.3fr 0.9fr 2.4fr; gap:10px; align-items:center; padding:12px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
            <span>{rc.actEl}</span>
            <div style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:13px; color:#F2F4F7;")}>{rc.ticker}</span> <span style={css("font-size:12px; color:#7C8492;")}>{rc.name}</span> {rc.askEl}</div>
            <span className="mono" style={css("text-align:right; font-size:12.5px; color:#EDEFF2;")}>{rc.nowTarget}</span>
            <span style={css("text-align:right;")}>{rc.upsideEl}</span>
            <span style={css("font-size:11.5px; color:#9AA1AC; line-height:1.4;")}>{rc.reason}</span>
          </div>
        </React.Fragment>))}
      </div>

      
      <div style={css("display:grid; grid-template-columns:1fr 384px; gap:22px; align-items:start;")}>
        
        <div style={css("display:flex; flex-direction:column; gap:16px;")}>
          
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("display:flex; align-items:baseline; gap:12px; margin-bottom:6px;")}>
              <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Rebalance history</span>
              <div style={css("flex:1;")}></div>
              <div className="mono" style={css("display:flex; align-items:center; gap:14px; font-size:11px; color:#9AA1AC;")}>
                <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:14px;height:3px;border-radius:2px;background:#3DBB84;")}></span>AI Portfolio</span>
                <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:14px;height:3px;border-radius:2px;background:#4E5661;")}></span>OSEBX</span>
                <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("color:#B79BFF;")}>◇</span>Rebalance</span>
              </div>
            </div>
            <div style={css("display:flex; align-items:baseline; gap:10px; margin-bottom:8px;")}>
              <span className="mono" style={css("font-size:22px; font-weight:600; color:#F2F4F7;")}>+18.4%</span>
              <span className="mono" style={css("font-size:12px; color:#3DBB84;")}>vs OSEBX +11.6% · since Jan 2026</span>
            </div>
            <svg viewBox="0 0 720 210" preserveAspectRatio="none" style={css("width:100%; height:200px; display:block;")}>
              <defs><linearGradient id="rbgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3DBB84" stopOpacity="0.20"/><stop offset="100%" stopColor="#3DBB84" stopOpacity="0"/></linearGradient></defs>
              <line x1="0" y1="50" x2="720" y2="50" stroke="#20242B" strokeWidth="1"/>
              <line x1="0" y1="100" x2="720" y2="100" stroke="#20242B" strokeWidth="1"/>
              <line x1="0" y1="150" x2="720" y2="150" stroke="#20242B" strokeWidth="1"/>
              
              <line x1="120" y1="10" x2="120" y2="185" stroke="#2C2545" strokeWidth="1" strokeDasharray="3 4"/>
              <line x1="300" y1="10" x2="300" y2="185" stroke="#2C2545" strokeWidth="1" strokeDasharray="3 4"/>
              <line x1="480" y1="10" x2="480" y2="185" stroke="#2C2545" strokeWidth="1" strokeDasharray="3 4"/>
              <line x1="600" y1="10" x2="600" y2="185" stroke="#2C2545" strokeWidth="1" strokeDasharray="3 4"/>
              <line x1="660" y1="10" x2="660" y2="185" stroke="#2C2545" strokeWidth="1" strokeDasharray="3 4"/>
              
              <polyline points="0,178 60,174 120,168 180,170 240,158 300,152 360,150 420,142 480,146 540,132 600,128 660,120 720,112" fill="none" stroke="#4E5661" strokeWidth="1.8"/>
              
              <path d="M0,175 L60,168 L120,150 L180,155 L240,130 L300,120 L360,110 L420,95 L480,100 L540,78 L600,66 L660,52 L720,40 L720,210 L0,210 Z" fill="url(#rbgrad)"/>
              <polyline points="0,175 60,168 120,150 180,155 240,130 300,120 360,110 420,95 480,100 540,78 600,66 660,52 720,40" fill="none" stroke="#3DBB84" strokeWidth="2.2"/>
              
              <circle cx="120" cy="150" r="3.5" fill="#14171B" stroke="#B79BFF" strokeWidth="1.8"/>
              <circle cx="300" cy="120" r="3.5" fill="#14171B" stroke="#B79BFF" strokeWidth="1.8"/>
              <circle cx="480" cy="100" r="3.5" fill="#14171B" stroke="#B79BFF" strokeWidth="1.8"/>
              <circle cx="600" cy="66" r="3.5" fill="#14171B" stroke="#B79BFF" strokeWidth="1.8"/>
              <circle cx="660" cy="52" r="3.5" fill="#14171B" stroke="#B79BFF" strokeWidth="1.8"/>
            </svg>
            <div className="mono" style={css("display:flex; justify-content:space-between; font-size:10px; color:#5B626C; margin-top:4px;")}><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span></div>
            <div style={css("display:flex; align-items:center; gap:8px; margin-top:12px; margin-bottom:10px;")}><span style={css("font-size:10.5px; color:#7C8492;")}>Click a rebalance to see what triggered it</span></div>
            <div style={css("display:flex; gap:8px; overflow-x:auto; padding-bottom:2px;")}>
              {rebalEvents.map((rb, i) => (<React.Fragment key={i}>
                <div onClick={rb.select} style={css(rb.cardStyle)}><div className="mono" style={css("font-size:10.5px; color:#B79BFF;")}>◇ {rb.date}</div><div style={css("font-size:11px; color:#DDE1E7; margin-top:2px;")}>{rb.changes}</div><div className="mono" style={css("font-size:10px; margin-top:1px;")}>{rb.deltaEl}</div></div>
              </React.Fragment>))}
            </div>
            {rbOpen && (<>
            <div style={css("margin-top:12px; border:1px solid #3B2F63; border-radius:10px; background:#120E22; padding:14px 16px;")}>
              <div style={css("display:flex; align-items:center; gap:10px; margin-bottom:10px;")}>
                <span className="mono" style={css("font-size:12px; color:#B79BFF; font-weight:600;")}>◇ {rbSel.date} rebalance</span>
                <span style={css("font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#C7BFD6; border:1px solid #3B2F63; background:#211B33; border-radius:20px; padding:2px 9px;")}>{rbSel.trigType}</span>
                <div style={css("flex:1;")}></div>
                <span className="mono" style={css("font-size:11px;")}>{rbSel.deltaEl}</span>
              </div>
              <div style={css("font-size:11px; color:#7C8492; margin-bottom:4px;")}>Trigger condition</div>
              <div className="mono" style={css("font-size:12.5px; color:#EDEFF2; background:#0E0B18; border:1px solid #221B38; border-radius:7px; padding:9px 11px;")}>{rbSel.condition}</div>
              <div style={css("font-size:11px; color:#7C8492; margin:12px 0 4px;")}>What the AI saw</div>
              <p style={css("font-size:12.5px; line-height:1.55; color:#DDE1E7; margin:0;")}>{rbSel.reasoning}</p>
              <div style={css("font-size:11px; color:#7C8492; margin:12px 0 8px;")}>Actions executed</div>
              {rbSel.actions.map((ac, i) => (<React.Fragment key={i}>
                <div style={css("display:flex; align-items:center; gap:10px; padding:6px 0; border-top:1px solid #1E1834;")}>
                  <span style={css("flex:0 0 auto;")}>{ac.dotEl}</span>
                  <span style={css("font-size:12.5px; color:#EDEFF2;")}>{ac.text}</span>
                  <span className="mono" style={css("margin-left:auto; font-size:11px; color:#9AA1AC;")}>{ac.detail}</span>
                </div>
              </React.Fragment>))}
            </div>
            </>)}
          </div>
          
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("display:flex; justify-content:space-between; align-items:baseline; margin-bottom:12px;")}><span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Current allocation</span><span className="mono" style={css("font-size:11px; color:#5B626C;")}>by theme</span></div>
            <div style={css("display:flex; height:14px; border-radius:6px; overflow:hidden; gap:2px;")}>
              <div style={css("width:34%; background:#3DBB84;")}></div>
              <div style={css("width:22%; background:#7C5CFF;")}></div>
              <div style={css("width:16%; background:#2F6E90;")}></div>
              <div style={css("width:12%; background:#C79A3D;")}></div>
              <div style={css("width:9.5%; background:#B85C54;")}></div>
              <div style={css("width:6.5%; background:#3A414B;")}></div>
            </div>
            <div className="mono" style={css("display:flex; flex-wrap:wrap; gap:14px; margin-top:12px; font-size:11.5px; color:#9AA1AC;")}>
              <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#3DBB84;")}></span>Energy 34%</span>
              <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#7C5CFF;")}></span>Defence 22%</span>
              <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#2F6E90;")}></span>Global funds 16%</span>
              <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#C79A3D;")}></span>Materials 12%</span>
              <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#B85C54;")}></span>Seafood 9.5%</span>
              <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#3A414B;")}></span>Cash 6.5%</span>
            </div>
          </div>
          
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div className="mono" style={css("display:grid; grid-template-columns:2.2fr 0.8fr 1fr 0.9fr 1.1fr 1.4fr; gap:10px; padding:10px 18px; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #23272E; background:#0E1013;")}>
              <span>Holding</span><span style={css("text-align:right;")}>Alloc</span><span style={css("text-align:right;")}>Value</span><span style={css("text-align:right;")}>Today</span><span style={css("text-align:center;")}>Conviction</span><span>AI driver</span>
            </div>
            <div style={css("display:flex; align-items:center; gap:8px; padding:8px 18px; border-bottom:1px solid #191D23; background:#0C0E11;")}>
              <span style={css("font-size:10.5px; color:#C79A3D; border:1px solid #4A3E1E; background:#211B0E; border-radius:20px; padding:2px 8px; letter-spacing:0.03em;")}>◔ Outside ASK</span>
              <span style={css("font-size:11px; color:#6B727C;")}>Non-EEA holdings (e.g. US shares) can't sit in an aksjesparekonto — booked on your Nordnet investeringskonto instead.</span>
            </div>
            {aiHoldings.map((h, i) => (<React.Fragment key={i}>
              <div onClick={h.open} style={css("display:grid; grid-template-columns:2.2fr 0.8fr 1fr 0.9fr 1.1fr 1.4fr; gap:10px; align-items:center; padding:12px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
                <div style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:13px; color:#F2F4F7;")}>{h.ticker}</span> <span style={css("font-size:12px; color:#7C8492;")}>{h.name}</span> {h.askEl}<div style={css("font-size:10px; color:#5B626C; margin-top:1px;")}>{h.type}</div></div>
                <span className="mono" style={css("text-align:right; font-size:13px; color:#EDEFF2;")}>{h.alloc}</span>
                <span className="mono" style={css("text-align:right; font-size:12.5px; color:#9AA1AC;")}>{h.value}</span>
                <span style={css("text-align:right;")}>{h.chgEl}</span>
                <span style={css("text-align:center;")}>{h.convEl}</span>
                <span style={css("font-size:11.5px; color:#9AA1AC;")}>{h.driver}</span>
              </div>
            </React.Fragment>))}
          </div>
          
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div style={css("display:flex; align-items:center; gap:10px; padding:12px 18px; border-bottom:1px solid #23272E;")}>
              <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Portfolio log</span>
              <span className="mono" style={css("font-size:10.5px; color:#5B626C;")}>executed transactions</span>
              <div style={css("flex:1;")}></div>
              <span className="mono" style={css("font-size:10.5px; color:#6FA8FF; cursor:pointer;")}>Export CSV</span>
            </div>
            <div className="mono" style={css("display:grid; grid-template-columns:78px 62px 1.7fr 0.9fr 1fr 1.3fr; gap:10px; padding:9px 18px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #191D23; background:#0E1013;")}>
              <span>Date</span><span>Side</span><span>Instrument</span><span style={css("text-align:right;")}>Qty</span><span style={css("text-align:right;")}>Price</span><span>Account</span>
            </div>
            {portfolioLog.map((t, i) => (<React.Fragment key={i}>
              <div style={css("display:grid; grid-template-columns:78px 62px 1.7fr 0.9fr 1fr 1.3fr; gap:10px; align-items:center; padding:10px 18px; border-bottom:1px solid #191D23;")}>
                <span className="mono" style={css("font-size:12px; color:#9AA1AC;")}>{t.date}</span>
                <span>{t.sideEl}</span>
                <div style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{t.ticker}</span> <span style={css("font-size:11.5px; color:#7C8492;")}>{t.name}</span></div>
                <span className="mono" style={css("text-align:right; font-size:12px; color:#EDEFF2;")}>{t.qty}</span>
                <span className="mono" style={css("text-align:right; font-size:12px; color:#9AA1AC;")}>{t.price}</span>
                <span style={css("font-size:11px; color:#7C8492;")}>{t.account}</span>
              </div>
            </React.Fragment>))}
          </div>
        </div>

        
        <div style={css("display:flex; flex-direction:column; gap:16px;")}>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div style={css("display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #23272E;")}><span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Signal feed</span><span className="mono" style={css("font-size:10.5px; color:#B79BFF;")}>◆ analysing</span></div>
            {aiSignals.map((sg, i) => (<React.Fragment key={i}>
              <div style={css("padding:12px 16px; border-bottom:1px solid #191D23;")}>
                <div className="mono" style={css("display:flex; align-items:center; gap:8px; font-size:10px; margin-bottom:6px;")}><span style={css("color:#7C8492;")}>{sg.cat}</span><span style={css("color:#5B626C;")}>·</span><span style={css("color:#5B626C;")}>{sg.source}</span><span style={css("margin-left:auto;")}>{sg.sentEl}</span></div>
                <div style={css("font-size:12.5px; line-height:1.45; color:#DDE1E7;")}>{sg.text}</div>
                <div className="mono" style={css("display:flex; align-items:center; gap:8px; margin-top:7px; font-size:10.5px; color:#5B626C;")}><span style={css("color:#6FA8FF;")}>{sg.tickers}</span><span style={css("margin-left:auto;")}>{sg.time}</span></div>
              </div>
            </React.Fragment>))}
          </div>
          
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div style={css("padding:12px 16px; border-bottom:1px solid #23272E; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Latest AI actions</div>
            {aiActions.map((a, i) => (<React.Fragment key={i}>
              <div style={css("display:flex; gap:10px; padding:12px 16px; border-bottom:1px solid #191D23;")}>
                <span style={css("width:8px; height:8px; border-radius:2px; margin-top:5px; flex:0 0 auto;")} data-dot={a.dir}>{a.dotEl}</span>
                <div style={css("min-width:0; flex:1;")}>
                  <div style={css("display:flex; align-items:baseline; gap:8px;")}><div style={css("font-size:12.5px; color:#F2F4F7; line-height:1.4; font-weight:500;")}>{a.text}</div><span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#5B626C; flex:0 0 auto;")}>{a.time}</span></div>
                  <div style={css("font-size:11.5px; color:#9AA1AC; line-height:1.5; margin-top:5px;")}><span style={css("color:#B79BFF; font-weight:500;")}>Why: </span>{a.why}</div>
                  <div style={css("display:flex; align-items:center; gap:8px; margin-top:8px; flex-wrap:wrap;")}>
                    <span className="mono" style={css("font-size:9.5px; letter-spacing:0.04em; text-transform:uppercase; color:#7C8492; border:1px solid #2A2F37; border-radius:20px; padding:2px 8px;")}>Signal · {a.basis}</span>
                    <span className="mono" style={css("font-size:9.5px; letter-spacing:0.04em; text-transform:uppercase; color:#7C8492; border:1px solid #2A2F37; border-radius:20px; padding:2px 8px;")}>Confidence {a.conf}</span>
                    <span className="mono" style={css("font-size:9.5px; letter-spacing:0.04em; text-transform:uppercase; color:#7C8492; border:1px solid #2A2F37; border-radius:20px; padding:2px 8px;")}>Impact {a.impact}</span>
                  </div>
                </div>
              </div>
            </React.Fragment>))}
          </div>
          
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div style={css("display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid #23272E;")}>
              <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Dividends &amp; reports</span>
              <span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#3DBB84;")}>YTD NOK 18 420</span>
            </div>
            <div style={css("padding:6px 16px 4px;")}><span className="mono" style={css("font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C;")}>Upcoming dividends</span></div>
            {divs.map((d, i) => (<React.Fragment key={i}>
              <div style={css("display:grid; grid-template-columns:56px 1fr auto auto; gap:10px; align-items:center; padding:9px 16px; border-bottom:1px solid #191D23;")}>
                <span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{d.ticker}</span>
                <span style={css("font-size:11px; color:#7C8492;")}>ex {d.ex}</span>
                <span className="mono" style={css("font-size:12px; color:#EDEFF2;")}>{d.amount}</span>
                <span className="mono" style={css("font-size:11px; color:#3DBB84; width:44px; text-align:right;")}>{d.yield}</span>
              </div>
            </React.Fragment>))}
            <div style={css("padding:12px 16px 4px;")}><span className="mono" style={css("font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C;")}>Reports — held names</span></div>
            {holdingReports.map((r, i) => (<React.Fragment key={i}>
              <div onClick={r.open} style={css("display:grid; grid-template-columns:56px 1fr auto; gap:10px; align-items:center; padding:9px 16px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
                <span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{r.ticker}</span>
                <span style={css("font-size:11.5px; color:#DDE1E7;")}>{r.period}</span>
                <span className="mono" style={css("font-size:11px; color:#9AA1AC;")}>{r.date}</span>
              </div>
            </React.Fragment>))}
          </div>
          <div style={css("border:1px dashed #2A2F37; border-radius:12px; background:#0E1013; padding:13px 16px; font-size:11.5px; line-height:1.5; color:#6B727C;")}>
            <span style={css("color:#8A929E; font-weight:600;")}>Data sources.</span> Prices &amp; instrument universe via Nordnet API. Signals aggregated from newswires &amp; public political statements. AI allocation is model-generated and not investment advice.
          </div>
        </div>
      </div>
    </div>
    </>)}

    
    {isRisk && (<>
    <div data-screen-label="Risk" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:16px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Risk &amp; exposure</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>AI Portfolio · NOK 1 284 500 · as of 14:32 CET</span>
      </div>

      
      <div style={css("display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:18px;")}>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Portfolio beta</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>1.18</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>vs OSEBX</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Ann. volatility</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#C79A3D; margin-top:5px;")}>21.4%</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>elevated</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>1-day VaR (95%)</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#E4655E; margin-top:5px;")}>−2.8%</div><div className="mono" style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>−NOK 36 000</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Max drawdown</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#E4655E; margin-top:5px;")}>−14.2%</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>since inception</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Sharpe (1y)</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#3DBB84; margin-top:5px;")}>1.34</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>risk-adjusted</div></div>
      </div>

      <div style={css("display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start;")}>
        
        <div style={css("display:flex; flex-direction:column; gap:16px;")}>
          
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:14px;")}>Exposure by sector</div>
            {sectorExp.map((e, i) => (<React.Fragment key={i}>
              <div style={css("display:flex; align-items:center; gap:12px; margin-bottom:11px;")}>
                <span style={css("width:96px; flex:0 0 auto; font-size:12.5px; color:#DDE1E7;")}>{e.label}</span>
                <div style={css("flex:1; height:9px; background:#1A1E24; border-radius:5px; overflow:hidden;")}>{e.barEl}</div>
                <span className="mono" style={css("width:42px; text-align:right; flex:0 0 auto; font-size:12.5px; color:#EDEFF2;")}>{e.val}</span>
              </div>
            </React.Fragment>))}
          </div>
          
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:14px;")}>Geography &amp; currency</div>
            <div style={css("display:flex; height:16px; border-radius:6px; overflow:hidden; gap:2px; margin-bottom:12px;")}>
              <div style={css("width:60%; background:#3DBB84;")}></div><div style={css("width:23%; background:#2F6E90;")}></div><div style={css("width:17%; background:#7C5CFF;")}></div>
            </div>
            <div className="mono" style={css("display:flex; flex-wrap:wrap; gap:16px; font-size:11.5px; color:#9AA1AC;")}>
              <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#3DBB84;")}></span>Norway · NOK 60%</span>
              <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#2F6E90;")}></span>United States · USD 23%</span>
              <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#7C5CFF;")}></span>Global / diversified 17%</span>
            </div>
          </div>
          
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:14px;")}>Account eligibility</div>
            <div style={css("display:flex; height:16px; border-radius:6px; overflow:hidden; gap:2px; margin-bottom:12px;")}>
              <div style={css("width:77%; background:#3DBB84;")}></div><div style={css("width:23%; background:#C79A3D;")}></div>
            </div>
            <div className="mono" style={css("display:flex; flex-wrap:wrap; gap:16px; font-size:11.5px; color:#9AA1AC;")}>
              <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#3DBB84;")}></span>Aksjesparekonto (EEA) 77%</span>
              <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#C79A3D;")}></span>Investeringskonto · outside ASK 23%</span>
            </div>
          </div>
        </div>

        
        <div style={css("display:flex; flex-direction:column; gap:16px;")}>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("display:flex; align-items:baseline; gap:10px; margin-bottom:14px;")}><span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Concentration — top holdings</span><span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#C79A3D;")}>Top 5 = 54%</span></div>
            {concExp.map((e, i) => (<React.Fragment key={i}>
              <div style={css("display:flex; align-items:center; gap:12px; margin-bottom:11px;")}>
                <span className="mono" style={css("width:64px; flex:0 0 auto; font-size:12.5px; color:#F2F4F7;")}>{e.label}</span>
                <div style={css("flex:1; height:9px; background:#1A1E24; border-radius:5px; overflow:hidden;")}>{e.barEl}</div>
                <span className="mono" style={css("width:42px; text-align:right; flex:0 0 auto; font-size:12.5px; color:#EDEFF2;")}>{e.val}</span>
              </div>
            </React.Fragment>))}
          </div>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:12px;")}>Factor tilt</div>
            <div className="mono" style={css("display:grid; grid-template-columns:repeat(5,1fr); gap:8px; text-align:center;")}>
              <div><div style={css("font-size:11px; color:#7C8492;")}>Value</div><div style={css("font-size:15px; color:#3DBB84; margin-top:3px;")}>+ High</div></div>
              <div><div style={css("font-size:11px; color:#7C8492;")}>Momentum</div><div style={css("font-size:15px; color:#3DBB84; margin-top:3px;")}>+ High</div></div>
              <div><div style={css("font-size:11px; color:#7C8492;")}>Size</div><div style={css("font-size:15px; color:#9AA1AC; margin-top:3px;")}>Large</div></div>
              <div><div style={css("font-size:11px; color:#7C8492;")}>Quality</div><div style={css("font-size:15px; color:#9AA1AC; margin-top:3px;")}>Neutral</div></div>
              <div><div style={css("font-size:11px; color:#7C8492;")}>Volatility</div><div style={css("font-size:15px; color:#C79A3D; margin-top:3px;")}>Elevated</div></div>
            </div>
          </div>
        </div>
      </div>

      
      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden; margin-top:18px;")}>
        <div style={css("display:flex; align-items:center; gap:10px; padding:12px 18px; border-bottom:1px solid #23272E;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Scenario stress tests</span>
          <span className="mono" style={css("font-size:10.5px; color:#5B626C;")}>modelled 1-day portfolio impact</span>
        </div>
        <div className="mono" style={css("display:grid; grid-template-columns:1.8fr 2.6fr 1fr 1.4fr; gap:12px; padding:9px 18px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #191D23; background:#0E1013;")}>
          <span>Scenario</span><span>Transmission</span><span style={css("text-align:right;")}>Impact</span><span>Most exposed</span>
        </div>
        {scenarios.map((sc, i) => (<React.Fragment key={i}>
          <div style={css("display:grid; grid-template-columns:1.8fr 2.6fr 1fr 1.4fr; gap:12px; align-items:center; padding:12px 18px; border-bottom:1px solid #191D23;")}>
            <span style={css("font-size:13px; color:#F2F4F7; font-weight:500;")}>{sc.name}</span>
            <span style={css("font-size:12px; color:#9AA1AC; line-height:1.4;")}>{sc.how}</span>
            <span style={css("text-align:right;")}>{sc.impactEl}</span>
            <span className="mono" style={css("font-size:11.5px; color:#6FA8FF;")}>{sc.hit}</span>
          </div>
        </React.Fragment>))}
      </div>
    </div>
    </>)}

    
    {isFx && (<>
    <div data-screen-label="Currency" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:16px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Currency exposure</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>AI Portfolio · reporting currency NOK · as of 14:32 CET</span>
      </div>

      
      <div style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px;")}>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Foreign-currency exposure</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>40%</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>non-NOK holdings</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>USD exposure</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#2F6E90; margin-top:5px;")}>23%</div><div className="mono" style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>NOK 295 000</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Currency hedged</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#C79A3D; margin-top:5px;")}>0%</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>fully unhedged</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>FX effect · YTD</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#3DBB84; margin-top:5px;")}>+2.1%</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>weaker NOK tailwind</div></div>
      </div>

      <div style={css("display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start;")}>
        
        <div style={css("display:flex; flex-direction:column; gap:16px;")}>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:14px;")}>Exposure by currency</div>
            <div style={css("display:flex; height:16px; border-radius:6px; overflow:hidden; gap:2px; margin-bottom:14px;")}>
              <div style={css("width:60%; background:#3DBB84;")}></div><div style={css("width:23%; background:#2F6E90;")}></div><div style={css("width:11%; background:#7C5CFF;")}></div><div style={css("width:6%; background:#C79A3D;")}></div>
            </div>
            {fxBreakdown.map((c, i) => (<React.Fragment key={i}>
              <div style={css("display:flex; align-items:center; gap:12px; margin-bottom:11px;")}>
                <span style={css("width:12px; height:12px; border-radius:3px; flex:0 0 auto;")} data-c={c.pct}>{c.dotEl}</span>
                <span style={css("width:150px; flex:0 0 auto; font-size:12.5px; color:#DDE1E7;")}>{c.label}</span>
                <span className="mono" style={css("flex:1; text-align:right; font-size:12px; color:#9AA1AC;")}>{c.value}</span>
                <span className="mono" style={css("width:44px; text-align:right; flex:0 0 auto; font-size:12.5px; color:#EDEFF2;")}>{c.pctLabel}</span>
              </div>
            </React.Fragment>))}
          </div>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:12px;")}>Reference rates</div>
            <div style={css("display:grid; grid-template-columns:repeat(3,1fr); gap:12px;")}>
              <div style={css("border:1px solid #23272E; border-radius:9px; padding:12px 13px;")}><div style={css("font-size:11.5px; color:#7C8492;")}>USD/NOK</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>10.612</div><div className="mono" style={css("font-size:11px; color:#E4655E; margin-top:2px;")}>−0.18% · 1d</div></div>
              <div style={css("border:1px solid #23272E; border-radius:9px; padding:12px 13px;")}><div style={css("font-size:11.5px; color:#7C8492;")}>EUR/NOK</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>11.481</div><div className="mono" style={css("font-size:11px; color:#E4655E; margin-top:2px;")}>−0.09% · 1d</div></div>
              <div style={css("border:1px solid #23272E; border-radius:9px; padding:12px 13px;")}><div style={css("font-size:11.5px; color:#7C8492;")}>GBP/NOK</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>13.540</div><div className="mono" style={css("font-size:11px; color:#3DBB84; margin-top:2px;")}>+0.12% · 1d</div></div>
            </div>
          </div>
          
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:6px;")}>FX sensitivity</div>
            <p style={css("font-size:12px; color:#8A929E; margin:0 0 12px; line-height:1.5;")}>Estimated portfolio impact from a move in USD/NOK, holdings unchanged.</p>
            <div className="mono" style={css("display:grid; grid-template-columns:1fr 1fr; gap:10px;")}>
              <div style={css("border:1px solid #23272E; border-radius:9px; padding:11px 13px;")}><div style={css("font-size:11px; color:#7C8492;")}>USD/NOK +5%</div><div style={css("font-size:16px; color:#3DBB84; margin-top:4px;")}>+1.15%</div></div>
              <div style={css("border:1px solid #23272E; border-radius:9px; padding:11px 13px;")}><div style={css("font-size:11px; color:#7C8492;")}>USD/NOK −5%</div><div style={css("font-size:16px; color:#E4655E; margin-top:4px;")}>−1.15%</div></div>
            </div>
          </div>
        </div>

        
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
          <div style={css("display:flex; align-items:center; gap:10px; padding:12px 18px; border-bottom:1px solid #23272E;")}>
            <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Exposure by holding</span>
            <span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#5B626C;")}>local ccy → NOK</span>
          </div>
          <div className="mono" style={css("display:grid; grid-template-columns:1.8fr 0.8fr 0.8fr 1.1fr 90px; gap:10px; padding:9px 18px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #191D23; background:#0E1013;")}>
            <span>Holding</span><span style={css("text-align:center;")}>Ccy</span><span style={css("text-align:right;")}>Weight</span><span style={css("text-align:right;")}>Value (NOK)</span><span style={css("text-align:right;")}>FX risk</span>
          </div>
          {fxHoldings.map((h, i) => (<React.Fragment key={i}>
            <div onClick={h.open} style={css("display:grid; grid-template-columns:1.8fr 0.8fr 0.8fr 1.1fr 90px; gap:10px; align-items:center; padding:11px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
              <div style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{h.ticker}</span> <span style={css("font-size:11.5px; color:#7C8492;")}>{h.name}</span></div>
              <span style={css("text-align:center;")}>{h.ccyEl}</span>
              <span className="mono" style={css("text-align:right; font-size:12px; color:#EDEFF2;")}>{h.weight}</span>
              <span className="mono" style={css("text-align:right; font-size:12px; color:#9AA1AC;")}>{h.value}</span>
              <span style={css("text-align:right;")}>{h.riskEl}</span>
            </div>
          </React.Fragment>))}
        </div>
      </div>
    </div>
    </>)}

    
    {isAttr && (<>
    <div data-screen-label="Attribution" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:16px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Performance attribution</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>AI Portfolio vs OSEBX · since inception (21 Feb 2026)</span>
      </div>

      
      <div style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px;")}>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Total return</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#3DBB84; margin-top:5px;")}>+18.4%</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>portfolio, net</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Benchmark · OSEBX</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#9AA1AC; margin-top:5px;")}>+11.6%</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>total return index</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#141026; border-color:#3B2F63; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Active return (alpha)</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#B79BFF; margin-top:5px;")}>+6.8%</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>Info ratio 0.94</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Top contributor</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>KOG</div><div className="mono" style={css("font-size:11px; color:#3DBB84; margin-top:2px;")}>+2.9 pp</div></div>
      </div>

      <div style={css("display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start;")}>
        
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
          <div style={css("display:flex; align-items:baseline; gap:10px; margin-bottom:14px;")}><span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Active return decomposition</span><span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#B79BFF;")}>Brinson</span></div>
          {attrEffects.map((e, i) => (<React.Fragment key={i}>
            <div style={css("display:flex; align-items:center; gap:12px; margin-bottom:12px;")}>
              <span style={css("width:132px; flex:0 0 auto; font-size:12.5px; color:#DDE1E7;")}>{e.label}</span>
              <div style={css("flex:1; height:10px; background:#1A1E24; border-radius:5px; position:relative; overflow:hidden;")}>{e.barEl}</div>
              <span style={css("width:52px; text-align:right; flex:0 0 auto;")}>{e.valEl}</span>
            </div>
          </React.Fragment>))}
          <div style={css("display:flex; align-items:center; gap:10px; margin-top:8px; padding-top:12px; border-top:1px solid #1E1834;")}>
            <span style={css("font-size:12.5px; color:#F2F4F7; font-weight:600;")}>Total active return</span>
            <div style={css("flex:1;")}></div>
            <span className="mono" style={css("font-size:14px; color:#B79BFF; font-weight:600;")}>+6.8%</span>
          </div>
        </div>

        
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
          <div style={css("display:flex; align-items:center; gap:10px; padding:12px 18px; border-bottom:1px solid #23272E;")}>
            <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Contribution by holding</span>
            <span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#5B626C;")}>weight × return, pp</span>
          </div>
          {contribHoldings.map((h, i) => (<React.Fragment key={i}>
            <div onClick={h.open} style={css("display:grid; grid-template-columns:112px 1fr 52px; gap:12px; align-items:center; padding:9px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
              <span className="mono" style={css("font-size:12.5px; color:#F2F4F7;")}><span style={css("font-weight:600;")}>{h.ticker}</span></span>
              <div style={css("height:10px; background:#1A1E24; border-radius:5px; position:relative; overflow:hidden;")}>{h.barEl}</div>
              <span style={css("text-align:right;")}>{h.valEl}</span>
            </div>
          </React.Fragment>))}
        </div>
      </div>

      
      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px; margin-top:18px;")}>
        <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:14px;")}>Contribution by theme</div>
        <div style={css("display:grid; grid-template-columns:1fr 1fr; column-gap:36px; row-gap:2px;")}>
          {contribThemes.map((t, i) => (<React.Fragment key={i}>
            <div style={css("display:flex; align-items:center; gap:12px; padding:8px 0;")}>
              <span style={css("width:110px; flex:0 0 auto; font-size:12.5px; color:#DDE1E7;")}>{t.label}</span>
              <div style={css("flex:1; height:10px; background:#1A1E24; border-radius:5px; position:relative; overflow:hidden;")}>{t.barEl}</div>
              <span style={css("width:52px; text-align:right; flex:0 0 auto;")}>{t.valEl}</span>
            </div>
          </React.Fragment>))}
        </div>
      </div>
    </div>
    </>)}

    
    {isIns && (<>
    <div data-screen-label="Insider" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:16px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Insider trades</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>Primary-insider disclosures · Oslo Børs · last 30 days</span>
        <div style={css("flex:1;")}></div>
        <div className="mono" style={css("display:flex; gap:4px; font-size:11.5px;")}>
          <span style={css("padding:5px 11px; border-radius:6px; background:#1D2229; color:#fff; cursor:pointer;")}>All</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Watchlist</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Buys</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Sells</span>
        </div>
      </div>

      
      <div style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px;")}>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Net insider flow · 30d</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#3DBB84; margin-top:5px;")}>+NOK 12.4m</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>net buying</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Buy / sell trades</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>6 / 2</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>3:1 ratio</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Sentiment</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#3DBB84; margin-top:5px;")}>Bullish</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>CEO/CFO buying cluster</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Largest transaction</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>MOWI</div><div className="mono" style={css("font-size:11px; color:#E4655E; margin-top:2px;")}>−NOK 7.8m sell</div></div>
      </div>

      
      <div style={css("display:flex; align-items:center; gap:12px; border:1px solid #1F5C43; background:#0F211A; border-radius:12px; padding:13px 16px; margin-bottom:18px;")}>
        <span style={css("width:8px; height:8px; border-radius:2px; background:#3DBB84; flex:0 0 auto;")}></span>
        <span style={css("font-size:13px; color:#DDE1E7;")}><span style={css("font-weight:600; color:#3DBB84;")}>AI note.</span> Cluster of CEO/CFO purchases in EQNR, KOG and AKRBP reinforces the portfolio's energy &amp; defence conviction — factored into the current signal score.</span>
      </div>

      
      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
        <div className="mono" style={css("display:grid; grid-template-columns:70px 1.7fr 1.9fr 66px 0.9fr 1fr 1fr; gap:12px; padding:10px 18px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #23272E; background:#0E1013;")}>
          <span>Date</span><span>Company</span><span>Insider</span><span style={css("text-align:center;")}>Side</span><span style={css("text-align:right;")}>Shares</span><span style={css("text-align:right;")}>Value</span><span style={css("text-align:right;")}>Post-trade</span>
        </div>
        {insiderTrades.map((t, i) => (<React.Fragment key={i}>
          <div onClick={t.open} style={css("display:grid; grid-template-columns:70px 1.7fr 1.9fr 66px 0.9fr 1fr 1fr; gap:12px; align-items:center; padding:12px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
            <span className="mono" style={css("font-size:12px; color:#9AA1AC;")}>{t.date}</span>
            <div style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{t.ticker}</span> <span style={css("font-size:11.5px; color:#7C8492;")}>{t.company}</span></div>
            <div style={css("min-width:0;")}><div style={css("font-size:12.5px; color:#DDE1E7;")}>{t.person}</div><div style={css("font-size:10.5px; color:#5B626C;")}>{t.role}</div></div>
            <span style={css("text-align:center;")}>{t.sideEl}</span>
            <span className="mono" style={css("text-align:right; font-size:12px; color:#EDEFF2;")}>{t.shares}</span>
            <span className="mono" style={css("text-align:right; font-size:12px; color:#9AA1AC;")}>{t.value}</span>
            <span className="mono" style={css("text-align:right; font-size:12px; color:#9AA1AC;")}>{t.holding}</span>
          </div>
        </React.Fragment>))}
      </div>
    </div>
    </>)}

    
    {isBt && (<>
    <div data-screen-label="Backtest" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:14px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Backtest results</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>AI strategy vs OSEBX · Jan 2016 – Jul 2026 · monthly rebalance</span>
        <div style={css("flex:1;")}></div>
        <span className="mono" style={css("font-size:10.5px; color:#5B626C; border:1px solid #2A2F37; border-radius:20px; padding:3px 10px;")}>Simulated · not live results</span>
      </div>

      
      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px; margin-bottom:16px;")}>
        <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:8px;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Growth of NOK 100 000</span>
          <div style={css("flex:1;")}></div>
          <div className="mono" style={css("display:flex; align-items:center; gap:14px; font-size:11.5px; color:#9AA1AC;")}>
            <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:14px;height:3px;border-radius:2px;background:#3DBB84;")}></span>AI strategy · NOK 568k</span>
            <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:14px;height:3px;border-radius:2px;background:#4E5661;")}></span>OSEBX · NOK 301k</span>
          </div>
        </div>
        <svg viewBox="0 0 900 260" preserveAspectRatio="none" style={css("width:100%; height:250px; display:block;")}>
          <defs><linearGradient id="btgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3DBB84" stopOpacity="0.18"/><stop offset="100%" stopColor="#3DBB84" stopOpacity="0"/></linearGradient></defs>
          <line x1="0" y1="65" x2="900" y2="65" stroke="#20242B" strokeWidth="1"/>
          <line x1="0" y1="130" x2="900" y2="130" stroke="#20242B" strokeWidth="1"/>
          <line x1="0" y1="195" x2="900" y2="195" stroke="#20242B" strokeWidth="1"/>
          <polyline points="0,230 90,214 180,218 270,200 360,194 450,176 540,180 630,168 720,158 810,138 900,120" fill="none" stroke="#4E5661" strokeWidth="1.8"/>
          <path d="M0,230 L90,210 L180,216 L270,186 L360,176 L450,150 L540,168 L630,140 L720,108 L810,82 L900,48 L900,260 L0,260 Z" fill="url(#btgrad)"/>
          <polyline points="0,230 90,210 180,216 270,186 360,176 450,150 540,168 630,140 720,108 810,82 900,48" fill="none" stroke="#3DBB84" strokeWidth="2.4"/>
          <circle cx="900" cy="48" r="4" fill="#3DBB84"/>
        </svg>
        <div className="mono" style={css("display:flex; justify-content:space-between; font-size:10px; color:#5B626C; margin-top:4px;")}><span>2016</span><span>2018</span><span>2020</span><span>2022</span><span>2024</span><span>2026</span></div>
      </div>

      
      <div style={css("display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin-bottom:16px;")}>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>CAGR</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#3DBB84; margin-top:4px;")}>+17.9%</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Total return</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#3DBB84; margin-top:4px;")}>+468%</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Volatility</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#C79A3D; margin-top:4px;")}>19.8%</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Sharpe</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>1.28</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Sortino</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>1.71</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Max drawdown</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#E4655E; margin-top:4px;")}>−24.6%</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Alpha / yr</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#B79BFF; margin-top:4px;")}>+5.4%</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Beta</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>1.12</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Win rate (mo)</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>63%</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Best year</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#3DBB84; margin-top:4px;")}>+33.1%</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Worst year</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#E4655E; margin-top:4px;")}>−11.8%</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Turnover / yr</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>86%</div></div>
      </div>

      
      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
        <div style={css("display:flex; align-items:baseline; gap:10px; margin-bottom:14px;")}><span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Annual returns vs OSEBX</span><span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#5B626C;")}>strategy bar · benchmark in grey</span></div>
        {annualReturns.map((y, i) => (<React.Fragment key={i}>
          <div style={css("display:flex; align-items:center; gap:12px; margin-bottom:9px;")}>
            <span className="mono" style={css("width:52px; flex:0 0 auto; font-size:12px; color:#DDE1E7;")}>{y.year}</span>
            <div style={css("flex:1; height:12px; background:#1A1E24; border-radius:5px; position:relative; overflow:hidden;")}>{y.barEl}</div>
            <span className="mono" style={css("width:56px; text-align:right; flex:0 0 auto;")}>{y.stratEl}</span>
            <span className="mono" style={css("width:70px; text-align:right; flex:0 0 auto; font-size:11.5px; color:#7C8492;")}>OSEBX {y.bench}</span>
          </div>
        </React.Fragment>))}
      </div>
      <div style={css("font-size:11px; color:#5B626C; line-height:1.5; margin-top:12px;")}>Backtest applies the current signal model to historical prices with a monthly rebalance and modelled 0.05% per-trade cost. Simulated results assume perfect signal availability and do not represent actual returns; past performance is not indicative of future results.</div>
    </div>
    </>)}

  </div>

  
  {hasStock && (<>
  <div style={css("position:absolute; inset:0; background:rgba(6,8,11,0.55); z-index:40;")} onClick={closeStock}></div>
  <div data-screen-label="Stock detail" style={css("position:absolute; top:0; right:0; bottom:0; width:720px; background:#101317; border-left:1px solid #23272E; z-index:41; overflow-y:auto; box-shadow:-30px 0 60px rgba(0,0,0,0.4);")}>
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
        <button style={css("border:1px solid #2A2F37; background:#191D24; color:#DDE1E7; font-size:12.5px; padding:8px 13px; border-radius:8px; cursor:pointer; font-family:inherit;")}>＋ Watchlist</button>
        <button style={css("border:none; background:#2D5BD0; color:#fff; font-size:12.5px; padding:8px 13px; border-radius:8px; cursor:pointer; font-family:inherit;")}>Set alert</button>
        <span onClick={closeStock} style={css("width:32px; height:32px; border-radius:8px; background:#191D24; border:1px solid #2A2F37; display:flex; align-items:center; justify-content:center; color:#9AA1AC; cursor:pointer; font-size:16px;")}>✕</span>
      </div>
    </div>
    <div style={css("padding:16px 26px 6px;")}>
      <div className="mono" style={css("display:flex; gap:3px; font-size:11px; margin-bottom:10px;")}>
        <span style={css("padding:4px 10px; border-radius:5px; color:#8A929E; cursor:pointer;")}>1D</span>
        <span style={css("padding:4px 10px; border-radius:5px; background:#1D2229; color:#fff; cursor:pointer;")}>1W</span>
        <span style={css("padding:4px 10px; border-radius:5px; color:#8A929E; cursor:pointer;")}>1M</span>
        <span style={css("padding:4px 10px; border-radius:5px; color:#8A929E; cursor:pointer;")}>6M</span>
        <span style={css("padding:4px 10px; border-radius:5px; color:#8A929E; cursor:pointer;")}>1Y</span>
      </div>
      <svg viewBox="0 0 660 240" preserveAspectRatio="none" style={css("width:100%; height:240px; display:block;")}>
        <defs><linearGradient id="dtgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3DBB84" stopOpacity="0.26"/><stop offset="100%" stopColor="#3DBB84" stopOpacity="0"/></linearGradient></defs>
        <line x1="0" y1="60" x2="660" y2="60" stroke="#20242B" strokeWidth="1"/>
        <line x1="0" y1="120" x2="660" y2="120" stroke="#20242B" strokeWidth="1"/>
        <line x1="0" y1="180" x2="660" y2="180" stroke="#20242B" strokeWidth="1"/>
        <path d="M0,180 L44,172 L88,186 L132,150 L176,162 L220,128 L264,140 L308,104 L352,120 L396,88 L440,102 L484,66 L528,80 L572,52 L616,62 L660,38 L660,240 L0,240 Z" fill="url(#dtgrad)"/>
        <polyline points="0,180 44,172 88,186 132,150 176,162 220,128 264,140 308,104 352,120 396,88 440,102 484,66 528,80 572,52 616,62 660,38" fill="none" stroke="#3DBB84" strokeWidth="2.2"/>
        <circle cx="660" cy="38" r="4" fill="#3DBB84"/>
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
    {sHasThesis && (<>
    <div style={css("margin:16px 26px 0; border:1px solid #3B2F63; border-radius:12px; background:#120E22; overflow:hidden;")}>
      <div style={css("display:flex; align-items:center; gap:10px; padding:13px 18px; border-bottom:1px solid #221B38;")}>
        <span style={css("font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#B79BFF; font-weight:600;")}>Why the AI holds this</span>
        <span style={css("margin-left:auto;")}>{sRecoEl}</span>
      </div>
      <div style={css("padding:16px 18px;")}>
        <p style={css("font-size:13px; line-height:1.6; color:#DDE1E7; margin:0;")}>{sThesis}</p>
        
        <div className="mono" style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:0; margin-top:16px; border:1px solid #221B38; border-radius:10px; overflow:hidden;")}>
          <div style={css("padding:11px 13px; border-right:1px solid #221B38;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Allocation</div><div style={css("font-size:14px; color:#F2F4F7; margin-top:3px;")}>{sSize}</div></div>
          <div style={css("padding:11px 13px; border-right:1px solid #221B38;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Price target</div><div style={css("font-size:14px; color:#F2F4F7; margin-top:3px;")}>{sTarget}</div></div>
          <div style={css("padding:11px 13px; border-right:1px solid #221B38;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Upside</div><div style={css("font-size:14px; margin-top:3px;")}>{sUpsideEl}</div></div>
          <div style={css("padding:11px 13px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Held since</div><div style={css("font-size:14px; color:#F2F4F7; margin-top:3px;")}>{sSince}</div></div>
        </div>
        
        <div style={css("margin-top:14px;")}><span style={css("font-size:11px; color:#7C8492;")}>Role in portfolio · </span><span style={css("font-size:12.5px; color:#DDE1E7;")}>{sRole}</span></div>
        
        <div style={css("margin-top:16px;")}>
          <div style={css("font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:9px;")}>Signals behind the decision</div>
          {sDrivers.map((d, i) => (<React.Fragment key={i}>
            <div style={css("display:flex; gap:10px; align-items:flex-start; padding:8px 0; border-top:1px solid #1E1834;")}>
              <span style={css("flex:0 0 auto; margin-top:1px;")}>{d.sentEl}</span>
              <div style={css("min-width:0;")}><div style={css("font-size:12.5px; color:#DDE1E7; line-height:1.45;")}>{d.text}</div><div className="mono" style={css("font-size:10px; color:#5B626C; margin-top:3px;")}>{d.meta}</div></div>
            </div>
          </React.Fragment>))}
        </div>
        
        <div style={css("margin-top:16px;")}>
          <div style={css("font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:9px;")}>Key risks the AI is monitoring</div>
          {sRisks.map((rk, i) => (<React.Fragment key={i}>
            <div style={css("display:flex; gap:9px; align-items:flex-start; padding:6px 0;")}>
              <span style={css("color:#E4655E; font-size:12px; margin-top:1px; flex:0 0 auto;")}>▲</span>
              <span style={css("font-size:12.5px; color:#C7BFD6; line-height:1.45;")}>{rk}</span>
            </div>
          </React.Fragment>))}
        </div>
      </div>
    </div>
    </>)}
    <div style={css("padding:18px 26px;")}>
      <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Latest news</span>
      <div style={css("margin-top:12px; display:flex; flex-direction:column; gap:2px;")}>
        <div style={css("padding:12px 0; border-bottom:1px solid #191D23;")}><div style={css("font-size:13.5px; color:#DDE1E7; line-height:1.4; font-weight:500;")}>Equinor lifts quarterly dividend, unveils $1.2bn buyback</div><div className="mono" style={css("font-size:11px; color:#5B626C; margin-top:5px;")}>Reuters · 14:21</div></div>
        <div style={css("padding:12px 0; border-bottom:1px solid #191D23;")}><div style={css("font-size:13.5px; color:#DDE1E7; line-height:1.4; font-weight:500;")}>DNB Markets raises Equinor target to 340 NOK</div><div className="mono" style={css("font-size:11px; color:#5B626C; margin-top:5px;")}>E24 · 11:05</div></div>
        <div style={css("padding:12px 0;")}><div style={css("font-size:13.5px; color:#DDE1E7; line-height:1.4; font-weight:500;")}>Johan Castberg field starts production ahead of schedule</div><div className="mono" style={css("font-size:11px; color:#5B626C; margin-top:5px;")}>Bloomberg · Yesterday</div></div>
      </div>
    </div>
  </div>
  </>)}

</div>
  );
}
