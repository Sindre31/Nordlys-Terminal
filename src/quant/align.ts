// Different exchanges (Oslo Bors vs Nasdaq/NYSE) trade on different holiday calendars and post
// weekly bars at different UTC hours, so raw Yahoo timestamps won't line up across tickers.
// This buckets every point into the Monday of its ISO week and forward-fills gaps so all series
// share one common weekly grid.

export function weekKey(epochSeconds: number): string {
  const d = new Date(epochSeconds * 1000);
  const day = d.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export interface RawSeries {
  timestamps: number[];
  closes: (number | null)[];
}

export interface AlignedSeries {
  weekKeys: string[];
  series: Record<string, number[]>;
}

export function alignSeries(raw: Record<string, RawSeries>): AlignedSeries {
  const perTicker: Record<string, Map<string, number>> = {};
  const allKeys = new Set<string>();
  const firstKeyPerTicker: string[] = [];

  for (const [ticker, data] of Object.entries(raw)) {
    const map = new Map<string, number>();
    for (let i = 0; i < data.timestamps.length; i++) {
      const close = data.closes[i];
      if (close == null) continue;
      const key = weekKey(data.timestamps[i]);
      map.set(key, close);
      allKeys.add(key);
    }
    perTicker[ticker] = map;
    const keys = Array.from(map.keys()).sort();
    if (keys.length > 0) firstKeyPerTicker.push(keys[0]);
  }

  // Trim to the range where every ticker has already started trading.
  const commonStart = firstKeyPerTicker.reduce((a, b) => (a > b ? a : b));
  const weekKeys = Array.from(allKeys).filter((k) => k >= commonStart).sort();

  const series: Record<string, number[]> = {};
  for (const ticker of Object.keys(raw)) {
    const map = perTicker[ticker];
    let last: number | null = null;
    const arr: number[] = [];
    for (const key of weekKeys) {
      if (map.has(key)) last = map.get(key)!;
      arr.push(last as number);
    }
    series[ticker] = arr;
  }

  return { weekKeys, series };
}
