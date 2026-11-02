import { useBoardStore } from '../store/boardStore.js';

export function Header({ onCreateTask }) {
  const taskCount = useBoardStore((state) => Object.keys(state.tasksById).length);

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">TaskFlow</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Team board</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{taskCount} {taskCount === 1 ? 'task' : 'tasks'}</p>
      </div>
      <button
        type="button"
        onClick={onCreateTask}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
      >
        <span aria-hidden="true">＋ </span>New task
      </button>
    </header>
  );
}
