import { AlertCircle } from 'lucide-react';
import { Button } from './ui/Button.jsx';

export function ErrorState({ message, onRetry }) {
  return <section className="flex flex-wrap items-start justify-between gap-4 rounded-card border border-danger bg-danger-subtle p-5 text-danger" role="alert">
    <div className="flex gap-3"><AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" /><div><h2 className="font-semibold">Could not load the board</h2><p className="mt-1 text-secondary">{message}</p></div></div>
    <Button variant="danger" size="small" onClick={onRetry}>Retry</Button>
  </section>;
}
