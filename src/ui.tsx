import React from 'react';

// Shared presentational primitives, extracted from the (large) Terminal component so they can be
// unit-tested and reused, and so Terminal.tsx exports only its component (keeps React Fast Refresh
// happy). These are pure — no component state.

// Parses a "prop:val; prop:val" string into a React style object. Lets the dense inline styling
// read like CSS without a styling dependency.
export function css(str: string): React.CSSProperties {
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

// Renders a price/percentage change with a direction arrow + explicit sign, so up/down survives
// without colour (colour-blind users, grayscale screenshots). A null change → an honest "—",
// never a fabricated 0.00%.
export function chgEl(chg: number | null, size?: number): React.ReactElement {
  if (chg == null) {
    return React.createElement('span', { className: 'mono', style: { color: '#8A929E', fontSize: size || 12 } }, '—');
  }
  const up = chg >= 0;
  return React.createElement(
    'span',
    {
      className: 'mono',
      'aria-label': `${up ? 'up' : 'down'} ${Math.abs(chg).toFixed(2)} percent`,
      style: { color: up ? '#3DBB84' : '#E4655E', fontSize: size || 12 },
    },
    `${up ? '▲' : '▼'} ${(up ? '+' : '') + chg.toFixed(2)}%`,
  );
}

// ---- Small pure formatters (shared by Terminal and the per-tab components) ----

export const pctColor = (v: number) => (v >= 0 ? '#3DBB84' : '#E4655E');
export const pctText = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
export const fmtK = (v: number) => 'NOK ' + Math.round(v / 1000) + 'k';
export const pctStr = (v: number, dec = 1) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(dec)}%`;

// ---- Badge / bar / pill element helpers (pure; moved out of Terminal.tsx) ----

export function deltaBadge(v: number | null | undefined) {
  if (v === null || v === undefined)
    return React.createElement('span', { className: 'mono', style: { color: '#9AA1AC', fontSize: 10 } }, '—');
  const up = v >= 0;
  return React.createElement(
    'span',
    { className: 'mono', style: { color: up ? '#3DBB84' : '#E4655E', fontSize: 10 } },
    (up ? '+' : '') + v.toFixed(1) + '%',
  );
}

export function factorBar(val: number) {
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
export function factorVal(val: number) {
  const up = val >= 0;
  // Format to one decimal so a non-integer factor value doesn't print a long float.
  const num = Number.isInteger(val) ? String(val) : val.toFixed(1);
  return React.createElement(
    'span',
    {
      className: 'mono',
      style: { fontSize: 12.5, fontWeight: 600, color: up ? '#3DBB84' : '#E4655E', width: 34, display: 'inline-block', textAlign: 'right' },
    },
    (up ? '+' : '') + num,
  );
}

export function spark(up: boolean) {
  const pts = up ? '0,16 16,14 32,17 48,10 64,8 80,4' : '0,7 16,9 32,8 48,13 64,15 80,18';
  const color = up ? '#3DBB84' : '#E4655E';
  return React.createElement(
    'svg',
    { viewBox: '0 0 80 22', style: { width: 80, height: 22 } },
    React.createElement('polyline', { points: pts, fill: 'none', stroke: color, strokeWidth: 1.6 }),
  );
}

export function sentBadge(kind: string) {
  const map: Record<string, [string, string]> = { Bullish: ['#3DBB84', '#12271F'], Bearish: ['#E4655E', '#2A1917'], Watch: ['#C79A3D', '#2A2314'] };
  const c = map[kind] || map.Watch;
  return React.createElement(
    'span',
    { className: 'mono', style: { color: c[0], background: c[1], borderRadius: 4, padding: '2px 7px', fontSize: 9.5, letterSpacing: '0.04em', textTransform: 'uppercase' } },
    kind,
  );
}
export function convBadge(kind: string) {
  const map: Record<string, [string, string]> = { High: ['#B79BFF', '#211B33'], Medium: ['#8A929E', '#1B1F25'], Trim: ['#E4655E', '#2A1917'] };
  const c = map[kind] || map.Medium;
  return React.createElement(
    'span',
    { className: 'mono', style: { color: c[0], background: c[1], borderRadius: 20, padding: '3px 10px', fontSize: 10.5 } },
    kind,
  );
}
export function askTag(ok: boolean) {
  if (ok) return null;
  return React.createElement(
    'span',
    { className: 'mono', style: { color: '#C79A3D', border: '1px solid #4A3E1E', background: '#211B0E', borderRadius: 20, padding: '1px 7px', fontSize: 9, letterSpacing: '0.03em', whiteSpace: 'nowrap' } },
    '◔ Outside ASK',
  );
}
export function dot(dir: number) {
  return React.createElement('span', {
    style: { display: 'block', width: 8, height: 8, borderRadius: 2, background: dir > 0 ? '#3DBB84' : dir < 0 ? '#E4655E' : '#7C5CFF' },
  });
}
export function actBadge(kind: string) {
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
export function upside(v: number) {
  if (!v) return React.createElement('span', { className: 'mono', style: { fontSize: 12.5, color: '#7C8492' } }, '—');
  const up = v >= 0;
  return React.createElement('span', { className: 'mono', style: { fontSize: 12.5, color: up ? '#3DBB84' : '#E4655E' } }, (up ? '+' : '') + v.toFixed(1) + '%');
}
export function rating(kind: string) {
  const map: Record<string, [string, string]> = { Buy: ['#3DBB84', '#12271F'], Sell: ['#E4655E', '#2A1917'], Hold: ['#8A929E', '#1B1F25'], Neutral: ['#8A929E', '#1B1F25'] };
  const c = map[kind] || map.Hold;
  return React.createElement(
    'span',
    { className: 'mono', style: { color: c[0], background: c[1], borderRadius: 5, padding: '3px 0', fontSize: 10.5, fontWeight: 600, width: 64, textAlign: 'center', display: 'inline-block' } },
    kind,
  );
}
export function hbar(pct: number, color: string) {
  return React.createElement('div', { style: { height: '100%', width: pct + '%', background: color, borderRadius: 5 } });
}
export function contribBar(v: number, max: number) {
  const up = v >= 0;
  const pct = Math.min((Math.abs(v) / max) * 50, 50);
  const line = React.createElement('div', { key: 'l', style: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: '#3A414B' } });
  const seg = React.createElement('div', {
    key: 's',
    style: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3, background: up ? '#3DBB84' : '#E4655E', left: up ? '50%' : 50 - pct + '%', width: pct + '%' },
  });
  return React.createElement('div', { style: { position: 'absolute', inset: 0 } }, line, seg);
}
export function ppVal(v: number) {
  const up = v >= 0;
  return React.createElement('span', { className: 'mono', style: { fontSize: 12.5, fontWeight: 600, color: up ? '#3DBB84' : '#E4655E' } }, (up ? '+' : '') + v.toFixed(1));
}
export function ccyPill(ccy: string) {
  const map: Record<string, [string, string]> = { NOK: ['#9AA1AC', '#1B1F25'], USD: ['#7FB0D8', '#12222E'], Mixed: ['#B79BFF', '#211B33'] };
  const c = map[ccy] || map.NOK;
  return React.createElement('span', { className: 'mono', style: { color: c[0], background: c[1], borderRadius: 5, padding: '2px 0', fontSize: 10.5, width: 52, textAlign: 'center', display: 'inline-block' } }, ccy);
}
export function fxRisk(kind: string) {
  const map: Record<string, [string, string]> = { None: ['#7C8492', '#1B1F25'], Medium: ['#C79A3D', '#2A2314'], High: ['#E4655E', '#2A1917'] };
  const c = map[kind] || map.None;
  return React.createElement('span', { className: 'mono', style: { color: c[0], background: c[1], borderRadius: 20, padding: '2px 0', fontSize: 10, width: 64, textAlign: 'center', display: 'inline-block' } }, kind);
}
export function side(kind: string) {
  const buy = kind === 'BUY';
  return React.createElement(
    'span',
    { className: 'mono', style: { color: buy ? '#3DBB84' : '#E4655E', background: buy ? '#12271F' : '#2A1917', borderRadius: 4, padding: '2px 0', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', width: 48, textAlign: 'center', display: 'inline-block' } },
    kind,
  );
}
export function scImpact(v: number) {
  const up = v >= 0;
  return React.createElement('span', { className: 'mono', style: { fontSize: 13.5, fontWeight: 600, color: up ? '#3DBB84' : '#E4655E' } }, (up ? '+' : '') + v.toFixed(1) + '%');
}
