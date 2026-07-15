import React from 'react';
import { fmtNum } from '../data';
import { css, pctColor, pctText, rowKeys } from '../ui';

// Currency-exposure tab. Presentational only — every value is computed in Terminal and passed in,
// so the rendered output is identical to the previous inline block.
export interface FxHoldingRow {
  ticker: string;
  name: string;
  ccy: string;
  weight: string;
  value: string;
  risk: string;
  ccyEl: React.ReactNode;
  riskEl: React.ReactNode;
  open?: () => void;
}
export interface FxTabProps {
  clock: { time: string; open: boolean };
  foreignPct: number;
  usdPct: number;
  ccyTotals: Record<string, number>;
  fxCurrencyRows: { label: string; value: number; pct: number; color: string }[];
  fxRates: { label: string; value: string | null; chgPct: number | null }[];
  fxHoldings: FxHoldingRow[];
}

export default function FxTab({ clock, foreignPct, usdPct, ccyTotals, fxCurrencyRows, fxRates, fxHoldings }: FxTabProps) {
  // First-order USD/NOK sensitivity: a 5% currency move revalues the USD-denominated slice of the
  // book by 5%, so portfolio impact ≈ (USD weight) × 5%. Derived from the real live USD exposure —
  // not a hardcoded figure.
  const fxSensPct = (usdPct / 100) * 5;
  return (
    <div data-screen-label="Currency" className="screen" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:16px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Currency exposure</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>AI Portfolio · reporting currency NOK · as of {clock.time}</span>
      </div>

      <div className="m-grid4" style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:18px;")}>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Foreign-currency exposure</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>{Math.round(foreignPct)}%</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>non-NOK holdings</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>USD exposure</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#2F6E90; margin-top:5px;")}>{Math.round(usdPct)}%</div><div className="mono" style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>NOK {fmtNum(ccyTotals.USD, 0)}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>Currency hedged</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#C79A3D; margin-top:5px;")}>0%</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>fully unhedged</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px;")}><div style={css("font-size:11px; color:#7C8492;")}>FX effect · YTD</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#8A929E; margin-top:5px;")}>—</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>needs cost-basis FX history</div></div>
      </div>

      <div className="m-split" style={css("display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start;")}>

        <div style={css("display:flex; flex-direction:column; gap:16px;")}>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:14px;")}>Exposure by currency</div>
            <div style={css("display:flex; height:16px; border-radius:6px; overflow:hidden; gap:2px; margin-bottom:14px;")}>
              {fxCurrencyRows.map((c, i) => (<div key={i} style={css(`width:${c.pct}%; background:${c.color};`)}></div>))}
            </div>
            {fxCurrencyRows.map((c, i) => (<React.Fragment key={i}>
              <div style={css("display:flex; align-items:center; gap:12px; margin-bottom:11px;")}>
                <span style={css(`display:block; width:12px; height:12px; border-radius:3px; flex:0 0 auto; background:${c.color};`)}></span>
                <span style={css("width:150px; flex:0 0 auto; font-size:12.5px; color:#DDE1E7;")}>{c.label}</span>
                <span className="mono" style={css("flex:1; text-align:right; font-size:12px; color:#9AA1AC;")}>NOK {fmtNum(c.value, 0)}</span>
                <span className="mono" style={css("width:44px; text-align:right; flex:0 0 auto; font-size:12.5px; color:#EDEFF2;")}>{c.pct.toFixed(0)}%</span>
              </div>
            </React.Fragment>))}
          </div>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:12px;")}>Reference rates</div>
            <div className="m-grid3" style={css("display:grid; grid-template-columns:repeat(3,1fr); gap:12px;")}>
              {fxRates.map((r, i) => (
                <div key={i} style={css("border:1px solid #23272E; border-radius:9px; padding:12px 13px;")}><div style={css("font-size:11.5px; color:#7C8492;")}>{r.label}</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>{r.value ?? '—'}</div><div className="mono" style={css(`font-size:11px; color:${r.chgPct == null ? '#5B626C' : pctColor(r.chgPct)}; margin-top:2px;`)}>{r.chgPct == null ? '· 1d' : `${pctText(r.chgPct)} · 1d`}</div></div>
              ))}
            </div>
          </div>

          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:6px;")}>FX sensitivity</div>
            <p style={css("font-size:12px; color:#8A929E; margin:0 0 12px; line-height:1.5;")}>Estimated portfolio impact from a move in USD/NOK, holdings unchanged.</p>
            <div className="mono" style={css("display:grid; grid-template-columns:1fr 1fr; gap:10px;")}>
              <div style={css("border:1px solid #23272E; border-radius:9px; padding:11px 13px;")}><div style={css("font-size:11px; color:#7C8492;")}>USD/NOK +5%</div><div style={css("font-size:16px; color:#3DBB84; margin-top:4px;")}>+{fxSensPct.toFixed(2)}%</div></div>
              <div style={css("border:1px solid #23272E; border-radius:9px; padding:11px 13px;")}><div style={css("font-size:11px; color:#7C8492;")}>USD/NOK −5%</div><div style={css("font-size:16px; color:#E4655E; margin-top:4px;")}>−{fxSensPct.toFixed(2)}%</div></div>
            </div>
          </div>
        </div>

        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
          <div style={css("display:flex; align-items:center; gap:10px; padding:12px 18px; border-bottom:1px solid #23272E;")}>
            <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Exposure by holding</span>
            <span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#5B626C;")}>local ccy → NOK</span>
          </div>
          <div role="table" aria-label="Currency exposure by holding">
          <div role="row" className="mono" style={css("display:grid; grid-template-columns:1.8fr 0.8fr 0.8fr 1.1fr 90px; gap:10px; padding:9px 18px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #191D23; background:#0E1013;")}>
            <span role="columnheader">Holding</span><span role="columnheader" style={css("text-align:center;")}>Ccy</span><span role="columnheader" style={css("text-align:right;")}>Weight</span><span role="columnheader" style={css("text-align:right;")}>Value (NOK)</span><span role="columnheader" style={css("text-align:right;")}>FX risk</span>
          </div>
          {fxHoldings.map((h, i) => (<React.Fragment key={i}>
            <div role="row" onClick={h.open} {...rowKeys(h.open, `Open ${h.ticker} details`)} style={css("display:grid; grid-template-columns:1.8fr 0.8fr 0.8fr 1.1fr 90px; gap:10px; align-items:center; padding:11px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
              <div role="cell" style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{h.ticker}</span> <span style={css("font-size:11.5px; color:#7C8492;")}>{h.name}</span></div>
              <span role="cell" style={css("text-align:center;")}>{h.ccyEl}</span>
              <span role="cell" className="mono" style={css("text-align:right; font-size:12px; color:#EDEFF2;")}>{h.weight}</span>
              <span role="cell" className="mono" style={css("text-align:right; font-size:12px; color:#9AA1AC;")}>{h.value}</span>
              <span role="cell" style={css("text-align:right;")}>{h.riskEl}</span>
            </div>
          </React.Fragment>))}
          </div>
        </div>
      </div>
    </div>
  );
}
