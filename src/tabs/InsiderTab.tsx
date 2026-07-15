import React from 'react';
import { css } from '../ui';

// Insider-disclosures tab. Presentational only; all values are computed in Terminal.
export interface InsiderRow {
  date: string;
  ticker: string;
  company: string;
  title: string;
  sideEl: React.ReactNode;
  link: string;
}
export interface InsiderTabProps {
  insiderCount: number;
  insiderBuys: number;
  insiderSells: number;
  insiderDisclosuresLabel: string;
  insiderSentiment: string;
  insiderSentimentNote: string;
  insiderDisplay: InsiderRow[] | null;
}

export default function InsiderTab({
  insiderCount, insiderBuys, insiderSells, insiderDisclosuresLabel, insiderSentiment, insiderSentimentNote, insiderDisplay,
}: InsiderTabProps) {
  return (
    <div data-screen-label="Insider" className="screen" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:16px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Insider trades</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>Primary-insider disclosures · Oslo Børs · last 30 days</span>
        <div style={css("flex:1;")}></div>
        <div className="mono" style={css("display:flex; gap:4px; font-size:11.5px;")}>
          <span style={css("padding:5px 11px; border-radius:6px; background:#1D2229; color:#fff; cursor:pointer;")}>All</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Watchlist</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Buys</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Sells</span>
        </div>
      </div>

      <div className="m-grid4" style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px;")}>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Net insider flow · 30d</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>—</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>{insiderCount ? 'no transaction value in feed' : 'awaiting Newsweb feed'}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Buy / sell disclosures</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>{insiderCount ? `${insiderBuys} / ${insiderSells}` : '—'}</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>{insiderDisclosuresLabel}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Sentiment</div><div className="mono" style={css(`font-size:21px; font-weight:600; margin-top:5px; color:${insiderCount ? '#3DBB84' : '#8A929E'};`)}>{insiderCount ? insiderSentiment : '—'}</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>{insiderSentimentNote}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Largest transaction</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>—</div><div className="mono" style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>{insiderCount ? 'no transaction value in feed' : 'awaiting Newsweb feed'}</div></div>
      </div>

      <div style={css("display:flex; align-items:center; gap:12px; border:1px solid #2A2F37; background:#101317; border-radius:12px; padding:13px 16px; margin-bottom:18px;")}>
        <span style={css("width:8px; height:8px; border-radius:2px; background:#8A929E; flex:0 0 auto;")}></span>
        <span style={css("font-size:13px; color:#DDE1E7;")}><span style={css("font-weight:600; color:#9AA1AC;")}>Note.</span> {insiderBuys + insiderSells > 0
          ? `${insiderBuys} buy / ${insiderSells} sell insider disclosure(s) classified from recent Oslo Børs Newsweb filings.`
          : 'No recent Newsweb disclosures could be classified as buys or sells.'} Insider activity is shown for context only — it is not an input to the AI's factor model (momentum, trend, low-volatility, value &amp; quality).</span>
      </div>

      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
        {insiderDisplay ? (
          <div role="table" aria-label="Insider disclosures">
            <div role="row" className="mono" style={css("display:grid; grid-template-columns:70px 1.6fr 4fr 66px; gap:12px; padding:10px 18px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #23272E; background:#0E1013;")}>
              <span role="columnheader">Date</span><span role="columnheader">Company</span><span role="columnheader">Disclosure · Oslo Børs Newsweb</span><span role="columnheader" style={css("text-align:center;")}>Side</span>
            </div>
            {insiderDisplay.map((t, i) => (<React.Fragment key={i}>
              <a role="row" href={t.link || undefined} target="_blank" rel="noreferrer" style={css("display:grid; grid-template-columns:70px 1.6fr 4fr 66px; gap:12px; align-items:center; padding:12px 18px; border-bottom:1px solid #191D23; text-decoration:none; cursor:pointer;")} className="hov-b">
                <span role="cell" className="mono" style={css("font-size:12px; color:#9AA1AC;")}>{t.date}</span>
                <div role="cell" style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{t.ticker}</span> <span style={css("font-size:11px; color:#7C8492; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;")}>{t.company}</span></div>
                <span role="cell" style={css("font-size:12px; color:#DDE1E7; line-height:1.35;")}>{t.title}</span>
                <span role="cell" style={css("text-align:center;")}>{t.sideEl}</span>
              </a>
            </React.Fragment>))}
          </div>
        ) : (
          <div style={css("padding:40px 18px; text-align:center;")}>
            <div className="mono" style={css("font-size:12px; color:#8A929E;")}>Awaiting the Oslo Børs Newsweb feed…</div>
            <div style={css("font-size:11.5px; color:#5B626C; margin-top:6px; line-height:1.5;")}>Primary-insider disclosures (Newsweb category 1102) load here as they publish. No trades are shown until the live feed responds — nothing on this screen is placeholder data.</div>
          </div>
        )}
      </div>
    </div>
  );
}
