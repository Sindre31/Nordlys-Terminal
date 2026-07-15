import React from 'react';
import { type BacktestResult } from '../data';
import { type QuantModel } from '../quant/useQuantModel';
import { css, fmtK, pctStr } from '../ui';

// Backtest tab. Presentational only; all values computed in Terminal. btOk / bm / qmMetrics are
// derived here from the passed-in objects to keep the prop surface small.
export interface BtAnnualRow {
  year: string;
  barEl: React.ReactNode;
  stratEl: React.ReactNode;
  bench: string;
}
export interface QmSignalRow {
  actEl: React.ReactNode;
  ticker: string;
  name: string;
  upsideEl: React.ReactNode;
  reason: string;
}
export interface BacktestTabProps {
  backtest: BacktestResult;
  btChart: { bLine: string; pArea: string; p: string } | null;
  btm: Record<string, string>;
  btAnnual: BtAnnualRow[];
  qmTopN: number | undefined;
  risk: string;
  quantModel: QuantModel;
  qmStatusLabel: string;
  qmSignals: QmSignalRow[];
}

export default function BacktestTab({ backtest, btChart, btm, btAnnual, qmTopN, risk, quantModel, qmStatusLabel, qmSignals }: BacktestTabProps) {
  const btOk = backtest.ok && backtest.metrics && backtest.pEquity && backtest.bEquity;
  const bm = backtest.metrics;
  const qmMetrics = quantModel.backtest?.metrics;
  return (
    <div data-screen-label="Backtest" className="screen" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:14px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Backtest results</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>AI-weighted basket vs OSEBX · {btOk ? `${backtest.startYear}–${backtest.endYear}` : '2016–2026'} · monthly rebalance</span>
        <div style={css("flex:1;")}></div>
        <span className="mono" style={css("font-size:10.5px; color:#5B626C; border:1px solid #2A2F37; border-radius:20px; padding:3px 10px;")}>{btOk ? 'Real prices · Yahoo Finance' : 'Loading…'}</span>
      </div>

      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px; margin-bottom:16px;")}>
        <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:8px;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Growth of NOK 100 000</span>
          <div style={css("flex:1;")}></div>
          <div className="mono" style={css("display:flex; align-items:center; gap:14px; font-size:11.5px; color:#9AA1AC;")}>
            <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:14px;height:3px;border-radius:2px;background:#3DBB84;")}></span>AI basket · {btOk ? fmtK(bm!.finalValue) : '—'}</span>
            <span style={css("display:flex; align-items:center; gap:6px;")}><span style={css("width:14px;height:3px;border-radius:2px;background:#4E5661;")}></span>OSEBX · {btOk ? fmtK(bm!.benchFinal) : '—'}</span>
          </div>
        </div>
        {btChart ? (<>
        <svg viewBox="0 0 900 260" preserveAspectRatio="none" style={css("width:100%; height:250px; display:block;")}>
          <defs><linearGradient id="btgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3DBB84" stopOpacity="0.18"/><stop offset="100%" stopColor="#3DBB84" stopOpacity="0"/></linearGradient></defs>
          <line x1="0" y1="65" x2="900" y2="65" stroke="#20242B" strokeWidth="1"/>
          <line x1="0" y1="130" x2="900" y2="130" stroke="#20242B" strokeWidth="1"/>
          <line x1="0" y1="195" x2="900" y2="195" stroke="#20242B" strokeWidth="1"/>
          <polyline points={btChart.bLine} fill="none" stroke="#4E5661" strokeWidth="1.8"/>
          <path d={btChart.pArea} fill="url(#btgrad)"/>
          <polyline points={btChart.p} fill="none" stroke="#3DBB84" strokeWidth="2.4"/>
        </svg>
        <div className="mono" style={css("display:flex; justify-content:space-between; font-size:10px; color:#5B626C; margin-top:4px;")}><span>2016</span><span>2018</span><span>2020</span><span>2022</span><span>2024</span><span>2026</span></div>
        </>) : (
          <div style={css("height:250px; display:flex; align-items:center; justify-content:center; text-align:center;")}><div style={css("font-size:13px; color:#5B626C;")}>Running the 10-year backtest on real prices…</div></div>
        )}
      </div>

      <div className="m-grid6" style={css("display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin-bottom:16px;")}>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>CAGR</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#3DBB84; margin-top:4px;")}>{btm.cagr}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Total return</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#3DBB84; margin-top:4px;")}>{btm.total}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Volatility</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#C79A3D; margin-top:4px;")}>{btm.vol}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Sharpe</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>{btm.sharpe}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Sortino</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>{btm.sortino}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Max drawdown</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#E4655E; margin-top:4px;")}>{btm.mdd}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Alpha / yr</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#B79BFF; margin-top:4px;")}>{btm.alpha}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Beta</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>{btm.beta}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Win rate (mo)</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>{btm.win}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Best year</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#3DBB84; margin-top:4px;")}>{btm.best}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Worst year</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#E4655E; margin-top:4px;")}>{btm.worst}</div></div>
        <div style={css("border:1px solid #23272E; border-radius:11px; background:#101317; padding:13px 14px;")}><div style={css("font-size:10.5px; color:#7C8492;")}>Turnover / yr</div><div className="mono" style={css("font-size:18px; font-weight:600; color:#F2F4F7; margin-top:4px;")}>{btm.turnover}</div></div>
      </div>

      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:16px 18px;")}>
        <div style={css("display:flex; align-items:baseline; gap:10px; margin-bottom:14px;")}><span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Annual returns vs OSEBX</span><span className="mono" style={css("margin-left:auto; font-size:10.5px; color:#5B626C;")}>strategy bar · benchmark in grey</span></div>
        {btAnnual.length === 0 && (<div style={css("font-size:12.5px; color:#5B626C; padding:6px 0;")}>Loading real calendar-year returns…</div>)}
        {btAnnual.map((y, i) => (<React.Fragment key={i}>
          <div style={css("display:flex; align-items:center; gap:12px; margin-bottom:9px;")}>
            <span className="mono" style={css("width:52px; flex:0 0 auto; font-size:12px; color:#DDE1E7;")}>{y.year}</span>
            <div style={css("flex:1; height:12px; background:#1A1E24; border-radius:5px; position:relative; overflow:hidden;")}>{y.barEl}</div>
            <span className="mono" style={css("width:56px; text-align:right; flex:0 0 auto;")}>{y.stratEl}</span>
            <span className="mono" style={css("width:70px; text-align:right; flex:0 0 auto; font-size:11.5px; color:#7C8492;")}>OSEBX {y.bench}</span>
          </div>
        </React.Fragment>))}
      </div>
      <div style={css("font-size:11px; color:#5B626C; line-height:1.5; margin-top:12px;")}>Backtest applies the portfolio's current target weights to real monthly closing prices (Yahoo Finance), rebalanced monthly with a modelled 0.05% per-trade cost, benchmarked against OSEBX. It assumes today's weights were held throughout and does not represent actual historical trades; past performance is not indicative of future results.</div>

      <div style={css("border:1px solid #3B2F63; border-radius:12px; background:#120E22; padding:16px 18px; margin-top:20px;")}>
        <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:4px;")}>
          <span style={css("font-size:14px; font-weight:600; color:#F2F4F7;")}>Systematic factor model</span>
          <span style={css("font-size:11px; color:#8A929E;")}>6-month momentum + 13/52-week trend + low-volatility, top {qmTopN} of 12 names ({risk}), weekly data</span>
          <div style={css("flex:1;")}></div>
          <span className="mono" style={css(`font-size:10.5px; border-radius:20px; padding:3px 10px; border:1px solid ${quantModel.error ? '#5C2A2A' : '#2A2F37'}; color:${quantModel.error ? '#E4938E' : '#5B626C'};`)}>{qmStatusLabel}</span>
        </div>
        <div className="m-grid4" style={css("display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:12px;")}>
          <div style={css("border:1px solid #2A2440; border-radius:10px; background:#161029; padding:11px 13px;")}><div style={css("font-size:10.5px; color:#8A78B8;")}>CAGR</div><div className="mono" style={css("font-size:17px; font-weight:600; color:#3DBB84; margin-top:3px;")}>{qmMetrics ? pctStr(qmMetrics.stratCagr) : '—'}</div></div>
          <div style={css("border:1px solid #2A2440; border-radius:10px; background:#161029; padding:11px 13px;")}><div style={css("font-size:10.5px; color:#8A78B8;")}>Alpha vs OSEBX</div><div className="mono" style={css("font-size:17px; font-weight:600; color:#B79BFF; margin-top:3px;")}>{qmMetrics ? pctStr(qmMetrics.alpha) : '—'}</div></div>
          <div style={css("border:1px solid #2A2440; border-radius:10px; background:#161029; padding:11px 13px;")}><div style={css("font-size:10.5px; color:#8A78B8;")}>Sharpe</div><div className="mono" style={css("font-size:17px; font-weight:600; color:#F2F4F7; margin-top:3px;")}>{qmMetrics ? qmMetrics.sharpe.toFixed(2) : '—'}</div></div>
          <div style={css("border:1px solid #2A2440; border-radius:10px; background:#161029; padding:11px 13px;")}><div style={css("font-size:10.5px; color:#8A78B8;")}>Max drawdown</div><div className="mono" style={css("font-size:17px; font-weight:600; color:#E4655E; margin-top:3px;")}>{qmMetrics ? pctStr(qmMetrics.maxDrawdown) : '—'}</div></div>
        </div>
        <div className="mono" style={css("display:grid; grid-template-columns:70px 1.6fr 1fr 2.4fr; gap:10px; padding:9px 2px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#7A6FA0; border-bottom:1px solid #221B38; margin-top:14px;")}>
          <span>Signal</span><span>Instrument</span><span style={css("text-align:right;")}>Upside</span><span>Momentum / trend / vol</span>
        </div>
        {qmSignals.map((s, i) => (<React.Fragment key={i}>
          <div style={css("display:grid; grid-template-columns:70px 1.6fr 1fr 2.4fr; gap:10px; align-items:center; padding:10px 2px; border-bottom:1px solid #1E1834;")}>
            <span>{s.actEl}</span>
            <div style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{s.ticker}</span> <span style={css("font-size:11.5px; color:#8A78B8;")}>{s.name}</span></div>
            <span style={css("text-align:right;")}>{s.upsideEl}</span>
            <span style={css("font-size:11px; color:#9C90C0; line-height:1.4;")}>{s.reason}</span>
          </div>
        </React.Fragment>))}
        {quantModel.splitValidation && (
          <div style={css("margin-top:16px; border-top:1px solid #221B38; padding-top:14px;")}>
            <div style={css("display:flex; align-items:baseline; gap:10px; margin-bottom:10px;")}>
              <span style={css("font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#8A78B8; font-weight:600;")}>Out-of-sample check</span>
              <span style={css("font-size:11px; color:#6F6590;")}>same rule, run independently on each half of the history</span>
            </div>
            <div style={css("display:grid; grid-template-columns:1fr 1fr; gap:12px;")}>
              {([{ label: 'First half', m: quantModel.splitValidation.firstHalf }, { label: 'Second half', m: quantModel.splitValidation.secondHalf }] as const).map((h, i) => (
                <div key={i} style={css("border:1px solid #2A2440; border-radius:10px; background:#161029; padding:11px 13px;")}>
                  <div style={css("font-size:10.5px; color:#8A78B8; margin-bottom:6px;")}>{h.label}</div>
                  <div className="mono" style={css("display:flex; justify-content:space-between; font-size:12.5px; color:#F2F4F7;")}><span>CAGR</span><span style={css(`color:${h.m.cagr >= 0 ? '#3DBB84' : '#E4655E'};`)}>{pctStr(h.m.cagr)}</span></div>
                  <div className="mono" style={css("display:flex; justify-content:space-between; font-size:12.5px; color:#F2F4F7; margin-top:4px;")}><span>Sharpe</span><span>{h.m.sharpe.toFixed(2)}</span></div>
                  <div className="mono" style={css("display:flex; justify-content:space-between; font-size:12.5px; color:#F2F4F7; margin-top:4px;")}><span>Max drawdown</span><span style={css("color:#E4655E;")}>{pctStr(h.m.maxDrawdown)}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={css("font-size:11px; color:#6F6590; line-height:1.5; margin-top:12px;")}>Complementary to the backtest above: instead of the portfolio's fixed current weights, this systematically re-picks the top {qmTopN} of the 12 tracked names every 4 weeks by composite score (bar and position count set by the AI risk level above), with a modelled 0.05% turnover cost. Small universe, ~4–5 years of history{quantModel.splitValidation ? ' — split in half above as a basic out-of-sample check' : ', not enough history yet for an out-of-sample split'} — illustrative of a systematic approach, not a verified edge, and not investment advice.</div>
      </div>
    </div>
  );
}
