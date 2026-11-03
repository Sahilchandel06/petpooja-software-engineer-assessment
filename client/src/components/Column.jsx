import { Plus } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { EmptyState } from './EmptyState.jsx';
import { TaskCard } from './TaskCard.jsx';
import { useBoardStore } from '../store/boardStore.js';
import { IconButton } from './ui/IconButton.jsx';

const statusStyles = {
  todo: { dot: 'bg-status-todo', rail: 'border-t-status-todo' },
  'in-progress': { dot: 'bg-status-progress', rail: 'border-t-status-progress' },
  done: { dot: 'bg-status-done', rail: 'border-t-status-done' },
};

export function Column({ column, taskIds: visibleTaskIds, onEditTask, onDeleteTask, onCreateTask }) {
  const storedTaskIds = useBoardStore((state) => state.columnIds[column.id]);
  const taskIds = visibleTaskIds || storedTaskIds;
  const { setNodeRef, isOver } = useDroppable({ id: `column-${column.id}`, data: { type: 'column', columnId: column.id } });

  return (
    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
      <section ref={setNodeRef} className={`min-h-72 min-w-0 rounded-column border-t-2 bg-column p-2.5 transition-shadow duration-standard ${statusStyles[column.id].rail} ${isOver ? 'ring-2 ring-accent' : ''}`} aria-labelledby={`column-${column.id}`}>
        <div className="flex items-center justify-between px-1.5 py-1.5">
          <h2 id={`column-${column.id}`} className="flex items-center gap-2 text-body font-semibold text-primary"><span className={`size-2 rounded-full ${statusStyles[column.id].dot}`} aria-hidden="true" />{column.title}</h2>
          <div className="flex items-center gap-1"><span className="rounded-badge bg-card px-2 py-0.5 text-meta font-medium text-muted" aria-label={`${taskIds.length} tasks`}>{taskIds.length}</span><IconButton label={`Add task to ${column.title}`} onClick={() => onCreateTask(column.id)}><Plus size={16} aria-hidden="true" /></IconButton></div>
        </div>
        <div className="mt-1 min-h-52 min-w-0 px-0.5 pb-1">
          {taskIds.length === 0 ? <EmptyState title="No tasks yet" message="Add a task or move one here." onCreate={() => onCreateTask(column.id)} /> : (
            <ul className="space-y-2.5" aria-label={`${column.title} tasks`}>
              {taskIds.map((taskId, index) => <li key={taskId} className="min-w-0"><TaskCard taskId={taskId} isFirst={index === 0} isLast={index === taskIds.length - 1} onEdit={onEditTask} onDelete={onDeleteTask} /></li>)}
            </ul>
          )}
        </div>
      </section>
    </SortableContext>
  );
}
