// Official Norwegian macro data — Norges Bank open data API (no key required).

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';

export default async function handler(req, res) {
  const out = { policyRate: null };
  try {
    // Key policy rate (business frequency, latest observation), CSV.
    const r = await fetch(
      'https://data.norges-bank.no/api/data/IR/B.KPRA.SD.R?format=csv&lastNObservations=1',
      { headers: { 'User-Agent': UA } },
    );
    const txt = await r.text();
    const lines = txt.trim().split('\n');
    const header = lines[0].split(';');
    const idx = header.indexOf('OBS_VALUE');
    const last = lines[lines.length - 1].split(';');
    const rate = parseFloat(last[idx >= 0 ? idx : 12]);
    if (isFinite(rate)) out.policyRate = rate;
  } catch {
    /* leave null; UI falls back to designed value */
  }
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).json(out);
}
