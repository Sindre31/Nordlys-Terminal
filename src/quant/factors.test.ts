import { describe, it, expect } from 'vitest';
import { trailingReturn, sma, realizedVol, zScores, mean, stdev } from './factors';

describe('trailingReturn', () => {
  it('computes the return over the trailing window', () => {
    const closes = [100, 105, 110, 121];
    expect(trailingReturn(closes, 3, 3)).toBeCloseTo(0.21, 5);
  });
  it('returns null when the window runs past the start of history', () => {
    const closes = [100, 105];
    expect(trailingReturn(closes, 1, 5)).toBeNull();
  });
});

describe('sma', () => {
  it('averages the trailing window', () => {
    expect(sma([10, 20, 30], 2, 3)).toBeCloseTo(20, 5);
  });
  it('returns null when there is not enough history', () => {
    expect(sma([10, 20], 1, 3)).toBeNull();
  });
});

describe('realizedVol', () => {
  it('returns null with fewer than two return observations', () => {
    expect(realizedVol([100, 101], 1, 5)).toBeNull();
  });
  it('is zero for a perfectly flat series', () => {
    const closes = [100, 100, 100, 100, 100];
    expect(realizedVol(closes, 4, 4)).toBeCloseTo(0, 8);
  });
  it('is positive for a series with varying returns', () => {
    const closes = [100, 110, 95, 115, 90];
    expect(realizedVol(closes, 4, 4)).toBeGreaterThan(0);
  });
});

describe('zScores', () => {
  it('mean-centers a cross-section', () => {
    const z = zScores([1, 2, 3]);
    const valid = z.filter((v): v is number => v != null);
    expect(valid.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 8);
  });
  it('passes nulls through untouched', () => {
    const z = zScores([1, null, 3]);
    expect(z[1]).toBeNull();
  });
  it('returns all nulls when fewer than two valid values', () => {
    expect(zScores([5, null, null])).toEqual([null, null, null]);
  });
});

describe('mean/stdev', () => {
  it('computes the mean', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });
  it('computes sample stdev', () => {
    expect(stdev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.1381, 3);
  });
});
