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
