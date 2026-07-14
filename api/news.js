// Norwegian financial news aggregator (no key). Combines:
//  - E24 RSS (general business/markets news)
//  - Oslo Børs Newsweb (official, ticker-tagged company disclosures)
// DN / Finansavisen / Hegnar only expose paywalled (auth-gated) RSS, so they
// can't be included from a free source.

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';

export function decode(v) {
  return v
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#248;|&oslash;/g, 'ø')
    .replace(/&#229;|&aring;/g, 'å')
    .replace(/&#230;|&aelig;/g, 'æ')
    .replace(/&#216;|&Oslash;/g, 'Ø')
    .replace(/&#197;|&Aring;/g, 'Å')
    .trim();
}
export function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]) : '';
}
export function attr(block, name, attrName) {
  const m = block.match(new RegExp(`<${name}[^>]*\\s${attrName}="([^"]*)"[^>]*/?>`, 'i'));
  return m ? decode(m[1]) : '';
}

async function fetchE24() {
  try {
    const r = await fetch('https://e24.no/rss', { headers: { 'User-Agent': UA } });
    const xml = await r.text();
    const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
    return blocks
      .map((b) => {
        const title = tag(b, 'title');
        const link = tag(b, 'link');
        const pub = tag(b, 'pubDate');
        const image = attr(b, 'enclosure', 'url');
        const t = pub ? Math.floor(Date.parse(pub) / 1000) : null;
        return title ? { title, link, time: isFinite(t) ? t : null, source: 'E24', ticker: '', image } : null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchNewsweb() {
  try {
    const fromDate = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const r = await fetch(`https://api3.oslo.oslobors.no/v1/newsreader/list?limit=30&fromDate=${fromDate}`, {
      headers: { 'User-Agent': UA },
    });
    const j = await r.json();
    return (j?.data?.messages || []).map((m) => ({
      title: m.title || '',
      link: m.messageId ? `https://newsweb.oslobors.no/message/${m.messageId}` : '',
      time: m.publishedTime ? Math.floor(Date.parse(m.publishedTime) / 1000) : null,
      source: 'Oslo Børs',
      ticker: m.issuerSign || '',
      image: '', // Newsweb disclosures carry no photo
    }));
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  const q = String(req.query.q || '').trim().toLowerCase();
  const ticker = String(req.query.ticker || '').trim().toUpperCase();

  const [e24, nw] = await Promise.all([fetchE24(), fetchNewsweb()]);
  let items = [...e24, ...nw].filter((n) => n.title);
  items.sort((a, b) => (b.time || 0) - (a.time || 0));

  // Per-stock filtering (stock detail): keep items matching the ticker or name.
  if (ticker || q) {
    const matched = items.filter(
      (n) => (ticker && n.ticker.toUpperCase() === ticker) || (q && n.title.toLowerCase().includes(q)),
    );
    if (matched.length >= 2) items = matched;
  }

  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
  res.status(200).json({ news: items.slice(0, 14) });
}
