import React from 'react';
import { css } from '../ui';
import { fmtNum } from '../data';

// Risk & exposure tab. Presentational; all metrics are computed in Terminal and passed in.
export interface BarRow { label: string; val: string; barEl: React.ReactNode }
export interface GeoRow { label: string; pct: number; color: string }
export interface ScenarioRow { name: string; how: string; hit: string; impactEl: React.ReactNode }
export interface FactorTiltRow { name: string; text: string; color: string }
export interface RiskTabProps {
  portTotalValue: number;
  clockTime: string;
  rBeta: string;
  rVol: string;
  rVolNote: string;
  rVar: string;
  rVarNok: string;
  rMdd: string;
  rSharpe: string;
  sectorExp: BarRow[];
  geoRows: GeoRow[];
  askPct: number;
  outsideAskPct: number;
  concExp: BarRow[];
  top5Pct: number;
  effBeta: number | null;
  scenarios: ScenarioRow[];
  factorTilt: FactorTiltRow[];
}

export default function RiskTab({
  portTotalValue, clockTime, rBeta, rVol, rVolNote, rVar, rVarNok, rMdd, rSharpe,
  sectorExp, geoRows, askPct, outsideAskPct, concExp, top5Pct, effBeta, scenarios, factorTilt,
}: RiskTabProps) {
  return (
    <div data-screen-label="Risk" className="screen" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:16px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Risk &amp; exposure</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>AI Portfolio · NOK {fmtNum(portTotalValue, 0)} · as of {clockTime}</span>
      </div>


      <div className="m-grid5" style={css("display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:18px;")}>
        <div title="Beta: how much the portfolio tends to move for each move in the OSEBX index. 1.0 = moves with the market; above 1 = more volatile than the market, below 1 = less." style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px; cursor:help;")}><div style={css("font-size:11px; color:#7C8492;")}>Portfolio beta</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>{rBeta}</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>vs OSEBX · 1y</div></div>
        <div title="Annualised volatility: how much the portfolio's value swings over a year (standard deviation of daily returns, annualised). Higher = a bumpier ride." style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px; cursor:help;")}><div style={css("font-size:11px; color:#7C8492;")}>Ann. volatility</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#C79A3D; margin-top:5px;")}>{rVol}</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>{rVolNote}</div></div>
        <div title="Value at Risk (95%, 1 day): on a typical day, the portfolio's loss is expected to stay smaller than this on 19 days out of 20. A statistical estimate, not a worst case." style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px; cursor:help;")}><div style={css("font-size:11px; color:#7C8492;")}>1-day VaR (95%)</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#E4655E; margin-top:5px;")}>{rVar}</div><div className="mono" style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>{rVarNok}</div></div>
        <div title="Max drawdown: the largest peak-to-trough drop over the past year — i.e. the worst losing streak from a high to the following low." style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px; cursor:help;")}><div style={css("font-size:11px; color:#7C8492;")}>Max drawdown</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#E4655E; margin-top:5px;")}>{rMdd}</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>1y trailing</div></div>
        <div title="Sharpe ratio: return earned above the risk-free rate per unit of volatility. Higher = better return for the risk taken; below 1 is modest." style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:14px 16px; cursor:help;")}><div style={css("font-size:11px; color:#7C8492;")}>Sharpe (1y)</div><div className="mono" style={css("font-size:21px; font-weight:600; color:#3DBB84; margin-top:5px;")}>{rSharpe}</div><div style={css("font-size:11px; color:#8A929E; margin-top:2px;")}>risk-adjusted</div></div>
      </div>

      <div className="m-split" style={css("display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start;")}>

        <div style={css("display:flex; flex-direction:column; gap:16px;")}>

          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:14px;")}>Exposure by sector</div>
            {sectorExp.map((e, i) => (<React.Fragment key={i}>
              <div style={css("display:flex; align-items:center; gap:12px; margin-bottom:11px;")}>
                <span style={css("width:96px; flex:0 0 auto; font-size:12.5px; color:#DDE1E7;")}>{e.label}</span>
                <div style={css("flex:1; height:9px; background:#1A1E24; border-radius:5px; overflow:hidden;")}>{e.barEl}</div>
                <span className="mono" style={css("width:42px; text-align:right; flex:0 0 auto; font-size:12.5px; color:#EDEFF2;")}>{e.val}</span>
              </div>
            </React.Fragment>))}
          </div>

          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:14px;")}>Geography &amp; currency</div>
            <div style={css("display:flex; height:16px; border-radius:6px; overflow:hidden; gap:2px; margin-bottom:12px;")}>
              {geoRows.map((g, i) => (<div key={i} style={css(`width:${g.pct}%; background:${g.color};`)}></div>))}
            </div>
            <div className="mono" style={css("display:flex; flex-wrap:wrap; gap:16px; font-size:11.5px; color:#9AA1AC;")}>
              {geoRows.map((g, i) => (
                <span key={i} style={css("display:flex; align-items:center; gap:6px;")}><span style={css(`width:9px;height:9px;border-radius:2px;background:${g.color};`)}></span>{g.label} {g.pct.toFixed(0)}%</span>
              ))}
            </div>
          </div>

          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; margin-bottom:14px;")}>Account eligibility</div>
            <div style={css("display:flex; height:16px; border-radius:6px; overflow:hidden; gap:2px; margin-bottom:12px;")}>
              {askPct > 0.05 && <div style={css(`width:${askPct}%; background:#3DBB84;`)}></div>}
              {outsideAskPct > 0.05 && <div style={css(`width:${outsideAskPct}%; background:#C79A3D;`)}></div>}
            </div>
            <div className="mono" style={css("display:flex; flex-wrap:wrap; gap:16px; font-size:11.5px; color:#9AA1AC;")}>
              <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#3DBB84;")}></span>Aksjesparekonto (EEA) {askPct.toFixed(0)}%</span>
              {outsideAskPct > 0.05 && <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:9px;height:9px;border-radius:2px;background:#C79A3D;")}></span>Investeringskonto · outside ASK {outsideAskPct.toFixed(0)}%</span>}
            </div>
          </div>
        </div>


        <div style={css("display:flex; flex-direction:column; gap:16px;")}>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("display:flex; align-items:baseline; gap:10px; margin-bottom:14px;")}><span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Concentration — top holdings</span><span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#C79A3D;")}>Top 5 = {top5Pct.toFixed(0)}%</span></div>
            {concExp.map((e, i) => (<React.Fragment key={i}>
              <div style={css("display:flex; align-items:center; gap:12px; margin-bottom:11px;")}>
                <span className="mono" style={css("width:64px; flex:0 0 auto; font-size:12.5px; color:#F2F4F7;")}>{e.label}</span>
                <div style={css("flex:1; height:9px; background:#1A1E24; border-radius:5px; overflow:hidden;")}>{e.barEl}</div>
                <span className="mono" style={css("width:42px; text-align:right; flex:0 0 auto; font-size:12.5px; color:#EDEFF2;")}>{e.val}</span>
              </div>
            </React.Fragment>))}
          </div>
          <div title="Factor tilt: the book's average exposure to each model factor, measured as the mean z-score across held names versus the tracked universe. 'High' means the holdings score well above average on that factor; 'Neutral' is around average." style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px; cursor:help;")}>
            <div style={css("display:flex; align-items:baseline; gap:8px; margin-bottom:12px;")}>
              <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Factor tilt</span>
              <span style={css("font-size:10.5px; color:#5B626C;")}>avg z-score of holdings</span>
            </div>
            <div className="mono" style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:8px; text-align:center;")}>
              {factorTilt.map((f, i) => (
                <div key={i}><div style={css("font-size:11px; color:#7C8492;")}>{f.name}</div><div style={css(`font-size:15px; color:${f.color}; margin-top:3px;`)}>{f.text}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>


      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden; margin-top:18px;")}>
        <div style={css("display:flex; align-items:center; gap:10px; padding:12px 18px; border-bottom:1px solid #23272E;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Scenario stress tests</span>
          <span className="mono" style={css("font-size:10.5px; color:#5B626C;")}>portfolio β {effBeta != null ? effBeta.toFixed(2) : '—'} × index move · first-order, excludes sector effects</span>
        </div>
        <div className="mono" style={css("display:grid; grid-template-columns:1.8fr 2.6fr 1fr 1.4fr; gap:12px; padding:9px 18px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #191D23; background:#0E1013;")}>
          <span>Scenario</span><span>Transmission</span><span style={css("text-align:right;")}>Impact</span><span>Most exposed</span>
        </div>
        {scenarios.map((sc, i) => (<React.Fragment key={i}>
          <div style={css("display:grid; grid-template-columns:1.8fr 2.6fr 1fr 1.4fr; gap:12px; align-items:center; padding:12px 18px; border-bottom:1px solid #191D23;")}>
            <span style={css("font-size:13px; color:#F2F4F7; font-weight:500;")}>{sc.name}</span>
            <span style={css("font-size:12px; color:#9AA1AC; line-height:1.4;")}>{sc.how}</span>
            <span style={css("text-align:right;")}>{sc.impactEl}</span>
            <span className="mono" style={css("font-size:11.5px; color:#6FA8FF;")}>{sc.hit}</span>
          </div>
        </React.Fragment>))}
      </div>
    </div>
  );
}
