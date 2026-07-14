import { describe, it, expect } from 'vitest';
import { monthKey } from './backtest.js';

describe('monthKey', () => {
  it('regression: an Oslo Bors month-end bar and a NYSE/Nasdaq bar just after UTC midnight land in the same month', () => {
    // Oslo Bors marks month-end at ~22:00 UTC on the last trading day of the month.
    const oslo = Date.UTC(2026, 5, 30, 22, 0, 0) / 1000; // 30 Jun 22:00 UTC
    // NYSE/Nasdaq marks the same month-end just after UTC midnight on the 1st.
    const nyse = Date.UTC(2026, 6, 1, 4, 0, 0) / 1000; // 1 Jul 04:00 UTC
    expect(monthKey(oslo)).toBe(monthKey(nyse));
    expect(monthKey(oslo)).toBe('2026-06');
  });

  it('does not misattribute a mid-month bar to the wrong month', () => {
    const midMonth = Date.UTC(2026, 6, 15, 12, 0, 0) / 1000;
    expect(monthKey(midMonth)).toBe('2026-07');
  });
});
