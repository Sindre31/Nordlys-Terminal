import React from 'react';
import { css } from '../ui';
import { fmtNum } from '../data';
import type { AlertRule, TriggeredAlert } from '../storage';

// Alerts tab. Rules/triggers state + mutations live in Terminal and are passed in; this is the view.
export interface AlertsTabProps {
  alertRules: AlertRule[];
  triggeredToday: TriggeredAlert[];
  todayKey: string;
  removeAlertRule: (id: number) => void;
  base: Record<string, { name: string }>;
  newAlertSym: string;
  setNewAlertSym: React.Dispatch<React.SetStateAction<string>>;
  newAlertCond: 'above' | 'below' | 'pct';
  setNewAlertCond: React.Dispatch<React.SetStateAction<'above' | 'below' | 'pct'>>;
  newAlertPrice: string;
  setNewAlertPrice: React.Dispatch<React.SetStateAction<string>>;
  createAlertRule: () => void;
}

const condLabel = (t: { cond: 'above' | 'below' | 'pct'; price: number }) =>
  t.cond === 'above' ? `crossed above ${fmtNum(t.price, 2)}`
  : t.cond === 'below' ? `fell below ${fmtNum(t.price, 2)}`
  : `moved ±${t.price.toFixed(1)}% today`;

export default function AlertsTab({
  alertRules, triggeredToday, todayKey, removeAlertRule, base,
  newAlertSym, setNewAlertSym, newAlertCond, setNewAlertCond, newAlertPrice, setNewAlertPrice, createAlertRule,
}: AlertsTabProps) {
  return (
    <div data-screen-label="Alerts" className="screen" style={css("position:absolute; inset:0; overflow-y:auto; padding:22px 26px;")}>
      <div style={css("display:flex; align-items:baseline; gap:14px; margin-bottom:18px;")}>
        <h2 style={css("font-size:19px; font-weight:600; color:#F2F4F7; margin:0;")}>Alerts</h2>
        <span style={css("font-size:13px; color:#8A929E;")}>{alertRules.length} active · {triggeredToday.filter((t) => t.date === todayKey).length} triggered today</span>
      </div>
      <div className="m-split" style={css("display:grid; grid-template-columns:1.3fr 1fr; gap:22px; align-items:start;")}>
        <div style={css("display:flex; flex-direction:column; gap:16px;")}>
          <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div style={css("padding:13px 18px; border-bottom:1px solid #23272E; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Active rules</div>
            {alertRules.length === 0 && (
              <div style={css("padding:16px 18px; font-size:13px; color:#5B626C;")}>No active alerts. Create one on the right.</div>
            )}
            {alertRules.map((rule, i) => (
              <div key={rule.id} style={css(`display:flex; align-items:center; gap:12px; padding:14px 18px; ${i < alertRules.length - 1 ? 'border-bottom:1px solid #191D23;' : ''}`)}>
                <span className="mono" style={css("font-weight:600; color:#F2F4F7; font-size:13.5px; width:56px;")}>{rule.ticker}</span>
                <span style={css("font-size:13px; color:#DDE1E7;")}>{rule.cond === 'above' ? 'Price crosses above' : rule.cond === 'below' ? 'Price falls below' : 'Daily change exceeds'}</span>
                <span className="mono" style={css("font-size:13px; color:#F2F4F7;")}>{rule.cond === 'pct' ? `±${rule.price.toFixed(1)}%` : fmtNum(rule.price, 2)}</span>
                <span onClick={() => removeAlertRule(rule.id)} className="mono" style={css("margin-left:auto; font-size:11.5px; color:#E4655E; cursor:pointer;")}>✕ Remove</span>
              </div>
            ))}
          </div>
          <div role="status" aria-live="polite" aria-label="Triggered alerts" style={css("border:1px solid #23272E; border-radius:12px; background:#101317; overflow:hidden;")}>
            <div style={css("padding:13px 18px; border-bottom:1px solid #23272E; font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>Triggered today</div>
            {triggeredToday.filter((t) => t.date === todayKey).length === 0 && (
              <div style={css("padding:16px 18px; font-size:13px; color:#5B626C;")}>Nothing triggered today.</div>
            )}
            {triggeredToday.filter((t) => t.date === todayKey).map((t, i, arr) => (
              <div key={i} style={css(`padding:12px 18px; display:flex; align-items:center; gap:10px; ${i < arr.length - 1 ? 'border-bottom:1px solid #191D23;' : ''}`)}>
                <span style={css(`width:8px; height:8px; border-radius:2px; background:${t.cond === 'below' ? '#E4655E' : '#3DBB84'};`)}></span>
                <span className="mono" style={css("font-size:13px; color:#F2F4F7;")}>{t.ticker}</span>
                <span style={css("font-size:13px; color:#9AA1AC;")}>{condLabel(t)}</span>
                <span className="mono" style={css("margin-left:auto; font-size:11.5px; color:#5B626C;")}>{t.at}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={css("border:1px solid #23272E; border-radius:12px; background:#101317; padding:18px 20px;")}>
          <span style={css("font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:#8A929E; font-weight:600;")}>New alert</span>
          <div style={css("margin-top:14px; display:flex; flex-direction:column; gap:12px;")}>
            <div>
              <div style={css("font-size:11.5px; color:#7C8492; margin-bottom:5px;")}>Symbol</div>
              <select value={newAlertSym} onChange={(e) => setNewAlertSym(e.target.value)} className="mono" style={css("width:100%; background:#191D24; border:1px solid #2A2F37; border-radius:8px; padding:10px 12px; font-size:13px; color:#F2F4F7; font-family:inherit;")}>
                {Object.keys(base).map((sym) => <option key={sym} value={sym}>{sym} — {base[sym].name}</option>)}
              </select>
            </div>
            <div>
              <div style={css("font-size:11.5px; color:#7C8492; margin-bottom:5px;")}>Condition</div>
              <div style={css("display:flex; gap:6px;")}>
                {(['above', 'below', 'pct'] as const).map((c) => (
                  <span key={c} onClick={() => setNewAlertCond(c)} style={css(`flex:1; text-align:center; border-radius:8px; padding:9px; font-size:12.5px; cursor:pointer; ${newAlertCond === c ? 'background:#2D5BD0; color:#fff;' : 'background:#191D24; border:1px solid #2A2F37; color:#9AA1AC;'}`)}>{c === 'above' ? 'Above' : c === 'below' ? 'Below' : '% move'}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={css("font-size:11.5px; color:#7C8492; margin-bottom:5px;")}>{newAlertCond === 'pct' ? 'Daily change threshold (%)' : 'Target price'}</div>
              <input value={newAlertPrice} onChange={(e) => setNewAlertPrice(e.target.value)} placeholder={newAlertCond === 'pct' ? '3.0' : '320.00'} className="mono" style={css("width:100%; box-sizing:border-box; background:#191D24; border:1px solid #2A2F37; border-radius:8px; padding:10px 12px; font-size:13px; color:#F2F4F7; font-family:inherit;")} />
            </div>
            <div><div style={css("font-size:11.5px; color:#7C8492; margin-bottom:5px;")}>Notify via</div><div style={css("display:flex; gap:8px; font-size:12.5px; color:#DDE1E7;")}><span style={css("background:#191D24; border:1px solid #2D5BD0; border-radius:20px; padding:5px 12px;")}>✓ Push</span><span style={css("background:#191D24; border:1px solid #2A2F37; border-radius:20px; padding:5px 12px; color:#9AA1AC;")}>Email</span></div></div>
            <button onClick={createAlertRule} style={css("margin-top:4px; border:none; background:#2D5BD0; color:#fff; font-size:13px; font-weight:500; padding:11px; border-radius:8px; cursor:pointer; font-family:inherit;")}>Create alert</button>
          </div>
        </div>
      </div>
    </div>
  );
}
