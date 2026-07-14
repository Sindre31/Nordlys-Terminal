import { describe, it, expect } from 'vitest';
import { weekKey, alignSeries } from './align';

describe('weekKey', () => {
  it('buckets a timestamp to the Monday of its ISO week', () => {
    // Wednesday 2026-01-14
    const wed = Date.UTC(2026, 0, 14, 22, 0, 0) / 1000;
    expect(weekKey(wed)).toBe('2026-01-12');
  });
  it('buckets timestamps from different exchanges the same week to the same key', () => {
    // Oslo Bors bar late Friday UTC vs a Nasdaq bar just after midnight the same week.
    const osloFriday = Date.UTC(2026, 0, 16, 22, 0, 0) / 1000;
    const nasdaqFriday = Date.UTC(2026, 0, 16, 4, 0, 0) / 1000;
    expect(weekKey(osloFriday)).toBe(weekKey(nasdaqFriday));
  });
});

describe('alignSeries', () => {
  it('forward-fills gaps so mismatched exchange calendars share one grid', () => {
    const mon1 = Date.UTC(2026, 0, 5) / 1000;
    const mon2 = Date.UTC(2026, 0, 12) / 1000;
    const mon3 = Date.UTC(2026, 0, 19) / 1000;
    const raw = {
      A: { timestamps: [mon1, mon2, mon3], closes: [10, 11, 12] },
      // B has no bar in week 2 (e.g. a holiday) — should forward-fill from week 1.
      B: { timestamps: [mon1, mon3], closes: [100, 102] },
    };
    const { weekKeys, series } = alignSeries(raw);
    expect(weekKeys).toHaveLength(3);
    expect(series.B).toEqual([100, 100, 102]);
    expect(series.A).toEqual([10, 11, 12]);
  });

  it('trims to the range where every ticker has already started trading', () => {
    const mon1 = Date.UTC(2026, 0, 5) / 1000;
    const mon2 = Date.UTC(2026, 0, 12) / 1000;
    const raw = {
      A: { timestamps: [mon1, mon2], closes: [10, 11] },
      B: { timestamps: [mon2], closes: [100] }, // IPO'd a week later
    };
    const { weekKeys, series } = alignSeries(raw);
    expect(weekKeys).toEqual([expect.stringMatching(/2026-01-12/)]);
    expect(series.A).toEqual([11]);
    expect(series.B).toEqual([100]);
  });
});
