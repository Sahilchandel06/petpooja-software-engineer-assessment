import { Toaster } from 'react-hot-toast';
import { Board } from './components/Board.jsx';

export default function App() {
  return (
    <>
      <Board />
      <Toaster position="top-right" />
    </>
  );
}
