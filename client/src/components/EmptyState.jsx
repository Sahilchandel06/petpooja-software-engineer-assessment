import { Inbox } from 'lucide-react';
import { Button } from './ui/Button.jsx';

export function EmptyState({ title = 'Nothing here yet', message = 'Add a task to get started.', onCreate }) {
  return <div className="rounded-card border border-dashed border-border-strong px-4 py-7 text-center">
    <Inbox size={21} className="mx-auto mb-2 text-muted" aria-hidden="true" />
    <p className="text-body font-medium text-primary">{title}</p><p className="mt-1 text-secondary text-muted">{message}</p>
    {onCreate && <Button className="mt-3" size="small" onClick={onCreate}>Create task</Button>}
  </div>;
}
