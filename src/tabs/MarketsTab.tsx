import React from 'react';
import { css, pctColor, pctText } from '../ui';
import { fmtNum } from '../data';
import type { Quote, ChartPath } from '../data';
import type { TriggeredAlert } from '../storage';
import type { FeedItem } from './NewsTab';

// Markets tab — the three-pane trading desk (watchlist · index/sectors/movers · newsflow/alerts).
// Presentational; every value and callback is supplied by Terminal.
export interface MarketsWatchRow {
  ticker: string;
  name: string;
  last: string;
  chg: React.ReactNode;
  open: () => void;
}
export interface MoverRow { sym: string; chg: number }
export interface MarketsTabProps {
  watchlist: MarketsWatchRow[];
  editWatch: boolean;
  removeWatchSymbol: (sym: string) => void;
  addWatchSymbol: () => void;
  setEditWatch: React.Dispatch<React.SetStateAction<boolean>>;
  tfSpan: (label: string, rng: string, curRange: string, setRange: (r: string) => void, pad: string) => React.ReactNode;
  idxRange: string;
  setIdxRange: React.Dispatch<React.SetStateAction<string>>;
  osebx: Quote | undefined;
  idxPath: ChartPath | null;
  sectorTiles: { name: string; pct: number | null }[];
  gainers: MoverRow[];
  losers: MoverRow[];
  order: string[];
  open: (sym: string) => () => void;
  feedItems: FeedItem[];
  triggeredToday: TriggeredAlert[];
  condLabel: (t: { cond: 'above' | 'below' | 'pct'; price: number }) => string;
}

// Oslo Børs index-benchmark timeframes.
const TF_INDEX: [string, string][] = [['1D', '1d'], ['1W', '5d'], ['1M', '1mo'], ['1Y', '1y']];

// Maps a sector's daily change to a heat-tile colour set. Pure. A null pct (no live quote yet)
// renders a neutral, muted tile rather than implying a real move.
const sectorTile = (pct: number | null): { bg: string; label: string; val: string } => {
  if (pct == null) return { bg: '#15181D', label: '#5B626C', val: '#7C8492' };
  if (pct >= 1) return { bg: '#12583C', label: '#C8E6D8', val: '#fff' };
  if (pct >= 0.5) return { bg: '#134C36', label: '#C8E6D8', val: '#fff' };
  if (pct >= 0) return { bg: '#1B2C27', label: '#9FB4AB', val: '#DCEBE3' };
  if (pct > -0.5) return { bg: '#4A2320', label: '#EBC9C6', val: '#fff' };
  return { bg: '#5A2A26', label: '#EBC9C6', val: '#fff' };
};

export default function MarketsTab({
  watchlist, editWatch, removeWatchSymbol, addWatchSymbol, setEditWatch,
  tfSpan, idxRange, setIdxRange, osebx, idxPath, sectorTiles, gainers, losers, order, open,
  feedItems, triggeredToday, condLabel,
}: MarketsTabProps) {
  return (
    <div data-screen-label="Markets" className="screen markets-grid" style={css("position:absolute; inset:0; display:grid; grid-template-columns:340px 1fr 356px; min-height:0;")}>

      <div style={css("border-right:1px solid #23272E; display:flex; flex-direction:column; min-height:0;")}>
        <div style={css("display:flex; align-items:center; justify-content:space-between; padding:11px 14px; border-bottom:1px solid #23272E;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Watchlist</span>
          <span className="mono" style={css("font-size:11px; color:#5B626C;")}>{watchlist.length} · NOK</span>
        </div>
        <div className="mono" style={css("display:grid; grid-template-columns:52px 1fr 66px 62px; gap:6px; padding:6px 14px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #1A1E24;")}>
          <span>Ticker</span><span></span><span style={css("text-align:right;")}>Last</span><span style={css("text-align:right;")}>Chg</span>
        </div>
        <div style={css("overflow-y:auto; flex:1;")}>
          {watchlist.length === 0 && (
            <div style={css("padding:16px 14px; font-size:12px; color:#5B626C; line-height:1.5;")}>Your watchlist is empty. Use “+ Add symbol” below to start tracking instruments.</div>
          )}
          {watchlist.map((row, i) => (<React.Fragment key={i}>
            <div onClick={editWatch ? undefined : row.open} style={css(`display:grid; grid-template-columns:52px 1fr 66px 62px; gap:6px; align-items:center; padding:8px 14px; border-bottom:1px solid #191D23; ${editWatch ? '' : 'cursor:pointer;'}`)} className="hov-a">
              <span className="mono" style={css("font-weight:600; color:#F2F4F7; font-size:12.5px;")}>{row.ticker}</span>
              <span style={css("color:#7C8492; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;")}>{row.name}</span>
              {editWatch ? (
                <span onClick={(e) => { e.stopPropagation(); removeWatchSymbol(row.ticker); }} className="mono" style={css("grid-column:3 / span 2; justify-self:end; color:#E4655E; cursor:pointer; font-size:11px;")}>✕ Remove</span>
              ) : (<>
                <span className="mono" style={css("text-align:right; color:#EDEFF2; font-size:12.5px;")}>{row.last}</span>
                <span className="mono" style={css("text-align:right; font-size:12px;")} >{row.chg}</span>
              </>)}
            </div>
          </React.Fragment>))}
        </div>
        <div style={css("padding:10px 14px; border-top:1px solid #23272E; font-size:11px; color:#5B626C; display:flex; justify-content:space-between;")}>
          <span onClick={addWatchSymbol} style={css("cursor:pointer;")}>+ Add symbol</span><span className="mono" onClick={() => setEditWatch((v) => !v)} style={css("cursor:pointer;")}>Edit</span>
        </div>
      </div>


      <div style={css("border-right:1px solid #23272E; display:flex; flex-direction:column; min-height:0; overflow-y:auto;")}>
        <div style={css("padding:14px 18px 10px; border-bottom:1px solid #23272E;")}>
          <div style={css("display:flex; align-items:baseline; gap:12px;")}>
            <span style={css("font-size:16px; font-weight:600; color:#F2F4F7;")}>OSEBX</span>
            <span style={css("font-size:12px; color:#8A929E;")}>Oslo Børs Benchmark Index</span>
            <div style={css("flex:1;")}></div>
            <div className="mono" style={css("display:flex; gap:3px; font-size:11px;")}>
              {TF_INDEX.map(([label, rng]) => tfSpan(label, rng, idxRange, setIdxRange, 'padding:3px 8px;'))}
            </div>
          </div>
          <div style={css("display:flex; align-items:baseline; gap:10px; margin-top:6px;")}>
            <span className="mono" style={css("font-size:26px; font-weight:600; color:#F2F4F7;")}>{osebx ? fmtNum(osebx.price, 2) : '—'}</span>
            <span className="mono" style={css(`font-size:13px; color:${osebx ? pctColor(osebx.changePct) : '#8A929E'};`)}>{osebx ? `${osebx.change >= 0 ? '+' : ''}${fmtNum(osebx.change, 2)} (${pctText(osebx.changePct)})` : '—'}</span>
          </div>
        </div>
        <div style={css("padding:6px 6px 0; position:relative;")}>
          <svg viewBox="0 0 700 210" preserveAspectRatio="none" style={css("width:100%; height:210px; display:block;")}>
            <defs><linearGradient id="mkgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3DBB84" stopOpacity="0.28"/><stop offset="100%" stopColor="#3DBB84" stopOpacity="0"/></linearGradient></defs>
            <line x1="0" y1="52" x2="700" y2="52" stroke="#20242B" strokeWidth="1"/>
            <line x1="0" y1="105" x2="700" y2="105" stroke="#20242B" strokeWidth="1"/>
            <line x1="0" y1="158" x2="700" y2="158" stroke="#20242B" strokeWidth="1"/>
            {idxPath && <path d={idxPath.area} fill="url(#mkgrad)"/>}
            {idxPath && <polyline points={idxPath.line} fill="none" stroke={!idxPath.up ? '#E4655E' : '#3DBB84'} strokeWidth="2"/>}
          </svg>
          {!idxPath && <div style={css("position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:12px; color:#5B626C;")}>Loading OSEBX history…</div>}
        </div>
        <div style={css("padding:12px 18px 8px; border-top:1px solid #23272E;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Sectors today</span>
          <div style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-top:9px;")}>
            {sectorTiles.map((s, i) => {
              const c = sectorTile(s.pct);
              return (
                <div key={i} style={css(`background:${c.bg}; border-radius:5px; padding:9px 10px;`)}><div style={css(`font-size:11px; color:${c.label};`)}>{s.name}</div><div className="mono" style={css(`font-size:14px; font-weight:600; color:${c.val};`)}>{s.pct == null ? '—' : pctText(s.pct)}</div></div>
              );
            })}
          </div>
        </div>
        <div style={css("display:grid; grid-template-columns:1fr 1fr; border-top:1px solid #23272E;")}>
          <div style={css("border-right:1px solid #23272E; padding:11px 16px;")}>
            <span style={css("font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#3DBB84; font-weight:600;")}>▲ Top gainers</span>
            <div className="mono" style={css("margin-top:8px; font-size:12px;")}>
              {gainers.length === 0 && <div style={css("color:#5B626C; font-size:11.5px;")}>{order.length === 0 ? 'Add symbols to your watchlist' : 'Loading live prices…'}</div>}
              {gainers.map((g, i) => (
                <div key={i} onClick={open(g.sym)} style={css("display:flex; justify-content:space-between; padding:4px 0; cursor:pointer;")}><span style={css("color:#EDEFF2;")}>{g.sym}</span><span style={css(`color:${pctColor(g.chg)};`)}>{pctText(g.chg)}</span></div>
              ))}
            </div>
          </div>
          <div style={css("padding:11px 16px;")}>
            <span style={css("font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#E4655E; font-weight:600;")}>▼ Top losers</span>
            <div className="mono" style={css("margin-top:8px; font-size:12px;")}>
              {losers.length === 0 && <div style={css("color:#5B626C; font-size:11.5px;")}>{order.length === 0 ? 'Add symbols to your watchlist' : 'Loading live prices…'}</div>}
              {losers.map((g, i) => (
                <div key={i} onClick={open(g.sym)} style={css("display:flex; justify-content:space-between; padding:4px 0; cursor:pointer;")}><span style={css("color:#EDEFF2;")}>{g.sym}</span><span style={css(`color:${pctColor(g.chg)};`)}>{pctText(g.chg)}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>


      <div style={css("display:flex; flex-direction:column; min-height:0;")}>
        <div style={css("display:flex; align-items:center; justify-content:space-between; padding:11px 14px; border-bottom:1px solid #23272E;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Newsflow</span>
          <span className="mono" style={css("font-size:11px; color:#5B626C;")}>Live</span>
        </div>
        <div style={css("overflow-y:auto; flex:1;")}>
          {feedItems.length === 0 && (
            <div style={css("padding:14px; font-size:11.5px; color:#5B626C; line-height:1.5;")}>Awaiting the live newswire (E24 · Oslo Børs)…</div>
          )}
          {feedItems.slice(0, 6).map((n, i) => (
            <a key={i} href={n.link || undefined} target="_blank" rel="noreferrer" style={css("display:block; padding:11px 14px; border-bottom:1px solid #191D23; text-decoration:none;")}>
              <div className="mono" style={css("display:flex; gap:8px; font-size:10.5px; color:#5B626C; margin-bottom:4px;")}><span style={css("color:#6FA8FF;")}>{n.ticker}</span><span>{n.time}</span><span style={css("color:#8A929E;")}>{n.source}</span></div>
              <div style={css("font-size:12.5px; line-height:1.4; color:#DDE1E7;")}>{n.title}</div>
            </a>
          ))}
        </div>
        <div style={css("border-top:1px solid #23272E;")}>
          <div style={css("padding:11px 14px 8px;")}><span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Triggered alerts</span></div>
          {triggeredToday.length === 0 && (
            <div style={css("padding:9px 14px 12px; font-size:12px; color:#5B626C;")}>No alerts triggered today.</div>
          )}
          {triggeredToday.slice(0, 2).map((t, i) => (
            <div key={i} style={css("padding:9px 14px; display:flex; align-items:center; gap:10px; border-top:1px solid #191D23;")}><span style={css(`width:8px; height:8px; border-radius:2px; background:${t.cond === 'below' ? '#E4655E' : '#3DBB84'}; flex:0 0 auto;`)}></span><span className="mono" style={css("font-size:12px; color:#EDEFF2;")}>{t.ticker}</span><span style={css("font-size:12px; color:#9AA1AC;")}>{condLabel(t)}</span><span className="mono" style={css("margin-left:auto; font-size:11px; color:#5B626C;")}>{t.at}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
