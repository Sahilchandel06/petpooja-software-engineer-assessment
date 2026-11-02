import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { EmptyState } from './EmptyState.jsx';
import { TaskCard } from './TaskCard.jsx';
import { useBoardStore } from '../store/boardStore.js';

export function Column({ column, onEditTask, onDeleteTask }) {
  const taskIds = useBoardStore((state) => state.columnIds[column.id]);
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: 'column', columnId: column.id },
  });

  return (
    <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
    <section ref={setNodeRef} className={`min-h-64 rounded-xl bg-slate-100 p-3 transition-shadow dark:bg-slate-900 ${isOver ? 'ring-2 ring-indigo-500' : ''}`} aria-labelledby={`column-${column.id}`}>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 id={`column-${column.id}`} className="font-semibold text-slate-800 dark:text-slate-100">{column.title}</h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300" aria-label={`${taskIds.length} tasks`}>
          {taskIds.length}
        </span>
      </div>
      {taskIds.length === 0 ? (
        <EmptyState title="No tasks" message="Tasks in this column will appear here." />
      ) : (
        <ul className="space-y-3">
          {taskIds.map((taskId, index) => (
            <li key={taskId}>
              <TaskCard taskId={taskId} isFirst={index === 0} isLast={index === taskIds.length - 1} onEdit={onEditTask} onDelete={onDeleteTask} />
            </li>
          ))}
        </ul>
      )}
    </section>
    </SortableContext>
  );
}
