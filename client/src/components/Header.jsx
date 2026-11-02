import { useState } from 'react';
import { setSimulateFailures } from '../api/http.js';
import { useBoardStore } from '../store/boardStore.js';
import { ThemeToggle } from './ThemeToggle.jsx';

export function Header({ onCreateTask }) {
  const taskCount = useBoardStore((state) => Object.keys(state.tasksById).length);
  const [simulateFailures, setSimulateFailuresState] = useState(false);

  function toggleSimulation(event) {
    const enabled = event.target.checked;
    setSimulateFailuresState(enabled);
    setSimulateFailures(enabled);
  }

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">TaskFlow</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Team board</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <ThemeToggle />
        {import.meta.env.DEV && (
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              role="switch"
              checked={simulateFailures}
              onChange={toggleSimulation}
              aria-label="Simulate API failures for writes"
              aria-describedby="simulate-failure-help"
              className="h-4 w-4 rounded border-slate-400 text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500"
            />
            Simulate failures (dev)
            <span id="simulate-failure-help" className="sr-only">Write requests receive a simulated server error while this switch is on.</span>
          </label>
        )}
        <button
          type="button"
          onClick={onCreateTask}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">＋ </span>New task
        </button>
      </div>
    </header>
  );
}
