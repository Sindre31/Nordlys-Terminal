// Persisted AI-portfolio ledger: the shape saved to localStorage plus its validation. Kept in
// its own module so the pure logic is unit-testable and the component file only exports a
// component (keeps React Fast Refresh happy).

export interface LedgerHolding {
  ticker: string;
  qty: number;
  theme: string;
  costNok: number;
}
export interface RebalanceAction {
  text: string;
  detail: string;
  dir: 1 | -1 | 0;
}
export interface RebalanceLogEntry {
  date: string;
  changes: string;
  reasoning: string;
  actions: RebalanceAction[];
}
export interface NavPoint {
  date: string;
  totalValue: number;
  bench: number | null; // OSEBX level on that date, for a rebased benchmark line (null if unavailable)
}
export interface LedgerTransaction {
  date: string;
  side: 'BUY' | 'SELL';
  ticker: string;
  qty: number;
  price: number;
  priceCcy: 'NOK' | 'USD';
  account: string;
}

// Bump whenever the ledger shape changes in a way old saved data can't satisfy. A persisted
// ledger with a different (or missing) version is discarded on load and re-seeded fresh, so a
// schema change can never white-screen a returning user.
export const LEDGER_VERSION = 1;

export interface PortfolioLedger {
  version: number;
  inceptionDate: string;
  holdings: LedgerHolding[];
  cashNok: number;
  log: RebalanceLogEntry[];
  navHistory: NavPoint[];
  transactions: LedgerTransaction[];
}

// Validates a value parsed from localStorage actually matches the current ledger shape before
// we trust it. Guards against schema drift and partially-written/corrupt data.
export function isValidLedger(v: unknown): v is PortfolioLedger {
  if (typeof v !== 'object' || v === null) return false;
  const l = v as Record<string, unknown>;
  return (
    l.version === LEDGER_VERSION &&
    typeof l.inceptionDate === 'string' &&
    typeof l.cashNok === 'number' &&
    Array.isArray(l.holdings) &&
    Array.isArray(l.log) &&
    Array.isArray(l.navHistory) &&
    Array.isArray(l.transactions)
  );
}
