import { describe, it, expect } from 'vitest';
import { isValidLedger, LEDGER_VERSION } from './ledger';

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
