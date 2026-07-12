// Company fundamentals for the featured report card, via Yahoo quoteSummary
// (free cookie+crumb handshake, no key). Falls back to {} on error.

const UA = 'Mozilla/5.0 (compatible; NordlysTerminal/1.0)';

async function getCrumb() {
  const r1 = await fetch('https://fc.yahoo.com', { headers: { 'User-Agent': UA } });
  const setCookies =
    typeof r1.headers.getSetCookie === 'function'
      ? r1.headers.getSetCookie()
      : [r1.headers.get('set-cookie')].filter(Boolean);
  const cookie = setCookies.map((c) => String(c).split(';')[0]).join('; ');
  const r2 = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': UA, Cookie: cookie },
  });
  return { cookie, crumb: (await r2.text()).trim() };
}

export default async function handler(req, res) {
  const symbol = String(req.query.symbol || 'DNB.OL').trim();
  let out = {};
  try {
    const { cookie, crumb } = await getCrumb();
    if (crumb && !/error|<html/i.test(crumb)) {
      const modules = 'financialData,defaultKeyStatistics,summaryDetail,earnings,incomeStatementHistory';
      const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
      const r = await fetch(url, { headers: { 'User-Agent': UA, Cookie: cookie } });
      const j = await r.json();
      const s = j?.quoteSummary?.result?.[0];
      if (s) {
        const fd = s.financialData || {};
        const ks = s.defaultKeyStatistics || {};
        const sd = s.summaryDetail || {};
        const inc = s.incomeStatementHistory?.incomeStatementHistory || [];
        const yearly = s.earnings?.financialsChart?.yearly || [];
        const q = s.earnings?.earningsChart?.quarterly || [];
        const lastQ = q[q.length - 1];
        out = {
          revenue: fd.totalRevenue?.raw ?? null,
          netIncome: inc[0]?.netIncome?.raw ?? null,
          eps: ks.trailingEps?.raw ?? null,
          roe: fd.returnOnEquity?.raw ?? null,
          dividendYield: sd.dividendYield?.raw ?? null,
          currency: fd.financialCurrency || 'NOK',
          revenueTrend: yearly.map((y) => y.revenue?.raw ?? 0).filter((v) => v > 0),
          beat: lastQ && lastQ.actual?.raw != null && lastQ.estimate?.raw != null ? lastQ.actual.raw >= lastQ.estimate.raw : null,
        };
      }
    }
  } catch {
    out = {};
  }
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).json({ fundamentals: out });
}
