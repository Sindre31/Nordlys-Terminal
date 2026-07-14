import { describe, it, expect } from 'vitest';
import { isValidLedger, LEDGER_VERSION, rebaseBenchmark, type NavPoint } from './ledger';

const validLedger = {
  version: LEDGER_VERSION,
  inceptionDate: '14 Jul 2026',
  holdings: [{ ticker: 'EQNR', qty: 100, theme: 'Energy', costNok: 30000 }],
  cashNok: 10000,
  log: [],
  navHistory: [{ date: '2026-07-14', totalValue: 40000, bench: 1486 }],
  transactions: [],
};

describe('isValidLedger', () => {
  it('accepts a well-formed current-version ledger', () => {
    expect(isValidLedger(validLedger)).toBe(true);
  });

  it('rejects a ledger from an older schema version (would otherwise white-screen)', () => {
    expect(isValidLedger({ ...validLedger, version: 0 })).toBe(false);
    expect(isValidLedger({ ...validLedger, version: undefined })).toBe(false);
  });

  it('rejects a ledger missing a required array (e.g. navHistory), preventing a crash on load', () => {
    const { navHistory, ...noNav } = validLedger;
    void navHistory;
    expect(isValidLedger(noNav)).toBe(false);
    expect(isValidLedger({ ...validLedger, transactions: undefined })).toBe(false);
  });

  it('rejects non-object / null / corrupt values', () => {
    expect(isValidLedger(null)).toBe(false);
    expect(isValidLedger('{}')).toBe(false);
    expect(isValidLedger(42)).toBe(false);
    expect(isValidLedger([])).toBe(false);
  });
});

const nav = (totalValue: number, bench: number | null): NavPoint => ({ date: '2026-07-14', totalValue, bench });

describe('rebaseBenchmark', () => {
  it('anchors the benchmark to the portfolio starting NAV', () => {
    // NAV starts at 100k; OSEBX goes 1000 -> 1100 (+10%). Rebased bench should start at 100k
    // and end at 110k regardless of the raw index level.
    const { benchRebased, relPct } = rebaseBenchmark([nav(100000, 1000), nav(105000, 1100)]);
    expect(benchRebased[0]).toBe(100000);
    expect(benchRebased[1]).toBeCloseTo(110000, 6);
    // Portfolio +5% vs benchmark +10% => underperforming by ~5pp.
    expect(relPct).toBeCloseTo(-5, 6);
  });

  it('outperformance shows a positive relative return', () => {
    const { relPct } = rebaseBenchmark([nav(100000, 1000), nav(120000, 1050)]);
    // Portfolio +20% vs benchmark +5% => +15pp.
    expect(relPct).toBeCloseTo(15, 6);
  });

  it('anchors to the first snapshot that actually carries a benchmark level', () => {
    // First point predates the benchmark field (null); anchor is the second point (bench 1000).
    const hist = [nav(100000, null), nav(100000, 1000), nav(100000, 1200)];
    const { benchRebased } = rebaseBenchmark(hist);
    expect(benchRebased[0]).toBeNull();
    expect(benchRebased[1]).toBe(100000); // navStart × 1000/1000
    expect(benchRebased[2]).toBeCloseTo(120000, 6); // navStart × 1200/1000
  });

  it('returns null relPct when fewer than two benchmarked points exist', () => {
    expect(rebaseBenchmark([nav(100000, 1000)]).relPct).toBeNull();
    expect(rebaseBenchmark([nav(100000, null), nav(105000, null)]).relPct).toBeNull();
    expect(rebaseBenchmark([]).relPct).toBeNull();
    expect(rebaseBenchmark([]).benchRebased).toEqual([]);
  });

  it('does not divide by a zero benchmark base', () => {
    const { benchRebased } = rebaseBenchmark([nav(100000, 0), nav(100000, 1000)]);
    // bench base is 0 -> both null rather than Infinity/NaN.
    expect(benchRebased.every((v) => v === null)).toBe(true);
  });
});
