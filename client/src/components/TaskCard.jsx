import { memo } from 'react';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowRight, ArrowUp, GripVertical, Minus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getIndexForPosition } from '../utils/fractionalIndex.js';
import { COLUMNS, useBoardStore } from '../store/boardStore.js';
import { Badge } from './ui/Badge.jsx';
import { IconButton } from './ui/IconButton.jsx';

export const TaskCard = memo(function TaskCard({ taskId, isFirst, isLast, onEdit, onDelete }) {
  const task = useBoardStore((state) => state.tasksById[taskId]);
  const moveTask = useBoardStore((state) => state.moveTask);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: taskId, data: { type: 'task', taskId, columnId: task?.columnId }, disabled: Boolean(task?._pending),
  });
  if (!task) return null;

  const checklist = task.subtasks || [];
  const completedCount = checklist.filter((subtask) => subtask.completed).length;
  const percent = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;
  const PriorityIcon = task.priority === 'High' ? ArrowUp : task.priority === 'Low' ? ArrowDown : Minus;

  function move(direction) {
    const state = useBoardStore.getState();
    const current = state.tasksById[taskId];
    if (!current) return;
    const currentIds = state.columnIds[current.columnId];
    const currentIndex = currentIds.indexOf(taskId);
    let toColumnId = current.columnId;
    let targetIds;
    let insertionIndex;
    if (direction === 'up' || direction === 'down') {
      if ((direction === 'up' && currentIndex === 0) || (direction === 'down' && currentIndex === currentIds.length - 1)) return;
      targetIds = currentIds.filter((id) => id !== taskId);
      insertionIndex = currentIndex + (direction === 'up' ? -1 : 1);
    } else {
      const targetColumnIndex = COLUMNS.findIndex(({ id }) => id === current.columnId) + (direction === 'left' ? -1 : 1);
      if (targetColumnIndex < 0 || targetColumnIndex >= COLUMNS.length) return;
      toColumnId = COLUMNS[targetColumnIndex].id;
      targetIds = [...state.columnIds[toColumnId]];
      insertionIndex = targetIds.length;
    }
    try {
      const previous = insertionIndex > 0 ? state.tasksById[targetIds[insertionIndex - 1]]?.orderIndex : null;
      const next = insertionIndex < targetIds.length ? state.tasksById[targetIds[insertionIndex]]?.orderIndex : null;
      moveTask(taskId, toColumnId, getIndexForPosition(previous, next)).catch(() => {});
    } catch (error) {
      toast.error(error.message || 'Could not calculate a safe task position.');
    }
  }

  function moveToColumn(toColumnId) {
    const state = useBoardStore.getState();
    const destination = state.columnIds[toColumnId];
    const previous = destination.length ? state.tasksById[destination[destination.length - 1]]?.orderIndex : null;
    try {
      moveTask(taskId, toColumnId, getIndexForPosition(previous, null)).catch(() => {});
    } catch (error) {
      toast.error(error.message || 'Could not calculate a safe task position.');
    }
  }

  const issueKey = String(taskId).replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase().padStart(6, '0');
  return (
    <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} tabIndex={0} aria-label={`${task.title}, ${task.priority} priority`}
      className={`group min-w-0 rounded-card border border-border-subtle bg-card p-3 shadow-card transition-[border-color,background-color,box-shadow] duration-fast hover:border-border-strong hover:bg-card-hover hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${isDragging ? 'border-dashed opacity-40 shadow-none' : ''}`}>
      <div className="flex items-start gap-2">
        <button ref={setActivatorNodeRef} type="button" {...attributes} {...listeners} aria-label={`Drag ${task.title}`} disabled={task._pending}
          className="mt-0.5 inline-flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-muted opacity-60 hover:bg-column hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus active:cursor-grabbing disabled:cursor-wait">
          <GripVertical size={16} aria-hidden="true" />
        </button>
        <button type="button" disabled={task._pending} onClick={() => onEdit(taskId)} className="min-w-0 flex-1 break-words text-left text-body font-medium leading-5 text-primary line-clamp-2 hover:text-accent focus-visible:outline-none focus-visible:underline disabled:cursor-wait">{task.title}</button>
        <details className="relative shrink-0">
          <summary className="flex size-7 cursor-pointer list-none items-center justify-center rounded-button text-muted hover:bg-column focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" aria-label={`More actions for ${task.title}`}><MoreHorizontal size={17} aria-hidden="true" /></summary>
          <div className="absolute right-0 top-8 z-10 min-w-44 rounded-card border border-border-subtle bg-elevated p-1 shadow-overlay">
            <MenuAction icon={<Pencil size={14} />} onClick={() => onEdit(taskId)}>Edit</MenuAction>
            <p className="px-2 pb-1 pt-2 text-meta font-semibold text-muted">Move to</p>
            {COLUMNS.filter((column) => column.id !== task.columnId).map((column) => <MenuAction key={column.id} icon={<ArrowRight size={14} />} onClick={() => moveToColumn(column.id)}>{column.title}</MenuAction>)}
            <div className="my-1 border-t border-border-subtle" />
            <MenuAction icon={<ArrowUp size={14} />} disabled={isFirst} onClick={() => move('up')}>Move up</MenuAction>
            <MenuAction icon={<ArrowDown size={14} />} disabled={isLast} onClick={() => move('down')}>Move down</MenuAction>
            <MenuAction icon={<Trash2 size={14} />} danger onClick={() => onDelete(taskId)}>Delete</MenuAction>
          </div>
        </details>
      </div>

      <div className="ml-8 mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
        <Badge variant={task.priority.toLowerCase()}><PriorityIcon size={12} className="mr-1" aria-hidden="true" />{task.priority}</Badge>
        {(task.tags || []).slice(0, 2).map((tag) => <Badge key={tag} className="max-w-[45%] truncate">{tag}</Badge>)}
        {(task.tags || []).length > 2 && <Badge aria-label={`${task.tags.length - 2} more tags`}>+{task.tags.length - 2}</Badge>}
      </div>
      {task.description && <p className="ml-8 mt-2 min-w-0 break-words line-clamp-2 text-secondary text-muted">{task.description}</p>}

      {checklist.length > 0 && <div className="ml-8 mt-3">
        <div className="mb-1 flex items-center justify-between text-meta text-secondary"><span>Checklist</span><span>{completedCount} of {checklist.length} done, {percent}%</span></div>
        <div role="progressbar" aria-label={`Checklist progress for ${task.title}`} aria-valuemin={0} aria-valuemax={checklist.length} aria-valuenow={completedCount} aria-valuetext={`${completedCount} of ${checklist.length} complete, ${percent}%`} className="h-1.5 overflow-hidden rounded-full bg-column">
          <div className={`h-full rounded-full transition-[width] duration-[300ms] ease-out motion-reduce:transition-none ${percent === 100 ? 'bg-success' : 'bg-accent'}`} style={{ width: `${percent}%` }} />
        </div>
      </div>}

      <footer className="ml-8 mt-3 flex items-center justify-between border-t border-border-subtle pt-2">
        <span className="text-meta font-medium text-muted">TF-{issueKey}</span>
        <div className="flex items-center gap-2"><span className="sr-only">Move controls</span>
          <IconButton label={`Move ${task.title} up`} disabled={task._pending || isFirst} onClick={() => move('up')}><ArrowUp size={14} /></IconButton>
          <IconButton label={`Move ${task.title} down`} disabled={task._pending || isLast} onClick={() => move('down')}><ArrowDown size={14} /></IconButton>
        </div>
      </footer>
    </article>
  );
});

function MenuAction({ icon, children, danger = false, onClick, ...props }) {
  return <button type="button" className={`flex min-h-8 w-full items-center gap-2 rounded px-2 text-left text-secondary hover:bg-column focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-40 ${danger ? 'text-danger' : ''}`} onClick={(event) => { onClick?.(event); event.currentTarget.closest('details').open = false; }} {...props}>{icon}{children}</button>;
}
