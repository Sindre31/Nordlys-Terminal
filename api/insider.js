// Primary-insider trades from the official Oslo Børs Newsweb API (no key).
// Category 1102 = "Managers' transaction" (meldepliktig handel for primærinnsidere).

import { fetchWithTimeout, rejectNonGet } from '../lib/http.js';

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';

function sideFromTitle(t) {
  const s = (t || '').toLowerCase();
  if (/(sale|sell|sold|salg|selg|dispos)/.test(s)) return 'SELL';
  if (/(purchase|buy|bought|kjøp|kjop|acqui|subscrib|tildel|award|grant)/.test(s)) return 'BUY';
  return '';
}

export default async function handler(req, res) {
  if (rejectNonGet(req, res)) return;
  const limit = Math.min(parseInt(String(req.query.limit || '14'), 10) || 14, 40);
  const fromDate = new Date(Date.now() - 45 * 864e5).toISOString().slice(0, 10);
  try {
    const url = `https://api3.oslo.oslobors.no/v1/newsreader/list?category=1102&limit=${limit}&fromDate=${fromDate}`;
    const r = await fetchWithTimeout(url, { headers: { 'User-Agent': UA } });
    const j = await r.json();
    const msgs = j?.data?.messages || [];
    const trades = msgs.map((m) => ({
      id: m.messageId,
      ticker: m.issuerSign || '',
      company: m.issuerName || '',
      title: m.title || '',
      date: m.publishedTime || '',
      side: sideFromTitle(m.title),
      link: m.messageId ? `https://newsweb.oslobors.no/message/${m.messageId}` : '',
    }));
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    res.status(200).json({ trades });
  } catch {
    res.status(200).json({ trades: [] });
  }
}
