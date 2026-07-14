import { describe, it, expect, beforeAll } from 'vitest';
import { isAlertRule, isTriggeredAlert, loadValidArray } from './storage';

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
