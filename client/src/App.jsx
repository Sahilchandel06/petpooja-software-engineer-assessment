import { Toaster } from 'react-hot-toast';
import { Board } from './components/Board.jsx';

export default function App() {
  return (
    <>
      <Board />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'border border-slate-200 bg-white text-slate-900 shadow-lg dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
          success: { iconTheme: { primary: '#047857', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#be123c', secondary: '#ffffff' } },
        }}
      />
    </>
  );
}
