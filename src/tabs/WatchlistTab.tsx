import React from 'react';
import { css } from '../ui';

// Watchlist tab. Presentational; rows and mutations are supplied by Terminal.
export interface WatchRow {
  ticker: string;
  name: string;
  last: string;
  chg: React.ReactNode;
  bid: string;
  ask: string;
  vol: string;
  range: string;
  sparkEl: React.ReactNode;
  open: () => void;
}
export interface WatchlistTabProps {
  watchFull: WatchRow[];
  editWatch: boolean;
  setEditWatch: React.Dispatch<React.SetStateAction<boolean>>;
  addWatchSymbol: () => void;
  removeWatchSymbol: (sym: string) => void;
}

export default function WatchlistTab({ watchFull, editWatch, setEditWatch, addWatchSymbol, removeWatchSymbol }: WatchlistTabProps) {
  return (
    <div data-screen-label="Watchlist" className="screen" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:18px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Watchlist</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>{watchFull.length} instrument{watchFull.length === 1 ? '' : 's'} · NOK/USD</span>
        <div style={css("flex:1;")}></div>
        {watchFull.length > 0 && (
          <span onClick={() => setEditWatch((v) => !v)} className="mono" style={css(`cursor:pointer; font-size:12.5px; color:${editWatch ? '#EDEFF2' : '#8A929E'}; margin-right:10px;`)}>{editWatch ? 'Done' : 'Edit'}</span>
        )}
        <button onClick={addWatchSymbol} style={css("border:1px solid #2D5BD0; background:#2D5BD0; color:#fff; font-size:12.5px; font-weight:500; padding:7px 14px; border-radius:7px; cursor:pointer; font-family:inherit;")}>＋ Add symbol</button>
      </div>
      <div role="table" aria-label="Watchlist" aria-rowcount={watchFull.length} style={css("border:1px solid #23272E; border-radius:10px; overflow:hidden; background:#101317;")}>
        <div role="row" className="mono" style={css("display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1.4fr 100px; gap:10px; padding:10px 18px; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #23272E; background:#0E1013;")}>
          <span role="columnheader">Symbol</span><span role="columnheader" style={css("text-align:right;")}>Last</span><span role="columnheader" style={css("text-align:right;")}>Chg %</span><span role="columnheader" style={css("text-align:right;")}>Bid</span><span role="columnheader" style={css("text-align:right;")}>Ask</span><span role="columnheader" style={css("text-align:right;")}>Volume</span><span role="columnheader" style={css("text-align:right;")}>Day range</span><span role="columnheader" style={css("text-align:right;")}>7d</span>
        </div>
        {watchFull.length === 0 && (
          <div style={css("padding:28px 18px; text-align:center; font-size:13px; color:#5B626C;")}>Your watchlist is empty. Click “＋ Add symbol” to start tracking instruments.</div>
        )}
        {watchFull.map((r, i) => (<React.Fragment key={i}>
          <div role="row" onClick={editWatch ? undefined : r.open} style={css(`display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr 1fr 1.4fr 100px; gap:10px; align-items:center; padding:12px 18px; border-bottom:1px solid #191D23; ${editWatch ? '' : 'cursor:pointer;'}`)} className="hov-b">
            <div role="cell"><span className="mono" style={css("font-weight:600; font-size:13.5px; color:#F2F4F7;")}>{r.ticker}</span> <span style={css("font-size:12px; color:#7C8492;")}>{r.name}</span></div>
            <span role="cell" className="mono" style={css("text-align:right; font-size:13.5px; color:#EDEFF2;")}>{r.last}</span>
            <span role="cell" className="mono" style={css("text-align:right; font-size:13px;")}>{r.chg}</span>
            <span role="cell" className="mono" style={css("text-align:right; font-size:13px; color:#9AA1AC;")}>{r.bid}</span>
            <span role="cell" className="mono" style={css("text-align:right; font-size:13px; color:#9AA1AC;")}>{r.ask}</span>
            <span role="cell" className="mono" style={css("text-align:right; font-size:13px; color:#9AA1AC;")}>{r.vol}</span>
            <span role="cell" className="mono" style={css("text-align:right; font-size:12.5px; color:#7C8492;")}>{r.range}</span>
            {editWatch ? (
              <span role="cell" onClick={(e) => { e.stopPropagation(); removeWatchSymbol(r.ticker); }} className="mono" style={css("justify-self:end; color:#E4655E; cursor:pointer; font-size:12.5px;")}>✕ Remove</span>
            ) : (
              <span role="cell" style={css("justify-self:end;")}>{r.sparkEl}</span>
            )}
          </div>
        </React.Fragment>))}
      </div>
    </div>
  );
}
