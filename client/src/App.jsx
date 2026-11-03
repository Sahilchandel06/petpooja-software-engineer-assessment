import { Toaster } from 'react-hot-toast';
import { Board } from './components/Board.jsx';

export default function App() {
  return (
    <>
      <Board />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'border border-border-subtle bg-elevated text-primary shadow-overlay',
          style: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg-elevated)' } },
          error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg-elevated)' } },
        }}
      />
    </>
  );
}
