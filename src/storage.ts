// localStorage helpers + the persisted watchlist/alert shapes and their validation. Kept out of
// the component file so the pure logic is unit-testable and Terminal.tsx only exports a component.

export interface AlertRule {
  id: number;
  ticker: string;
  cond: 'above' | 'below' | 'pct';
  price: number;
}
export interface TriggeredAlert {
  ruleId: number;
  ticker: string;
  cond: 'above' | 'below' | 'pct';
  price: number;
  date: string;
  at: string;
}

export function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Loads a persisted array, keeping only items that pass a per-item shape check. Guards the
// watchlist/alerts localStorage against corrupt or schema-drifted data (same class of fragility
// the portfolio ledger is versioned against) — a bad entry is dropped rather than crashing a
// render that assumes the shape.
export function loadValidArray<T>(key: string, isItem: (v: unknown) => v is T): T[] {
  const raw = loadLS<unknown>(key, null);
  return Array.isArray(raw) ? raw.filter(isItem) : [];
}

export function isAlertRule(v: unknown): v is AlertRule {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === 'number' &&
    typeof r.ticker === 'string' &&
    (r.cond === 'above' || r.cond === 'below' || r.cond === 'pct') &&
    typeof r.price === 'number'
  );
}

export function isTriggeredAlert(v: unknown): v is TriggeredAlert {
  if (typeof v !== 'object' || v === null) return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.ruleId === 'number' &&
    typeof t.ticker === 'string' &&
    (t.cond === 'above' || t.cond === 'below' || t.cond === 'pct') &&
    typeof t.price === 'number' &&
    typeof t.date === 'string' &&
    typeof t.at === 'string'
  );
}
