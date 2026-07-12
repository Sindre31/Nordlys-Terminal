// Vercel serverless proxy for headlines (free Yahoo Finance search API).

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';

export default async function handler(req, res) {
  const q = String(req.query.q || 'Oslo Bors').trim();
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=12&quotesCount=0&enableFuzzyQuery=false`;
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    const j = await r.json();
    const news = (j?.news || []).map((n) => ({
      title: n.title,
      publisher: n.publisher || '',
      time: n.providerPublishTime || null,
      link: n.link || '',
      tickers: n.relatedTickers || [],
    }));
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    res.status(200).json({ news });
  } catch {
    res.status(200).json({ news: [] });
  }
}
