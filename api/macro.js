// Official Norwegian macro data — Norges Bank open data API (no key required).

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';

const CPI_QUERY = {
  query: [
    { code: 'Konsumgrp', selection: { filter: 'item', values: ['TOTAL'] } },
    { code: 'ContentsCode', selection: { filter: 'item', values: ['Tolvmanedersendring'] } },
    { code: 'Tid', selection: { filter: 'top', values: ['1'] } },
  ],
  response: { format: 'json-stat2' },
};

export default async function handler(req, res) {
  const out = { policyRate: null, cpi: null };
  // Norges Bank key policy rate (official, CSV).
  try {
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
    /* leave null */
  }
  // SSB consumer price index, 12-month change (official).
  try {
    const r = await fetch('https://data.ssb.no/api/v0/en/table/03013', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
      body: JSON.stringify(CPI_QUERY),
    });
    const j = await r.json();
    const v = j?.value?.[0];
    if (typeof v === 'number') out.cpi = v;
  } catch {
    /* leave null */
  }
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).json(out);
}
