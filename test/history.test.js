import { describe, it, expect } from 'vitest';
import { dateKey } from '../api/history.js';

describe('dateKey', () => {
  it('buckets by UTC calendar date regardless of time of day', () => {
    const morning = Date.UTC(2026, 6, 14, 4, 0, 0) / 1000;
    const evening = Date.UTC(2026, 6, 14, 22, 0, 0) / 1000;
    expect(dateKey(morning)).toBe('2026-07-14');
    expect(dateKey(evening)).toBe('2026-07-14');
  });

  it('regression: Oslo Bors and NYSE/Nasdaq same-day bars now share a key', () => {
    // Oslo Bors marks its daily bar at market close (~15:30 CET => ~13:30-14:30 UTC).
    // NYSE/Nasdaq marks its bar hours later the same UTC calendar day.
    const oslo = Date.UTC(2026, 6, 14, 14, 0, 0) / 1000;
    const nyse = Date.UTC(2026, 6, 14, 20, 0, 0) / 1000;
    expect(dateKey(oslo)).toBe(dateKey(nyse));
  });

  it('does not collapse genuinely different days', () => {
    const day1 = Date.UTC(2026, 6, 14, 23, 0, 0) / 1000;
    const day2 = Date.UTC(2026, 6, 15, 1, 0, 0) / 1000;
    expect(dateKey(day1)).not.toBe(dateKey(day2));
  });
});
