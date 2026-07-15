import React from 'react';
import { css } from '../ui';

// Newsflow tab. Presentational only — headlines and macro are computed in Terminal and passed in.
// Empty feed renders an honest "awaiting the live newswire" state rather than placeholder stories.
export interface FeedItem {
  ticker: string;
  source: string;
  time: string;
  title: string;
  link: string;
  image: string;
}
export interface NewsTabProps {
  feedItems: FeedItem[];
  mostRead: { title: string; link: string }[];
  macro: { policyRate: number | null; cpi: number | null; bond10y: number | null };
}

export default function NewsTab({ feedItems, mostRead, macro }: NewsTabProps) {
  return (
    <div data-screen-label="News" className="screen" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:16px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Newsflow</h2>
        <div style={css("flex:1;")}></div>
        <div className="mono" style={css("display:flex; gap:4px; font-size:11.5px;")}>
          <span style={css("padding:5px 11px; border-radius:6px; background:#1D2229; color:#fff; cursor:pointer;")}>All</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Watchlist</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Macro</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Insider</span>
        </div>
      </div>
      <div className="m-split" style={css("display:grid; grid-template-columns:1.4fr 1fr; gap:22px; align-items:start;")}>

        <div>
          <div style={css("border:1px solid #23272E; border-radius:12px; overflow:hidden; background:#101317;")}>
            {feedItems.length === 0 ? (
              <div style={css("padding:34px 20px; text-align:center;")}><div className="mono" style={css("font-size:12.5px; color:#8A929E;")}>Awaiting the live newswire…</div><div style={css("font-size:11.5px; color:#5B626C; margin-top:6px; line-height:1.5;")}>Headlines from E24 &amp; Oslo Børs load here as they publish — no placeholder stories.</div></div>
            ) : (<>
              {feedItems[0]?.image ? (
                <img src={feedItems[0].image} alt={feedItems[0].title || 'News illustration'} style={css("width:100%; height:170px; object-fit:cover; display:block;")} />
              ) : (
                <div style={css("height:170px; background:repeating-linear-gradient(135deg,#171B21,#171B21 11px,#1B2027 11px,#1B2027 22px); display:flex; align-items:flex-end; padding:16px;")}></div>
              )}
              <a href={feedItems[0]?.link || undefined} target="_blank" rel="noreferrer" style={css("display:block; padding:18px 20px; text-decoration:none;")}>
                <div className="mono" style={css("display:flex; gap:9px; font-size:11px; color:#5B626C; margin-bottom:8px;")}><span style={css("color:#6FA8FF;")}>{feedItems[0]?.ticker}</span><span>{feedItems[0]?.source}</span><span>{feedItems[0]?.time}</span></div>
                <div style={css("font-size:18px; font-weight:600; line-height:1.35; color:#F2F4F7;")}>{feedItems[0]?.title}</div>
              </a>
            </>)}
          </div>
          <div style={css("margin-top:16px; border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            {feedItems.slice(1, 8).map((n, i) => (<React.Fragment key={i}>
              <a href={n.link || undefined} target="_blank" rel="noreferrer" style={css("display:flex; gap:14px; padding:14px 18px; border-bottom:1px solid #191D23; cursor:pointer; text-decoration:none;")} className="hov-b">
                {n.image ? (
                  <img src={n.image} alt={n.title || 'News illustration'} style={css("width:64px; height:52px; border-radius:7px; object-fit:cover; flex:0 0 auto;")} />
                ) : (
                  <div style={css("width:64px; height:52px; border-radius:7px; background:repeating-linear-gradient(135deg,#171B21,#171B21 7px,#1B2027 7px,#1B2027 14px); flex:0 0 auto;")}></div>
                )}
                <div style={css("min-width:0;")}>
                  <div className="mono" style={css("display:flex; gap:8px; font-size:10.5px; color:#5B626C; margin-bottom:4px;")}><span style={css("color:#6FA8FF;")}>{n.ticker}</span><span>{n.source}</span><span>{n.time}</span></div>
                  <div style={css("font-size:13.5px; line-height:1.4; color:#DDE1E7; font-weight:500;")}>{n.title}</div>
                </div>
              </a>
            </React.Fragment>))}
          </div>
        </div>

        <div style={css("display:flex; flex-direction:column; gap:16px;")}>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Most read</span>
            <div style={css("margin-top:12px; display:flex; flex-direction:column; gap:14px;")}>
              {mostRead.length ? mostRead.map((m, i) => (
                <a key={i} href={m.link || undefined} target="_blank" rel="noreferrer" style={css("display:flex; gap:12px; text-decoration:none;")}><span className="mono" style={css("font-size:16px; color:#3A414B; font-weight:600;")}>{String(i + 1).padStart(2, '0')}</span><span style={css("font-size:13px; line-height:1.4; color:#DDE1E7;")}>{m.title}</span></a>
              )) : (
                <span className="mono" style={css("font-size:11.5px; color:#5B626C; line-height:1.5;")}>Awaiting the live newswire (E24 · Oslo Børs)…</span>
              )}
            </div>
          </div>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Macro watch</span>
            <div className="mono" style={css("margin-top:12px; font-size:12.5px;")}>
              <div style={css("display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #191D23;")}><span style={css("color:#DDE1E7;")}>Norges Bank rate</span><span style={css("color:#F2F4F7;")}>{macro.policyRate != null ? macro.policyRate.toFixed(2) + '%' : '—'}</span></div>
              <div style={css("display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid #191D23;")}><span style={css("color:#DDE1E7;")}>CPI (YoY)</span><span style={css("color:#F2F4F7;")}>{macro.cpi != null ? macro.cpi.toFixed(1) + '%' : '—'}</span></div>
              <div style={css("display:flex; justify-content:space-between; padding:7px 0;")}><span style={css("color:#DDE1E7;")}>10y NOK gov bond</span><span style={css("color:#F2F4F7;")}>{macro.bond10y != null ? macro.bond10y.toFixed(2) + '%' : '—'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
