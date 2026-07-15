import React from 'react';
import { css, pctColor, pctText } from '../ui';
import { fmtNum } from '../data';
import type { Portfolio } from '../data';
import type { PortfolioLedger } from '../ledger';
import type { QuantModel, FactorZ } from '../quant/useQuantModel';

// AI Portfolio tab — the autonomous factor-model book: recommendations, conviction breakdown,
// NAV curve, rebalance history, holdings with factor z-scores, log, signal feed, actions, dividends.
// Presentational: every value and callback is computed in Terminal and passed in. The JSX is a
// verbatim move, so the rendered output is identical to the previous inline block.
export interface RecoRow { open?: () => void; actEl: React.ReactNode; ticker: string; name: string; askEl: React.ReactNode; nowTarget: string; upsideEl: React.ReactNode; reason: string }
export interface ConvFactorRow { label: string; why: string; barEl: React.ReactNode; valEl: React.ReactNode }
export interface RebalEventRow { select: () => void; cardStyle: string; date: string; changes: string; deltaEl: React.ReactNode }
export interface RbSelData { date: string; trigType: string; condition: string; reasoning: string; deltaEl: React.ReactNode; actions: { dotEl: React.ReactNode; text: string; detail: string }[] }
export interface AiHoldingRow { open?: () => void; ticker: string; name: string; askEl: React.ReactNode; type: string; alloc: string; value: string; chgEl: React.ReactNode; convEl: React.ReactNode; driver: string; factorZ: FactorZ }
export interface LogRow { date: string; sideEl: React.ReactNode; ticker: string; name: string; qty: string; price: string; account: string }
export interface SignalRow { cat: string; source: string; sentEl: React.ReactNode; text: string; tickers: string; time: string }
export interface ActionRow { dir: number; dotEl: React.ReactNode; text: string; time: string; why: string; basis: string; conf: string; impact: string }
export interface DivRow { ticker: string; ex: string; amount: string; yield: string }
export interface ReportRow { open?: () => void; ticker: string; period: string; date: string }
export interface NavChartData { navLine: string; navArea: string; benchLine: string | null; up: boolean; relStr: string | null }

export interface AiPortfolioTabProps {
  ledger: PortfolioLedger | null;
  port: Portfolio;
  quantModel: QuantModel;
  pendingRebalance: number;
  resetPortfolio: () => void;
  runRebalance: () => void;
  clickable: (onClick: () => void, label?: string) => Record<string, unknown>;
  factorChips: (fz: FactorZ) => React.ReactNode;
  themeColors: Record<string, string>;
  todayLabelStr: string;
  risk: 'conservative' | 'balanced' | 'aggressive';
  riskConsStyle: string;
  riskBalStyle: string;
  riskAggStyle: string;
  riskNote: string;
  setRiskCons: () => void;
  setRiskBal: () => void;
  setRiskAgg: () => void;
  sinceIncStr: string;
  showConv: boolean;
  toggleConv: () => void;
  convToggleLabel: string;
  convReady: boolean;
  convScore: string;
  convTilt: string;
  convNet: string;
  convStance: string;
  convFactors: ConvFactorRow[];
  aiRecos: RecoRow[];
  navChart: NavChartData | null;
  rebalEvents: RebalEventRow[];
  rbOpen: boolean;
  rbSel: RbSelData;
  aiHoldings: AiHoldingRow[];
  exportPortfolioCsv: () => void;
  portfolioLog: LogRow[];
  aiSignals: SignalRow[];
  aiActions: ActionRow[];
  divsLabel: string;
  divsDisplay: DivRow[];
  holdingReportsDisplay: ReportRow[];
}

export default function AiPortfolioTab({
  ledger, port, quantModel, pendingRebalance, resetPortfolio, runRebalance, clickable, factorChips, themeColors, todayLabelStr,
  risk, riskConsStyle, riskBalStyle, riskAggStyle, riskNote, setRiskCons, setRiskBal, setRiskAgg,
  sinceIncStr, showConv, toggleConv, convToggleLabel, convReady, convScore, convTilt, convNet, convStance, convFactors,
  aiRecos, navChart, rebalEvents, rbOpen, rbSel, aiHoldings, exportPortfolioCsv, portfolioLog,
  aiSignals, aiActions, divsLabel, divsDisplay, holdingReportsDisplay,
}: AiPortfolioTabProps) {
  return (
    <div data-screen-label="AI Portfolio" className="screen" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>

      <div style={css("display:flex; align-items:flex-start; gap:14px; margin-bottom:16px;")}>
        <div>
          <div style={css("display:flex; align-items:center; gap:10px;")}>
            <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>AI Portfolio</h2>
            <span style={css("font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:#B79BFF; border:1px solid #3B2F63; background:#211B33; border-radius:20px; padding:3px 9px;")}>Autonomous</span>
          </div>
          <p style={css("font-size:13px; color:#8A929E; margin:6px 0 0; max-width:620px; line-height:1.5;")}>Holdings are chosen by a systematic factor model — a composite of 6-month momentum, 13/52-week trend, low volatility, and a value &amp; quality tilt — scored across the tracked Oslo Børs and US universe, then equal-weighted into the top names for the chosen risk level. Non-EEA holdings are marked <span style={css("color:#C79A3D;")}>Outside ASK</span>. Illustrative, not investment advice.</p>
        </div>
        <div style={css("flex:1;")}></div>
        <div style={css("display:flex; flex-direction:column; align-items:flex-end; gap:8px;")}>
          <div style={css("display:flex; align-items:center; gap:8px;")}>
            {ledger && (
              <button onClick={resetPortfolio} style={css("border:1px solid #3A2A2A; background:#1A1214; color:#E4938E; font-size:12.5px; font-weight:500; padding:9px 14px; border-radius:8px; cursor:pointer; font-family:inherit;")}>Reset</button>
            )}
            <button onClick={runRebalance} disabled={!quantModel.ready} style={css(`position:relative; border:none; background:${quantModel.ready ? 'linear-gradient(135deg,#7C5CFF,#4B33C7)' : '#2A2F37'}; color:#fff; font-size:12.5px; font-weight:500; padding:9px 16px; border-radius:8px; cursor:${quantModel.ready ? 'pointer' : 'not-allowed'}; font-family:inherit;`)}>↻ Rebalance now{pendingRebalance > 0 && <span className="mono" style={css("margin-left:7px; background:rgba(255,255,255,0.22); border-radius:20px; padding:1px 7px; font-size:10.5px;")}>{pendingRebalance}</span>}</button>
          </div>
          <div className="mono" style={css("display:flex; align-items:center; gap:14px; font-size:11px; color:#5B626C;")}>
            <span>Last run {ledger?.log[0]?.date ?? '—'}</span>
            <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:7px;height:7px;border-radius:50%;background:#3DBB84;box-shadow:0 0 0 3px rgba(14,138,95,0.18);")}></span>Nordnet · live prices</span>
          </div>
        </div>
      </div>


      <div style={css("display:flex; align-items:center; gap:16px; border:1px solid #23272E; border-radius:12px; background:#101317; padding:12px 16px; margin-bottom:16px;")}>
        <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600; flex:0 0 auto;")}>AI risk level</span>
        <div style={css("display:flex; gap:4px; background:#0E1013; border:1px solid #23272E; border-radius:9px; padding:3px;")}>
          <span {...clickable(setRiskCons)} aria-pressed={risk === 'conservative'} style={css(riskConsStyle)}>Conservative</span>
          <span {...clickable(setRiskBal)} aria-pressed={risk === 'balanced'} style={css(riskBalStyle)}>Balanced</span>
          <span {...clickable(setRiskAgg)} aria-pressed={risk === 'aggressive'} style={css(riskAggStyle)}>Aggressive</span>
        </div>
        <span style={css("font-size:12px; color:#8A929E; line-height:1.4;")}>{riskNote}</span>
      </div>


      <div className="m-grid4" style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:16px;")}>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:15px 17px;")}><div style={css("font-size:11.5px; color:#7C8492;")}>Portfolio value</div>{ledger ? (<><div className="mono" style={css("font-size:23px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>NOK {fmtNum(port.totalValue, 0)}</div><div className="mono" style={css(`font-size:12px; color:${pctColor(port.sinceInception)}; margin-top:3px;`)}>{sinceIncStr} since inception</div></>) : (<><div className="skel" style={css("height:23px; width:150px; margin-top:6px;")}></div><div className="skel" style={css("height:12px; width:110px; margin-top:6px;")}></div></>)}</div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:15px 17px;")}><div style={css("font-size:11.5px; color:#7C8492;")}>Today</div>{ledger ? (<><div className="mono" style={css(`font-size:23px; font-weight:600; color:${pctColor(port.totalToday)}; margin-top:5px;`)}>{port.totalToday >= 0 ? '+' : '−'}{fmtNum(Math.abs(port.totalToday), 0)}</div><div className="mono" style={css(`font-size:12px; color:${pctColor(port.todayPct)}; margin-top:3px;`)}>{pctText(port.todayPct)}</div></>) : (<><div className="skel" style={css("height:23px; width:110px; margin-top:6px;")}></div><div className="skel" style={css("height:12px; width:70px; margin-top:6px;")}></div></>)}</div>
        <div onClick={toggleConv} style={css("border:1px solid #3B2F63; border-radius:12px; background:#141026; padding:15px 17px; cursor:pointer;")} className="hov-c"><div style={css("display:flex; align-items:center; gap:6px;")}><span style={css("font-size:11.5px; color:#7C8492;")}>AI conviction</span><span className="mono" style={css("margin-left:auto; font-size:10px; color:#B79BFF;")}>{convToggleLabel}</span></div><div className="mono" style={css("font-size:23px; font-weight:600; color:#B79BFF; margin-top:5px;")}>{convScore}</div><div style={css("font-size:12px; color:#8A929E; margin-top:3px;")}>{convTilt}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:15px 17px;")}><div style={css("font-size:11.5px; color:#7C8492;")}>Cash / next rebalance</div>{ledger ? (<><div className="mono" style={css("font-size:23px; font-weight:600; color:#F2F4F7; margin-top:5px;")}>{port.cashPct.toFixed(1)}%</div><div style={css(`font-size:12px; margin-top:3px; color:${pendingRebalance > 0 ? '#B79BFF' : '#8A929E'};`)}>{pendingRebalance > 0 ? `${pendingRebalance} change${pendingRebalance === 1 ? '' : 's'} pending — model selection drifted` : 'Holdings match the model'}</div></>) : (<><div className="skel" style={css("height:23px; width:80px; margin-top:6px;")}></div><div className="skel" style={css("height:12px; width:130px; margin-top:6px;")}></div></>)}</div>
      </div>


      {showConv && (<>
      <div style={css("border:1px solid #3B2F63; border-radius:12px; background:#120E22; padding:18px 20px; margin-bottom:16px;")}>
        <div style={css("display:flex; align-items:baseline; gap:12px; margin-bottom:4px;")}>
          <span style={css("font-size:14px; font-weight:600; color:#F2F4F7;")}>{convReady ? `Why conviction is ${convScore}` : 'Conviction breakdown'}</span>
          <span style={css("font-size:12px; color:#8A929E;")}>Weighted signal factors, rebased to a 0–100 risk-appetite score</span>
          <div style={css("flex:1;")}></div>
          <span onClick={toggleConv} style={css("font-size:11px; color:#B79BFF; cursor:pointer;")}>Hide ✕</span>
        </div>
        {convReady ? (<>
        <div style={css("display:grid; grid-template-columns:1fr 1fr; column-gap:36px; row-gap:2px; margin-top:12px;")}>
          {convFactors.map((f, i) => (<React.Fragment key={i}>
            <div style={css("display:flex; align-items:center; gap:14px; padding:10px 0; border-bottom:1px solid #1E1834;")}>
              <div style={css("width:150px; flex:0 0 auto;")}><div style={css("font-size:12.5px; color:#EDEFF2;")}>{f.label}</div><div style={css("font-size:10.5px; color:#7C8492; line-height:1.35; margin-top:2px;")}>{f.why}</div></div>
              <div style={css("flex:1; min-width:0;")}>{f.barEl}</div>
              <span style={css("flex:0 0 auto;")}>{f.valEl}</span>
            </div>
          </React.Fragment>))}
        </div>
        <div style={css("display:flex; align-items:center; gap:10px; margin-top:14px; padding-top:12px; border-top:1px solid #1E1834;")}>
          <span className="mono" style={css("font-size:11px; color:#7C8492;")}>Base 30</span>
          <span className="mono" style={css("font-size:11px; color:#7C8492;")}>+ net signals {convNet}</span>
          <div style={css("flex:1;")}></div>
          <span className="mono" style={css("font-size:13px; color:#B79BFF; font-weight:600;")}>= {convScore} · {convStance}</span>
        </div>
        </>) : (
          <div style={css("margin-top:12px; font-size:12.5px; color:#8A929E; line-height:1.55;")}>The conviction score builds from live signals — analyst upside &amp; breadth, price momentum vs OSEBX, the rates/CPI backdrop, realised volatility and concentration. It stays “—” until enough held names have live quotes and analyst coverage (at least three rated names). No placeholder factors or narrative are shown in the meantime.</div>
        )}
      </div>
      </>)}


      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden; margin-bottom:16px;")}>
        <div style={css("display:flex; align-items:center; gap:10px; padding:12px 18px; border-bottom:1px solid #23272E;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Recommendations — next actions</span>
          <span className="mono" style={css("font-size:10.5px; color:#5B626C;")}>AI-generated · not advice</span>
          <div style={css("flex:1;")}></div>
          <span className="mono" style={css("font-size:10.5px; color:#5B626C;")}>click a row for full thesis</span>
        </div>
        <div className="mono" style={css("display:grid; grid-template-columns:74px 2fr 1.3fr 0.9fr 2.4fr; gap:10px; padding:9px 18px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #191D23; background:#0E1013;")}>
          <span>Action</span><span>Instrument</span><span style={css("text-align:right;")}>Now → target</span><span style={css("text-align:right;")}>Upside</span><span>Rationale</span>
        </div>
        {aiRecos.length === 0 && (
          <div style={css("padding:16px 18px; font-size:12.5px; color:#5B626C;")}>{quantModel.ready ? 'No changes recommended — current holdings already match the model.' : 'Loading signals…'}</div>
        )}
        {aiRecos.map((rc, i) => (<React.Fragment key={i}>
          <div onClick={rc.open} style={css("display:grid; grid-template-columns:74px 2fr 1.3fr 0.9fr 2.4fr; gap:10px; align-items:center; padding:12px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
            <span>{rc.actEl}</span>
            <div style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:13px; color:#F2F4F7;")}>{rc.ticker}</span> <span style={css("font-size:12px; color:#7C8492;")}>{rc.name}</span> {rc.askEl}</div>
            <span className="mono" style={css("text-align:right; font-size:12.5px; color:#EDEFF2;")}>{rc.nowTarget}</span>
            <span style={css("text-align:right;")}>{rc.upsideEl}</span>
            <span style={css("font-size:11.5px; color:#9AA1AC; line-height:1.4;")}>{rc.reason}</span>
          </div>
        </React.Fragment>))}
      </div>


      <div className="m-split" style={css("display:grid; grid-template-columns:1fr 384px; gap:22px; align-items:start;")}>

        <div style={css("display:flex; flex-direction:column; gap:16px;")}>

          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("display:flex; align-items:baseline; gap:12px; margin-bottom:6px;")}>
              <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Rebalance history</span>
              <div style={css("flex:1;")}></div>
              <div className="mono" style={css("display:flex; align-items:center; gap:14px; font-size:11px; color:#9AA1AC;")}>
                <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:14px;height:3px;border-radius:2px;background:#3DBB84;")}></span>AI Portfolio</span>
                <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:14px;height:3px;border-radius:2px;background:#4E5661;")}></span>OSEBX</span>
                <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("color:#B79BFF;")}>◇</span>Rebalance</span>
              </div>
            </div>
            <div style={css("display:flex; align-items:baseline; gap:10px; margin-bottom:12px;")}>
              <span className="mono" style={css("font-size:22px; font-weight:600; color:#F2F4F7;")}>{sinceIncStr}</span>
              <span className="mono" style={css("font-size:12px; color:#8A929E;")}>since inception · {todayLabelStr}</span>
              {navChart?.relStr && <span className="mono" style={css(`font-size:12px; color:${navChart.relStr.startsWith('-') ? '#E4655E' : '#3DBB84'};`)}>{navChart.relStr}</span>}
            </div>
            {navChart ? (
              <svg viewBox="0 0 720 200" preserveAspectRatio="none" style={css("width:100%; height:190px; display:block; margin-bottom:8px;")}>
                <defs><linearGradient id="navgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={navChart.up ? '#3DBB84' : '#E4655E'} stopOpacity="0.20"/><stop offset="100%" stopColor={navChart.up ? '#3DBB84' : '#E4655E'} stopOpacity="0"/></linearGradient></defs>
                <path d={navChart.navArea} fill="url(#navgrad)"/>
                {navChart.benchLine && <polyline points={navChart.benchLine} fill="none" stroke="#4E5661" strokeWidth="1.8"/>}
                <polyline points={navChart.navLine} fill="none" stroke={navChart.up ? '#3DBB84' : '#E4655E'} strokeWidth="2.2"/>
              </svg>
            ) : (
              <div style={css("border:1px dashed #23272E; border-radius:10px; padding:22px 18px; text-align:center; margin-bottom:4px;")}>
                <div style={css("font-size:13px; color:#9AA1AC;")}>No performance history yet — the portfolio was built today.</div>
                <div style={css("font-size:11.5px; color:#5B626C; margin-top:4px;")}>A real equity curve accumulates here once per day you open the app.</div>
              </div>
            )}
            <div style={css("display:flex; align-items:center; gap:8px; margin-top:12px; margin-bottom:10px;")}><span style={css("font-size:10.5px; color:#7C8492;")}>{rebalEvents.length ? 'Click a rebalance to see what triggered it' : 'Loading…'}</span></div>
            <div style={css("display:flex; gap:8px; overflow-x:auto; padding-bottom:2px;")}>
              {rebalEvents.map((rb, i) => (<React.Fragment key={i}>
                <div onClick={rb.select} style={css(rb.cardStyle)}><div className="mono" style={css("font-size:10.5px; color:#B79BFF;")}>◇ {rb.date}</div><div style={css("font-size:11px; color:#DDE1E7; margin-top:2px;")}>{rb.changes}</div><div className="mono" style={css("font-size:10px; margin-top:1px;")}>{rb.deltaEl}</div></div>
              </React.Fragment>))}
            </div>
            {rbOpen && (<>
            <div style={css("margin-top:12px; border:1px solid #3B2F63; border-radius:10px; background:#120E22; padding:14px 16px;")}>
              <div style={css("display:flex; align-items:center; gap:10px; margin-bottom:10px;")}>
                <span className="mono" style={css("font-size:12px; color:#B79BFF; font-weight:600;")}>◇ {rbSel.date} rebalance</span>
                <span style={css("font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#C7BFD6; border:1px solid #3B2F63; background:#211B33; border-radius:20px; padding:2px 9px;")}>{rbSel.trigType}</span>
                <div style={css("flex:1;")}></div>
                <span className="mono" style={css("font-size:11px;")}>{rbSel.deltaEl}</span>
              </div>
              <div style={css("font-size:11px; color:#7C8492; margin-bottom:4px;")}>Trigger condition</div>
              <div className="mono" style={css("font-size:12.5px; color:#EDEFF2; background:#0E0B18; border:1px solid #221B38; border-radius:7px; padding:9px 11px;")}>{rbSel.condition}</div>
              <div style={css("font-size:11px; color:#7C8492; margin:12px 0 4px;")}>What the AI saw</div>
              <p style={css("font-size:12.5px; line-height:1.55; color:#DDE1E7; margin:0;")}>{rbSel.reasoning}</p>
              <div style={css("font-size:11px; color:#7C8492; margin:12px 0 8px;")}>Actions executed</div>
              {rbSel.actions.map((ac, i) => (<React.Fragment key={i}>
                <div style={css("display:flex; align-items:center; gap:10px; padding:6px 0; border-top:1px solid #1E1834;")}>
                  <span style={css("flex:0 0 auto;")}>{ac.dotEl}</span>
                  <span style={css("font-size:12.5px; color:#EDEFF2;")}>{ac.text}</span>
                  <span className="mono" style={css("margin-left:auto; font-size:11px; color:#9AA1AC;")}>{ac.detail}</span>
                </div>
              </React.Fragment>))}
            </div>
            </>)}
          </div>

          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
            <div style={css("display:flex; justify-content:space-between; align-items:baseline; margin-bottom:12px;")}><span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Current allocation</span><span className="mono" style={css("font-size:11px; color:#5B626C;")}>by theme</span></div>
            <div style={css("display:flex; height:14px; border-radius:6px; overflow:hidden; gap:2px;")}>
              {port.themeAlloc.map((t, i) => (
                <div key={i} style={css(`width:${t.pct}%; background:${themeColors[t.label] || '#3A414B'};`)}></div>
              ))}
            </div>
            <div className="mono" style={css("display:flex; flex-wrap:wrap; gap:14px; margin-top:12px; font-size:11.5px; color:#9AA1AC;")}>
              {port.themeAlloc.map((t, i) => (
                <span key={i} style={css("display:flex; align-items:center; gap:6px;")}><span style={css(`width:9px;height:9px;border-radius:2px;background:${themeColors[t.label] || '#3A414B'};`)}></span>{t.label} {t.pct.toFixed(1)}%</span>
              ))}
            </div>
          </div>

          <div role="table" aria-label="AI portfolio holdings" style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div role="row" className="mono" style={css("display:grid; grid-template-columns:2.2fr 0.8fr 1fr 0.9fr 1.1fr 1.4fr; gap:10px; padding:10px 18px; font-size:10.5px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #23272E; background:#0E1013;")}>
              <span role="columnheader">Holding</span><span role="columnheader" style={css("text-align:right;")}>Alloc</span><span role="columnheader" style={css("text-align:right;")}>Value</span><span role="columnheader" style={css("text-align:right;")}>Today</span><span role="columnheader" style={css("text-align:center;")}>Conviction</span><span role="columnheader">AI driver · factor z-scores</span>
            </div>
            <div style={css("display:flex; align-items:center; gap:8px; padding:7px 18px; border-bottom:1px solid #191D23; background:#0C0E11;")}>
              <span style={css("font-size:11px; color:#6B727C; line-height:1.4;")}>Each holding shows the cross-sectional factor z-scores behind its selection — <span className="mono" style={css("color:#8A929E;")}>Mom</span> (6-month momentum), <span className="mono" style={css("color:#8A929E;")}>Trend</span> (13/52-week), <span className="mono" style={css("color:#8A929E;")}>Low-vol</span> (inverted realized vol) and <span className="mono" style={css("color:#8A929E;")}>Val/Qual</span> (P/B inverted + ROE, today's snapshot). Higher is more favourable; “—” means the factor wasn't computable.</span>
            </div>
            <div style={css("display:flex; align-items:center; gap:8px; padding:8px 18px; border-bottom:1px solid #191D23; background:#0C0E11;")}>
              <span style={css("font-size:10.5px; color:#C79A3D; border:1px solid #4A3E1E; background:#211B0E; border-radius:20px; padding:2px 8px; letter-spacing:0.03em;")}>◔ Outside ASK</span>
              <span style={css("font-size:11px; color:#6B727C;")}>Non-EEA holdings (e.g. US shares) can't sit in an aksjesparekonto — booked on your Nordnet investeringskonto instead.</span>
            </div>
            {aiHoldings.map((h, i) => (<React.Fragment key={i}>
              <div role="row" onClick={h.open} style={css("display:grid; grid-template-columns:2.2fr 0.8fr 1fr 0.9fr 1.1fr 1.4fr; gap:10px; align-items:center; padding:12px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
                <div role="cell" style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:13px; color:#F2F4F7;")}>{h.ticker}</span> <span style={css("font-size:12px; color:#7C8492;")}>{h.name}</span> {h.askEl}<div style={css("font-size:10px; color:#5B626C; margin-top:1px;")}>{h.type}</div></div>
                <span role="cell" className="mono" style={css("text-align:right; font-size:13px; color:#EDEFF2;")}>{h.alloc}</span>
                <span role="cell" className="mono" style={css("text-align:right; font-size:12.5px; color:#9AA1AC;")}>{h.value}</span>
                <span role="cell" style={css("text-align:right;")}>{h.chgEl}</span>
                <span role="cell" style={css("text-align:center;")}>{h.convEl}</span>
                <div role="cell" style={css("min-width:0;")}><span style={css("font-size:11.5px; color:#9AA1AC;")}>{h.driver}</span>{factorChips(h.factorZ)}</div>
              </div>
            </React.Fragment>))}
            {aiHoldings.length === 0 && (
              <div style={css("padding:26px 18px; text-align:center; font-size:12.5px; color:#5B626C; line-height:1.5;")}>{quantModel.error ? `Factor model unavailable: ${quantModel.error}` : quantModel.ready ? 'No names currently clear the model’s bar — the book is sitting in cash.' : 'Loading the factor model on real weekly prices…'}</div>
            )}
          </div>

          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div style={css("display:flex; align-items:center; gap:10px; padding:12px 18px; border-bottom:1px solid #23272E;")}>
              <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Portfolio log</span>
              <span className="mono" style={css("font-size:10.5px; color:#5B626C;")}>executed transactions</span>
              <div style={css("flex:1;")}></div>
              <span onClick={exportPortfolioCsv} className="mono" style={css("font-size:10.5px; color:#6FA8FF; cursor:pointer;")}>Export CSV</span>
            </div>
            <div className="mono" style={css("display:grid; grid-template-columns:78px 62px 1.7fr 0.9fr 1fr 1.3fr; gap:10px; padding:9px 18px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #191D23; background:#0E1013;")}>
              <span>Date</span><span>Side</span><span>Instrument</span><span style={css("text-align:right;")}>Qty</span><span style={css("text-align:right;")}>Price</span><span>Account</span>
            </div>
            {portfolioLog.length === 0 && (
              <div style={css("padding:16px 18px; font-size:12.5px; color:#5B626C;")}>Loading…</div>
            )}
            {portfolioLog.map((t, i) => (<React.Fragment key={i}>
              <div style={css("display:grid; grid-template-columns:78px 62px 1.7fr 0.9fr 1fr 1.3fr; gap:10px; align-items:center; padding:10px 18px; border-bottom:1px solid #191D23;")}>
                <span className="mono" style={css("font-size:12px; color:#9AA1AC;")}>{t.date}</span>
                <span>{t.sideEl}</span>
                <div style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{t.ticker}</span> <span style={css("font-size:11.5px; color:#7C8492;")}>{t.name}</span></div>
                <span className="mono" style={css("text-align:right; font-size:12px; color:#EDEFF2;")}>{t.qty}</span>
                <span className="mono" style={css("text-align:right; font-size:12px; color:#9AA1AC;")}>{t.price}</span>
                <span style={css("font-size:11px; color:#7C8492;")}>{t.account}</span>
              </div>
            </React.Fragment>))}
          </div>
        </div>


        <div style={css("display:flex; flex-direction:column; gap:16px;")}>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div style={css("display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid #23272E;")}><span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Signal feed</span><span className="mono" style={css("font-size:10px; color:#7C8492;")} title="Sentiment is a keyword-based tag on live headlines, not a machine-learning score.">keyword-tagged · live headlines</span></div>
            {aiSignals.length === 0 && (
              <div style={css("padding:16px; font-size:12px; color:#5B626C; line-height:1.5;")}>Awaiting the live newswire (E24 · Oslo Børs). Headlines are tagged Bullish / Bearish / Watch by keyword — a simple heuristic, not a sentiment model.</div>
            )}
            {aiSignals.map((sg, i) => (<React.Fragment key={i}>
              <div style={css("padding:12px 16px; border-bottom:1px solid #191D23;")}>
                <div className="mono" style={css("display:flex; align-items:center; gap:8px; font-size:10px; margin-bottom:6px;")}><span style={css("color:#7C8492;")}>{sg.cat}</span><span style={css("color:#5B626C;")}>·</span><span style={css("color:#5B626C;")}>{sg.source}</span><span style={css("margin-left:auto;")}>{sg.sentEl}</span></div>
                <div style={css("font-size:12.5px; line-height:1.45; color:#DDE1E7;")}>{sg.text}</div>
                <div className="mono" style={css("display:flex; align-items:center; gap:8px; margin-top:7px; font-size:10.5px; color:#5B626C;")}><span style={css("color:#6FA8FF;")}>{sg.tickers}</span><span style={css("margin-left:auto;")}>{sg.time}</span></div>
              </div>
            </React.Fragment>))}
          </div>

          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div style={css("padding:12px 16px; border-bottom:1px solid #23272E; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Latest AI actions</div>
            {aiActions.length === 0 && (
              <div style={css("padding:14px 16px; font-size:12.5px; color:#5B626C;")}>{quantModel.ready ? 'No names currently clear the model’s bar — sitting in cash.' : 'Loading signals…'}</div>
            )}
            {aiActions.map((a, i) => (<React.Fragment key={i}>
              <div style={css("display:flex; gap:10px; padding:12px 16px; border-bottom:1px solid #191D23;")}>
                <span style={css("width:8px; height:8px; border-radius:2px; margin-top:5px; flex:0 0 auto;")} data-dot={a.dir}>{a.dotEl}</span>
                <div style={css("min-width:0; flex:1;")}>
                  <div style={css("display:flex; align-items:baseline; gap:8px;")}><div style={css("font-size:12.5px; color:#F2F4F7; line-height:1.4; font-weight:500;")}>{a.text}</div><span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#5B626C; flex:0 0 auto;")}>{a.time}</span></div>
                  <div style={css("font-size:11.5px; color:#9AA1AC; line-height:1.5; margin-top:5px;")}><span style={css("color:#B79BFF; font-weight:500;")}>Why: </span>{a.why}</div>
                  <div style={css("display:flex; align-items:center; gap:8px; margin-top:8px; flex-wrap:wrap;")}>
                    <span className="mono" style={css("font-size:9.5px; letter-spacing:0.04em; text-transform:uppercase; color:#7C8492; border:1px solid #2A2F37; border-radius:20px; padding:2px 8px;")}>Signal · {a.basis}</span>
                    <span className="mono" style={css("font-size:9.5px; letter-spacing:0.04em; text-transform:uppercase; color:#7C8492; border:1px solid #2A2F37; border-radius:20px; padding:2px 8px;")}>Confidence {a.conf}</span>
                    <span className="mono" style={css("font-size:9.5px; letter-spacing:0.04em; text-transform:uppercase; color:#7C8492; border:1px solid #2A2F37; border-radius:20px; padding:2px 8px;")}>Impact {a.impact}</span>
                  </div>
                </div>
              </div>
            </React.Fragment>))}
          </div>

          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div style={css("display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid #23272E;")}>
              <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Dividends &amp; reports</span>
            </div>
            <div style={css("padding:6px 16px 4px;")}><span className="mono" style={css("font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C;")}>{divsLabel}</span></div>
            {divsDisplay.length === 0 && (
              <div style={css("padding:8px 16px 12px; font-size:11.5px; color:#5B626C; line-height:1.5;")}>No dividend history from the live feed yet.</div>
            )}
            {divsDisplay.map((d, i) => (<React.Fragment key={i}>
              <div style={css("display:grid; grid-template-columns:56px 1fr auto auto; gap:10px; align-items:center; padding:9px 16px; border-bottom:1px solid #191D23;")}>
                <span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{d.ticker}</span>
                <span style={css("font-size:11px; color:#7C8492;")}>{d.ex}</span>
                <span className="mono" style={css("font-size:12px; color:#EDEFF2;")}>{d.amount}</span>
                <span className="mono" style={css("font-size:11px; color:#3DBB84; width:44px; text-align:right;")}>{d.yield}</span>
              </div>
            </React.Fragment>))}
            <div style={css("padding:12px 16px 4px;")}><span className="mono" style={css("font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C;")}>Reports — held names</span></div>
            {holdingReportsDisplay.length === 0 && (
              <div style={css("padding:8px 16px 12px; font-size:11.5px; color:#5B626C; line-height:1.5;")}>No confirmed upcoming earnings dates for held names yet.</div>
            )}
            {holdingReportsDisplay.map((r, i) => (<React.Fragment key={i}>
              <div onClick={r.open} style={css("display:grid; grid-template-columns:56px 1fr auto; gap:10px; align-items:center; padding:9px 16px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
                <span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{r.ticker}</span>
                <span style={css("font-size:11.5px; color:#DDE1E7;")}>{r.period}</span>
                <span className="mono" style={css("font-size:11px; color:#9AA1AC;")}>{r.date}</span>
              </div>
            </React.Fragment>))}
          </div>
          <div style={css("border:1px dashed #2A2F37; border-radius:12px; background:#0E1013; padding:13px 16px; font-size:11.5px; line-height:1.5; color:#6B727C;")}>
            <span style={css("color:#8A929E; font-weight:600;")}>Data sources.</span> Live prices, charts, dividends, analyst consensus &amp; earnings via Yahoo Finance; policy rate via Norges Bank; insider disclosures via Oslo Børs Newsweb; news via newswires. AI allocation &amp; signals are model-generated and not investment advice.
          </div>
        </div>
      </div>
    </div>
  );
}
