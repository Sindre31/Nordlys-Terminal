import React from 'react';

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

// The whole app is one large component, so an uncaught render error would otherwise blank the
// page with no way back — including the Reset control, which lives inside that component. This
// boundary catches it and offers a reload plus a "clear saved data" escape hatch (the persisted
// ledger/watchlist/alerts are the most likely source of a bad-state crash).
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface it for debugging; there's no external logging wired up.
    console.error('Nordlys Terminal crashed:', error, info.componentStack);
  }

  private clearAndReload = () => {
    try {
      localStorage.removeItem('nordlys_portfolio_ledger');
      localStorage.removeItem('nordlys_watchlist');
      localStorage.removeItem('nordlys_alert_rules');
      localStorage.removeItem('nordlys_alert_triggers');
    } catch {
      /* ignore */
    }
    location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    const box: React.CSSProperties = {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      padding: 24,
      textAlign: 'center',
      background: '#0b0d10',
      color: '#d5d9e0',
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    };
    const btn: React.CSSProperties = {
      border: 'none',
      borderRadius: 8,
      padding: '10px 18px',
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      fontFamily: 'inherit',
    };
    return (
      <div style={box}>
        <div style={{ fontSize: 19, fontWeight: 600, color: '#F2F4F7' }}>Something went wrong</div>
        <div style={{ fontSize: 13.5, color: '#8A929E', maxWidth: 440, lineHeight: 1.5 }}>
          The terminal hit an unexpected error. Reloading usually fixes it. If it keeps happening,
          clearing this app's saved data (your watchlist, alerts and the AI portfolio ledger) will
          reset it to a clean state.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button onClick={() => location.reload()} style={{ ...btn, background: '#2D5BD0', color: '#fff' }}>
            Reload
          </button>
          <button onClick={this.clearAndReload} style={{ ...btn, background: '#1A1214', color: '#E4938E', border: '1px solid #3A2A2A' }}>
            Clear saved data &amp; reload
          </button>
        </div>
      </div>
    );
  }
}
