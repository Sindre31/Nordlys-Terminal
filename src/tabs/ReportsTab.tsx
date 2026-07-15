import React from 'react';
import { css } from '../ui';

// Reports & earnings tab. Presentational; calendar, report card and analyst rows are computed in Terminal.
export interface CalendarRow {
  day: string;
  mon: string;
  name: string;
  when: string;
  ticker: string;
  period: string;
}
export interface AnalystRow {
  broker: string;
  ticker: string;
  name: string;
  target: string;
  prev: string;
  date: string;
  ratingEl: React.ReactNode;
  open?: () => void;
}
export interface RevBar { x: number; y: number; w: number; h: number; fill: string }
export interface ReportsTabProps {
  calendarDisplay: CalendarRow[];
  reportTicker: string;
  reportName: string;
  rcBeat: boolean | null;
  rcRev: string;
  rcNI: string;
  rcEps: string;
  rcRoe: string;
  revBars: RevBar[] | null;
  buyN: number;
  holdN: number;
  sellN: number;
  analystDisplay: AnalystRow[];
}

export default function ReportsTab({
  calendarDisplay, reportTicker, reportName, rcBeat, rcRev, rcNI, rcEps, rcRoe, revBars, buyN, holdN, sellN, analystDisplay,
}: ReportsTabProps) {
  return (
    <div data-screen-label="Reports" className="screen" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:18px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Reports &amp; earnings</h2>
        <div style={css("flex:1;")}></div>
        <div className="mono" style={css("display:flex; gap:4px; font-size:11.5px;")}>
          <span style={css("padding:5px 11px; border-radius:6px; background:#1D2229; color:#fff; cursor:pointer;")}>Calendar</span>
          <span style={css("padding:5px 11px; border-radius:6px; color:#8A929E; cursor:pointer;")}>Latest filings</span>
        </div>
      </div>
      <div className="m-split" style={css("display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start;")}>

        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
          <div style={css("padding:14px 18px; border-bottom:1px solid #23272E; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Upcoming earnings</div>
          {calendarDisplay.length === 0 && (
            <div style={css("padding:22px 18px; font-size:12.5px; color:#5B626C; line-height:1.5;")}>Awaiting confirmed earnings dates from the analyst-consensus feed. No dates are shown until the live feed responds.</div>
          )}
          {calendarDisplay.map((c, i) => (<React.Fragment key={i}>
            <div style={css("display:flex; align-items:center; gap:14px; padding:13px 18px; border-bottom:1px solid #191D23;")}>
              <div style={css("width:46px; text-align:center; flex:0 0 auto;")}><div className="mono" style={css("font-size:17px; font-weight:600; color:#F2F4F7;")}>{c.day}</div><div style={css("font-size:10px; color:#5B626C; text-transform:uppercase;")}>{c.mon}</div></div>
              <div style={css("flex:1;")}><div style={css("font-size:13.5px; font-weight:500; color:#EDEFF2;")}>{c.name}</div><div style={css("font-size:11.5px; color:#7C8492;")}>{c.when}</div></div>
              <span className="mono" style={css("font-size:11px; color:#6FA8FF;")}>{c.ticker}</span>
              <span style={css("font-size:10.5px; color:#5B626C; border:1px solid #2A2F37; border-radius:20px; padding:2px 9px;")}>{c.period}</span>
            </div>
          </React.Fragment>))}
        </div>

        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
          <div style={css("padding:16px 20px; border-bottom:1px solid #23272E;")}>
            <div style={css("display:flex; align-items:center; gap:10px;")}><span className="mono" style={css("font-weight:600; font-size:15px; color:#F2F4F7;")}>{reportTicker}</span><span style={css("font-size:13px; color:#8A929E;")}>{reportName + ' · latest reported'}</span>{rcBeat == null ? null : <span style={css(`margin-left:auto; font-size:10.5px; color:${rcBeat ? '#3DBB84' : '#E4655E'}; border:1px solid ${rcBeat ? '#1F5C43' : '#5A2A26'}; border-radius:20px; padding:2px 9px;`)}>{rcBeat ? 'Beat' : 'Miss'}</span>}</div>
          </div>
          <div style={css("padding:18px 20px;")}>
            <div style={css("display:grid; grid-template-columns:1fr 1fr; gap:16px;")}>
              <div><div style={css("font-size:11.5px; color:#7C8492;")}>Revenue (TTM)</div><div className="mono" style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin-top:3px;")}>{rcRev}</div><div className="mono" style={css("font-size:11.5px; color:#9AA1AC; margin-top:2px;")}>trailing 12m</div></div>
              <div><div style={css("font-size:11.5px; color:#7C8492;")}>Net income</div><div className="mono" style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin-top:3px;")}>{rcNI}</div><div className="mono" style={css("font-size:11.5px; color:#9AA1AC; margin-top:2px;")}>latest FY</div></div>
              <div><div style={css("font-size:11.5px; color:#7C8492;")}>EPS (TTM)</div><div className="mono" style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin-top:3px;")}>{rcEps}</div><div className="mono" style={css("font-size:11.5px; color:#9AA1AC; margin-top:2px;")}>trailing</div></div>
              <div><div style={css("font-size:11.5px; color:#7C8492;")}>Return on equity</div><div className="mono" style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin-top:3px;")}>{rcRoe}</div><div className="mono" style={css("font-size:11.5px; color:#9AA1AC; margin-top:2px;")}>trailing</div></div>
            </div>
            <div style={css("margin-top:18px; border-top:1px solid #191D23; padding-top:14px;")}>
              <div style={css("font-size:11.5px; color:#7C8492; margin-bottom:8px;")}>Revenue trend (annual)</div>
              {revBars ? (
                <svg viewBox="0 0 420 90" preserveAspectRatio="none" style={css("width:100%; height:90px; display:block;")}>
                  {revBars.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.fill} />)}
                </svg>
              ) : (
                <div style={css("height:90px; display:flex; align-items:center; justify-content:center; font-size:11.5px; color:#5B626C; text-align:center;")}>Awaiting annual revenue history from the fundamentals feed.</div>
              )}
            </div>
            <div style={css("display:flex; gap:8px; margin-top:16px;")}>
              <button style={css("border:1px solid #2A2F37; background:#191D24; color:#DDE1E7; font-size:12px; padding:7px 13px; border-radius:7px; cursor:pointer; font-family:inherit;")}>Open full report (PDF)</button>
              <button style={css("border:1px solid #2A2F37; background:#191D24; color:#DDE1E7; font-size:12px; padding:7px 13px; border-radius:7px; cursor:pointer; font-family:inherit;")}>Presentation</button>
            </div>
          </div>
        </div>
      </div>


      <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden; margin-top:22px;")}>
        <div style={css("display:flex; align-items:center; gap:12px; padding:12px 18px; border-bottom:1px solid #23272E;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Analyst recommendations</span>
          <span className="mono" style={css("font-size:10.5px; color:#5B626C;")}>brokers · last 7 days</span>
          <div style={css("flex:1;")}></div>
          <div className="mono" style={css("display:flex; align-items:center; gap:10px; font-size:11px;")}>
            <span style={css("color:#3DBB84;")}>{buyN} Buy</span><span style={css("color:#8A929E;")}>{holdN} Hold</span><span style={css("color:#E4655E;")}>{sellN} Sell</span>
          </div>
        </div>
        <div role="table" aria-label="Analyst recommendations">
        <div role="row" className="mono" style={css("display:grid; grid-template-columns:1.7fr 1.9fr 84px 1.5fr 74px; gap:12px; padding:9px 18px; font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:#5B626C; border-bottom:1px solid #191D23; background:#0E1013;")}>
          <span role="columnheader">Coverage</span><span role="columnheader">Instrument</span><span role="columnheader" style={css("text-align:center;")}>Rating</span><span role="columnheader" style={css("text-align:right;")}>Target (range)</span><span role="columnheader" style={css("text-align:right;")}>Upside</span>
        </div>
        {analystDisplay.length === 0 && (
          <div style={css("padding:22px 18px; font-size:12.5px; color:#5B626C; line-height:1.5;")}>Awaiting analyst consensus from the live feed (Yahoo). No broker figures are shown until it responds.</div>
        )}
        {analystDisplay.map((ar, i) => (<React.Fragment key={i}>
          <div role="row" onClick={ar.open} style={css("display:grid; grid-template-columns:1.7fr 1.9fr 84px 1.5fr 74px; gap:12px; align-items:center; padding:12px 18px; border-bottom:1px solid #191D23; cursor:pointer;")} className="hov-b">
            <span role="cell" style={css("font-size:12.5px; color:#DDE1E7;")}>{ar.broker}</span>
            <div role="cell" style={css("min-width:0;")}><span className="mono" style={css("font-weight:600; font-size:12.5px; color:#F2F4F7;")}>{ar.ticker}</span> <span style={css("font-size:12px; color:#7C8492;")}>{ar.name}</span></div>
            <span role="cell" style={css("text-align:center;")}>{ar.ratingEl}</span>
            <span role="cell" className="mono" style={css("text-align:right; font-size:12.5px; color:#EDEFF2;")}>{ar.target} <span style={css("color:#5B626C;")}>{ar.prev}</span></span>
            <span role="cell" className="mono" style={css("text-align:right; font-size:11.5px; color:#7C8492;")}>{ar.date}</span>
          </div>
        </React.Fragment>))}
        </div>
      </div>
    </div>
  );
}
