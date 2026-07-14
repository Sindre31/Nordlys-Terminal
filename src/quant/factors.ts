// Pure, testable building blocks for the factor model. All indices refer to positions in a
// chronologically ascending weekly close-price array; a null return means "not enough history yet".

export function trailingReturn(closes: number[], idx: number, weeks: number): number | null {
  const j = idx - weeks;
  if (j < 0 || closes[j] == null) return null;
  return closes[idx] / closes[j] - 1;
}

export function sma(closes: number[], idx: number, window: number): number | null {
  const start = idx - window + 1;
  if (start < 0) return null;
  let sum = 0;
  for (let k = start; k <= idx; k++) sum += closes[k];
  return sum / window;
}

// Annualized realized volatility of weekly returns over the trailing window.
export function realizedVol(closes: number[], idx: number, window: number): number | null {
  const start = idx - window + 1;
  if (start < 1) return null;
  const rets: number[] = [];
  for (let k = start; k <= idx; k++) rets.push(closes[k] / closes[k - 1] - 1);
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(variance) * Math.sqrt(52);
}

// Cross-sectional z-score across a universe at a single point in time. Entries with no value
// are excluded from the mean/stdev and pass through as null.
export function zScores(values: (number | null)[]): (number | null)[] {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length < 2) return values.map(() => null);
  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const sd = Math.sqrt(valid.reduce((a, b) => a + (b - mean) ** 2, 0) / valid.length) || 1;
  return values.map((v) => (v == null ? null : (v - mean) / sd));
}

export function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function stdev(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1));
}
