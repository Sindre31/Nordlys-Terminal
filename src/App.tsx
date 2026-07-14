import Terminal from './Terminal';
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Terminal />
    </ErrorBoundary>
  );
}

export default App;
