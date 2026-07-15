import React from 'react';
import { css } from '../ui';

// Performance-attribution tab. Presentational only; all values computed in Terminal.
export interface ContribRow {
  ticker: string;
  barEl: React.ReactNode;
  valEl: React.ReactNode;
  open?: () => void;
}
export interface ThemeRow {
  label: string;
  barEl: React.ReactNode;
  valEl: React.ReactNode;
}
export interface AttributionTabProps {
  attrTotalStr: string;
  attrBenchStr: string;
  attrActiveStr: string;
  topContrib: { ticker: string } | undefined;
  topContribStr: string;
  attrDecomp: { label: string; val: string; color: string }[];
  contribHoldings: ContribRow[];
  contribThemes: ThemeRow[];
}

export default function AttributionTab({
  attrTotalStr, attrBenchStr, attrActiveStr, topContrib, topContribStr, attrDecomp, contribHoldings, contribThemes,
}: AttributionTabProps) {
  return (
    <div data-screen-label="Attribution" className="screen" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:16px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Performance attribution</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>Current holdings vs OSEBX · trailing 1 year, hypothetical — the portfolio's own inception is today</span>
      </div>

      <div className="m-grid4" style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px;")}>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Total return</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#3DBB84; margin-top:5px;")}>{attrTotalStr}</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>if held 1y at current weights</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Benchmark · OSEBX</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#9AA1AC; margin-top:5px;")}>{attrBenchStr}</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>price index · 1y</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#141026; border-color:#3B2F63; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Active return (alpha)</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#B79BFF; margin-top:5px;")}>{attrActiveStr}</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>vs OSEBX</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Top contributor</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>{topContrib ? topContrib.ticker : 'KOG'}</div><div className="mono" style={css("font-size:11px; color:#3DBB84; margin-top:2px;")}>{topContribStr}</div></div>
      </div>

      <div className="m-split" style={css("display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start;")}>

        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
          <div style={css("display:flex; align-items:baseline; gap:10px; margin-bottom:14px;")}><span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Active return decomposition</span><span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#5B626C;")}>1y trailing</span></div>
          {attrDecomp.map((e, i) => (<React.Fragment key={i}>
            <div style={css("display:flex; align-items:center; gap:12px; margin-bottom:12px;")}>
              <span style={css("flex:1; font-size:12.5px; color:#DDE1E7;")}>{e.label}</span>
              <span className="mono" style={css(`font-size:14px; color:${e.color}; font-weight:600;`)}>{e.val}</span>
            </div>
          </React.Fragment>))}
          <div style={css("display:flex; align-items:center; gap:10px; margin-top:4px; padding-top:12px; border-top:1px solid #1E1834;")}>
            <span style={css("font-size:12.5px; color:#F2F4F7; font-weight:600;")}>Active (excess) return</span>
            <div style={css("flex:1;")}></div>
            <span className="mono" style={css("font-size:14px; color:#B79BFF; font-weight:600;")}>{attrActiveStr}</span>
          </div>
          <div style={css("font-size:10.5px; color:#5B626C; margin-top:12px; line-height:1.5;")}>A full Brinson allocation/selection split needs benchmark sector weights, which the free data doesn't expose. Shown here: real book vs OSEBX (1y); per-holding and per-theme contribution to the right.</div>
        </div>

        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
          <div style={css("display:flex; align-items:center; gap:10px; padding:12px 18px; border-bottom:1px solid #23272E;")}>
            <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Contribution by holding</span>
            <span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#5B626C;")}>weight × return, pp</span>
          </div>
          {contribHoldings.map((h, i) => (<React.Fragment key={i}>
            <div onClick={h.open} style={css("display:grid; grid-template-columns:112px 1fr 52px; gap:12px; align-items:center; padding:9px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
              <span className="mono" style={css("font-size:12.5px; color:#F2F4F7;")}><span style={css("font-weight:600;")}>{h.ticker}</span></span>
              <div style={css("height:10px; background:#1A1E24; border-radius:5px; position:relative; overflow:hidden;")}>{h.barEl}</div>
              <span style={css("text-align:right;")}>{h.valEl}</span>
            </div>
          </React.Fragment>))}
        </div>
      </div>

      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px; margin-top:18px;")}>
        <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:14px;")}>Contribution by theme</div>
        <div style={css("display:grid; grid-template-columns:1fr 1fr; column-gap:36px; row-gap:2px;")}>
          {contribThemes.map((t, i) => (<React.Fragment key={i}>
            <div style={css("display:flex; align-items:center; gap:12px; padding:8px 0;")}>
              <span style={css("width:110px; flex:0 0 auto; font-size:12.5px; color:#DDE1E7;")}>{t.label}</span>
              <div style={css("flex:1; height:10px; background:#1A1E24; border-radius:5px; position:relative; overflow:hidden;")}>{t.barEl}</div>
              <span style={css("width:52px; text-align:right; flex:0 0 auto;")}>{t.valEl}</span>
            </div>
          </React.Fragment>))}
        </div>
      </div>
    </div>
  );
}
