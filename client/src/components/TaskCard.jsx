import { memo } from 'react';
import toast from 'react-hot-toast';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getIndexForPosition } from '../utils/fractionalIndex.js';
import { COLUMNS, useBoardStore } from '../store/boardStore.js';

const priorityClasses = {
  Low: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  Medium: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  High: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200',
};

export const TaskCard = memo(function TaskCard({ taskId, isFirst, isLast, onEdit, onDelete }) {
  const task = useBoardStore((state) => state.tasksById[taskId]);
  const moveTask = useBoardStore((state) => state.moveTask);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: taskId,
    data: { type: 'task', taskId, columnId: task?.columnId },
    disabled: Boolean(task?._pending),
  });

  if (!task) return null;

  const columnIndex = COLUMNS.findIndex(({ id }) => id === task.columnId);

  function getPositionIndex(ids, insertionIndex, tasksById) {
    const previous = insertionIndex > 0 ? tasksById[ids[insertionIndex - 1]].orderIndex : null;
    const next = insertionIndex < ids.length ? tasksById[ids[insertionIndex]].orderIndex : null;
    return getIndexForPosition(previous, next);
  }

  function handleMove(direction) {
    const state = useBoardStore.getState();
    const currentTask = state.tasksById[taskId];
    if (!currentTask) return;

    const currentIds = state.columnIds[currentTask.columnId];
    const currentIndex = currentIds.indexOf(taskId);
    let toColumnId = currentTask.columnId;
    let targetIds;
    let insertionIndex;

    if (direction === 'up' || direction === 'down') {
      if ((direction === 'up' && currentIndex === 0)
        || (direction === 'down' && currentIndex === currentIds.length - 1)) return;
      targetIds = currentIds.filter((id) => id !== taskId);
      insertionIndex = currentIndex + (direction === 'up' ? -1 : 1);
    } else {
      const targetColumnIndex = columnIndex + (direction === 'left' ? -1 : 1);
      if (targetColumnIndex < 0 || targetColumnIndex >= COLUMNS.length) return;
      toColumnId = COLUMNS[targetColumnIndex].id;
      targetIds = [...state.columnIds[toColumnId]];
      insertionIndex = targetIds.length;
    }

    try {
      const targetIndex = getPositionIndex(targetIds, insertionIndex, state.tasksById);
      moveTask(taskId, toColumnId, targetIndex).catch(() => {});
    } catch (error) {
      toast.error(error.message || 'Could not calculate a safe task position.');
    }
  }

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">
          <button type="button" disabled={task._pending} onClick={() => onEdit(taskId)} className="rounded text-left hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-wait disabled:opacity-70 dark:hover:text-indigo-300">{task.title}</button>
        </h3>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${priorityClasses[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${task.title}`}
        className="mt-1 cursor-grab rounded px-1 text-xs text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:cursor-grabbing dark:text-slate-400 dark:hover:bg-slate-700"
      >
        ⠿ Drag
      </button>
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
        <button type="button" disabled={task._pending} onClick={() => onEdit(taskId)} aria-label={`Edit ${task.title}`} className="rounded px-2 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-wait disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-slate-700">Edit</button>
        <button type="button" disabled={task._pending} onClick={() => onDelete(taskId)} aria-label={`Delete ${task.title}`} className="rounded px-2 py-1 text-sm font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-wait disabled:opacity-50 dark:text-rose-300 dark:hover:bg-slate-700">Delete</button>
        <div className="ml-auto flex gap-1" role="group" aria-label="Temporary local move controls">
          <button type="button" disabled={task._pending || columnIndex === 0} onClick={() => handleMove('left')} aria-label={`Move ${task.title} to previous column`} title="Previous column" className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700">←</button>
          <button type="button" disabled={task._pending || columnIndex === COLUMNS.length - 1} onClick={() => handleMove('right')} aria-label={`Move ${task.title} to next column`} title="Next column" className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700">→</button>
          <button type="button" disabled={task._pending || isFirst} onClick={() => handleMove('up')} aria-label={`Move ${task.title} up`} title="Move up" className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700">↑</button>
          <button type="button" disabled={task._pending || isLast} onClick={() => handleMove('down')} aria-label={`Move ${task.title} down`} title="Move down" className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-700">↓</button>
        </div>
      </div>
    </article>
  );
});
