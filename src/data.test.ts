import { describe, it, expect } from 'vitest';
import { computePortfolio, type Position, type QuoteMap, type Quote } from './data';

function q(price: number, changePct: number, currency = 'NOK'): Quote {
  return { price, prevClose: null, open: null, change: 0, changePct, dayHigh: null, dayLow: null, volume: null, currency, name: 'x' };
}

describe('computePortfolio', () => {
  it('defaults cost basis to today\'s value, so a fresh position starts at 0% since inception', () => {
    const live: QuoteMap = { 'EQNR.OL': q(300, 1.5) };
    const positions: Position[] = [{ ticker: 'EQNR', qty: 100, theme: 'Energy', fallbackNok: 30000 }];
    const port = computePortfolio(live, positions, 10000);
    expect(port.totalValue).toBeCloseTo(100 * 300 + 10000, 5);
    expect(port.sinceInception).toBeCloseTo(0, 8);
  });

  it('honours an explicit persisted cost basis, so real gains/losses accrue', () => {
    const live: QuoteMap = { 'EQNR.OL': q(330, 1.5) };
    const positions: Position[] = [
      { ticker: 'EQNR', qty: 100, theme: 'Energy', fallbackNok: 30000, costNok: 30000 },
    ];
    const port = computePortfolio(live, positions, 0);
    // Value rose from 30,000 (cost) to 33,000 (live) -> +10%.
    expect(port.totalValue).toBeCloseTo(33000, 5);
    expect(port.sinceInception).toBeCloseTo(10, 5);
  });

  it('converts USD holdings to NOK using the live USDNOK rate', () => {
    const live: QuoteMap = { 'LMT': q(500, 0, 'USD'), 'USDNOK=X': q(10, 0) };
    const positions: Position[] = [{ ticker: 'LMT', qty: 10, theme: 'Defence', fallbackNok: 40000 }];
    const port = computePortfolio(live, positions, 0);
    expect(port.totalValue).toBeCloseTo(10 * 500 * 10, 5);
  });

  it('falls back to fallbackNok when no live quote exists yet', () => {
    const live: QuoteMap = {};
    const positions: Position[] = [{ ticker: 'GLOBAL', qty: 0, theme: 'Global funds', fallbackNok: 50000 }];
    const port = computePortfolio(live, positions, 0);
    expect(port.totalValue).toBeCloseTo(50000, 5);
  });

  it('computes theme allocation percentages that sum to ~100', () => {
    const live: QuoteMap = { 'EQNR.OL': q(300, 0), 'KOG.OL': q(1000, 0) };
    const positions: Position[] = [
      { ticker: 'EQNR', qty: 100, theme: 'Energy', fallbackNok: 30000 },
      { ticker: 'KOG', qty: 10, theme: 'Defence', fallbackNok: 10000 },
    ];
    const port = computePortfolio(live, positions, 5000);
    const total = port.themeAlloc.reduce((s, t) => s + t.pct, 0);
    expect(total).toBeCloseTo(100, 5);
  });
});
