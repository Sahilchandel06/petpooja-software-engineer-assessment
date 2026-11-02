import { memo } from 'react';
import { COLUMNS, useBoardStore } from '../store/boardStore.js';

const priorityClasses = {
  Low: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  Medium: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  High: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200',
};

export const TaskCard = memo(function TaskCard({ taskId, isFirst, isLast, onEdit, onDelete }) {
  const task = useBoardStore((state) => state.tasksById[taskId]);
  const moveTaskLocally = useBoardStore((state) => state.moveTaskLocally);

  if (!task) return null;

  const columnIndex = COLUMNS.findIndex(({ id }) => id === task.columnId);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">{task.title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${priorityClasses[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      {task.description && (
        <p className="mt-2 truncate text-sm text-slate-600 dark:text-slate-300" title={task.description}>
          {task.description}
        </p>
      )}
      {task.tags?.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Task tags">
          {task.tags.map((tag) => (
            <li key={tag} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">{tag}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
        <button type="button" onClick={() => onEdit(taskId)} aria-label={`Edit ${task.title}`} className="rounded px-2 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:bg-slate-700">Edit</button>
        <button type="button" onClick={() => onDelete(taskId)} aria-label={`Delete ${task.title}`} className="rounded px-2 py-1 text-sm font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-rose-300 dark:hover:bg-slate-700">Delete</button>
        <div className="ml-auto flex gap-1" role="group" aria-label="Temporary local move controls">
          <button type="button" disabled={columnIndex === 0} onClick={() => moveTaskLocally(taskId, 'left')} aria-label={`Move ${task.title} to previous column (local only)`} title="Previous column (local only)" className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700">←</button>
          <button type="button" disabled={columnIndex === COLUMNS.length - 1} onClick={() => moveTaskLocally(taskId, 'right')} aria-label={`Move ${task.title} to next column (local only)`} title="Next column (local only)" className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700">→</button>
          <button type="button" disabled={isFirst} onClick={() => moveTaskLocally(taskId, 'up')} aria-label={`Move ${task.title} up (local only)`} title="Move up (local only)" className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700">↑</button>
          <button type="button" disabled={isLast} onClick={() => moveTaskLocally(taskId, 'down')} aria-label={`Move ${task.title} down (local only)`} title="Move down (local only)" className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700">↓</button>
        </div>
      </div>
    </article>
  );
});
