import { useState } from 'react';
import { Plus, PanelsTopLeft } from 'lucide-react';
import { setSimulateFailures } from '../api/http.js';
import { useBoardStore } from '../store/boardStore.js';
import { ThemeToggle } from './ThemeToggle.jsx';
import { Avatar } from './ui/Avatar.jsx';
import { Button } from './ui/Button.jsx';

export function Header({ onCreateTask }) {
  const taskCount = useBoardStore((state) => Object.keys(state.tasksById).length);
  const [simulateFailures, setSimulateFailuresState] = useState(false);

  function toggleSimulation(event) {
    const enabled = event.target.checked;
    setSimulateFailuresState(enabled);
    setSimulateFailures(enabled);
  }

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-6 flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-app/95 px-4 py-1 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex size-8 items-center justify-center rounded-button bg-accent text-on-accent"><PanelsTopLeft size={17} aria-hidden="true" /></span>
        <div className="min-w-0">
          <p className="text-body font-semibold leading-5 text-primary">TaskFlow</p>
          <p className="truncate text-meta text-muted">Team board <span aria-hidden="true">·</span> {taskCount} {taskCount === 1 ? 'issue' : 'issues'}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {import.meta.env.DEV && <label className="flex min-h-9 cursor-pointer items-center gap-2 rounded-button px-2 text-meta font-medium text-secondary hover:bg-card-hover">
          <input type="checkbox" role="switch" checked={simulateFailures} onChange={toggleSimulation} aria-label="Simulate API failures for writes" aria-describedby="simulate-failure-help" className="size-4 accent-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
          <span>Simulate failures <span className="text-muted">(dev)</span></span>
          <span id="simulate-failure-help" className="sr-only">Write requests receive a simulated server error while this switch is on.</span>
        </label>}
        <ThemeToggle />
        <Avatar label="Current user" initials="S" />
        <Button variant="primary" onClick={() => onCreateTask()}><Plus size={16} aria-hidden="true" /><span>New task</span></Button>
      </div>
    </header>
  );
}
