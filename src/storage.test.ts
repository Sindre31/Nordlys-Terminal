import { describe, it, expect, beforeAll } from 'vitest';
import { isAlertRule, isTriggeredAlert, loadValidArray, saveLS, loadLS, evaluateAlerts, type AlertRule } from './storage';

// Minimal in-memory localStorage so these pure helpers can be tested in the node environment.
beforeAll(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() {
        return store.size;
      },
    } as Storage;
  }
});

describe('isAlertRule', () => {
  it('accepts a well-formed rule', () => {
    expect(isAlertRule({ id: 1, ticker: 'EQNR', cond: 'above', price: 320 })).toBe(true);
  });
  it('rejects unknown conditions and wrong types', () => {
    expect(isAlertRule({ id: 1, ticker: 'EQNR', cond: 'sideways', price: 320 })).toBe(false);
    expect(isAlertRule({ id: '1', ticker: 'EQNR', cond: 'above', price: 320 })).toBe(false);
    expect(isAlertRule({ id: 1, ticker: 'EQNR', cond: 'above' })).toBe(false);
    expect(isAlertRule(null)).toBe(false);
  });
});

describe('isTriggeredAlert', () => {
  it('accepts a well-formed trigger', () => {
    expect(isTriggeredAlert({ ruleId: 1, ticker: 'EQNR', cond: 'above', price: 320, date: '2026-07-14', at: '14:02' })).toBe(true);
  });
  it('rejects a trigger missing the date/at fields', () => {
    expect(isTriggeredAlert({ ruleId: 1, ticker: 'EQNR', cond: 'above', price: 320 })).toBe(false);
  });
});

describe('loadValidArray', () => {
  it('filters out corrupt items and keeps valid ones', () => {
    const key = 'test_alert_rules';
    localStorage.setItem(
      key,
      JSON.stringify([
        { id: 1, ticker: 'EQNR', cond: 'above', price: 320 },
        { id: 2, ticker: 'MOWI', cond: 'garbage', price: 190 }, // invalid cond
        'not an object',
      ]),
    );
    const out = loadValidArray(key, isAlertRule);
    expect(out).toHaveLength(1);
    expect(out[0].ticker).toBe('EQNR');
    localStorage.removeItem(key);
  });

  it('returns [] for a non-array / missing / corrupt value instead of throwing', () => {
    expect(loadValidArray('missing_key_xyz', isAlertRule)).toEqual([]);
    localStorage.setItem('bad_json', '{not json');
    expect(loadValidArray('bad_json', isAlertRule)).toEqual([]);
    localStorage.removeItem('bad_json');
  });
});

describe('saveLS', () => {
  it('round-trips a value through loadLS', () => {
    saveLS('rt_key', { a: 1, b: ['x'] });
    expect(loadLS('rt_key', null)).toEqual({ a: 1, b: ['x'] });
    localStorage.removeItem('rt_key');
  });

  it('never throws when setItem fails (e.g. private mode / quota exceeded)', () => {
    const original = localStorage.setItem;
    localStorage.setItem = () => {
      throw new DOMException('QuotaExceededError');
    };
    // Would crash the app (and trip the error boundary) without the internal try/catch.
    expect(() => saveLS('any', { big: 'payload' })).not.toThrow();
    localStorage.setItem = original;
  });
});

describe('evaluateAlerts', () => {
  const rules: AlertRule[] = [
    { id: 1, ticker: 'EQNR', cond: 'above', price: 320 },
    { id: 2, ticker: 'DNB', cond: 'below', price: 200 },
    { id: 3, ticker: 'MOWI', cond: 'pct', price: 5 },
    { id: 4, ticker: 'KOG', cond: 'above', price: 1000 },
  ];
  const quotes: Record<string, { price: number; changePct: number }> = {
    EQNR: { price: 325, changePct: 1.6 }, // above 320 → fires
    DNB: { price: 195, changePct: -2.5 }, // below 200 → fires
    MOWI: { price: 190, changePct: -6.2 }, // |−6.2| ≥ 5 → fires
    KOG: { price: 980, changePct: 0.2 }, // below 1000 → no fire
  };
  const quoteFor = (t: string) => quotes[t];

  it('fires above/below/pct rules that cross, skips those that do not', () => {
    const fresh = evaluateAlerts(rules, quoteFor, new Set(), '2026-07-15', '14:02');
    expect(fresh.map((f) => f.ruleId).sort()).toEqual([1, 2, 3]);
    expect(fresh[0]).toMatchObject({ ticker: 'EQNR', cond: 'above', date: '2026-07-15', at: '14:02' });
  });

  it('does not re-fire a rule already triggered today', () => {
    const fresh = evaluateAlerts(rules, quoteFor, new Set([1, 2]), '2026-07-15', '14:02');
    expect(fresh.map((f) => f.ruleId)).toEqual([3]);
  });

  it('skips rules whose ticker has no live quote (never a fabricated trigger)', () => {
    const fresh = evaluateAlerts(rules, () => undefined, new Set(), '2026-07-15', '14:02');
    expect(fresh).toEqual([]);
  });

  it('treats the pct condition as an absolute daily move (up or down)', () => {
    const r: AlertRule[] = [{ id: 9, ticker: 'X', cond: 'pct', price: 3 }];
    expect(evaluateAlerts(r, () => ({ price: 1, changePct: 3.1 }), new Set(), 'd', 't')).toHaveLength(1);
    expect(evaluateAlerts(r, () => ({ price: 1, changePct: -3.1 }), new Set(), 'd', 't')).toHaveLength(1);
    expect(evaluateAlerts(r, () => ({ price: 1, changePct: 2.9 }), new Set(), 'd', 't')).toHaveLength(0);
  });
});
