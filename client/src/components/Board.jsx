import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { getIndexForPosition } from '../utils/fractionalIndex.js';
import { useBoardStore, COLUMNS } from '../store/boardStore.js';
import { Column } from './Column.jsx';
import { ConfirmDelete } from './ConfirmDelete.jsx';
import { ErrorState } from './ErrorState.jsx';
import { Header } from './Header.jsx';
import { LoadingSkeleton } from './LoadingSkeleton.jsx';
import { TaskModal } from './TaskModal.jsx';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { Layers3 } from 'lucide-react';

export function Board() {
  const fetchTasks = useBoardStore((state) => state.fetchTasks);
  const loading = useBoardStore((state) => state.loading);
  const error = useBoardStore((state) => state.error);
  const taskCount = useBoardStore((state) => Object.keys(state.tasksById).length);
  const [taskModal, setTaskModal] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const activeTask = useBoardStore((state) => (activeTaskId ? state.tasksById[activeTaskId] : null));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    fetchTasks().catch(() => {});
  }, [fetchTasks]);

  const retry = useCallback(() => fetchTasks().catch(() => {}), [fetchTasks]);
  const openCreate = useCallback((columnId = 'todo') => setTaskModal({ taskId: null, columnId }), []);
  const openEdit = useCallback((taskId) => setTaskModal({ taskId }), []);
  const closeTaskModal = useCallback(() => setTaskModal(null), []);
  const closeDelete = useCallback(() => setDeleteTaskId(null), []);

  function handleDragEnd({ active, over }) {
    setActiveTaskId(null);
    if (!over) return;

    const state = useBoardStore.getState();
    const taskId = String(active.id);
    const task = state.tasksById[taskId];
    if (!task) return;

    const overData = over.data.current;
    const toColumnId = overData?.columnId;
    if (!state.columnIds[toColumnId]) return;

    const sourceIds = state.columnIds[task.columnId];
    const sourceIndex = sourceIds.indexOf(taskId);
    let targetIds;

    if (sourceIndex < 0) return;
    if (task.columnId === toColumnId && overData?.type === 'task') {
      const overTaskId = String(overData.taskId);
      if (overTaskId === taskId) return;
      const overIndex = sourceIds.indexOf(overTaskId);
      if (overIndex < 0) return;
      targetIds = [...sourceIds];
      targetIds.splice(sourceIndex, 1);
      targetIds.splice(overIndex, 0, taskId);
    } else {
      targetIds = state.columnIds[toColumnId].filter((id) => id !== taskId);
      const overIndex = overData?.type === 'task'
        ? targetIds.indexOf(String(overData.taskId))
        : targetIds.length;
      targetIds.splice(overIndex < 0 ? targetIds.length : overIndex, 0, taskId);
    }

    const targetPosition = targetIds.indexOf(taskId);
    const previousId = targetIds[targetPosition - 1];
    const nextId = targetIds[targetPosition + 1];
    try {
      const targetIndex = getIndexForPosition(
        previousId ? state.tasksById[previousId].orderIndex : null,
        nextId ? state.tasksById[nextId].orderIndex : null,
      );
      state.moveTask(taskId, toColumnId, targetIndex).catch(() => {});
    } catch (error) {
      // The move store owns API-failure toasts; this covers local index-calculation failures.
      toast.error(error.message || 'Could not calculate a safe task position.');
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl bg-app px-4 pb-10 text-primary sm:px-6 lg:px-8">
      <Header onCreateTask={openCreate} />
      <section className="mb-5 flex flex-wrap items-end justify-between gap-3" aria-label="Board overview">
        <div><p className="mb-1 text-meta font-semibold uppercase tracking-wide text-accent">Workspace / Product</p><h1 className="text-page font-semibold text-primary">Team board</h1><p className="mt-1 text-secondary">Plan, prioritize, and track work across the team.</p></div>
        <Badge><Layers3 size={13} className="mr-1" aria-hidden="true" />{taskCount} {taskCount === 1 ? 'issue' : 'issues'}</Badge>
      </section>
      {error && taskCount > 0 && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-danger bg-danger-subtle p-3 text-body text-danger">
          <span>{error}</span>
          <Button size="small" onClick={retry}>Retry</Button>
        </div>
      )}

      {loading && taskCount === 0 ? (
        <LoadingSkeleton />
      ) : error && taskCount === 0 ? (
        <ErrorState message={error} onRetry={retry} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiveTaskId(String(active.id))}
          onDragCancel={() => setActiveTaskId(null)}
          onDragEnd={handleDragEnd}
        >
          <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-board" aria-label="Task columns">
            {COLUMNS.map((column) => (
              <Column key={column.id} column={column} onEditTask={openEdit} onDeleteTask={setDeleteTaskId} onCreateTask={openCreate} />
            ))}
          </div>
          <DragOverlay>{activeTask && <DragPreview task={activeTask} />}</DragOverlay>
        </DndContext>
      )}

      {taskModal && <TaskModal key={taskModal.taskId || 'new-task'} taskId={taskModal.taskId} initialColumnId={taskModal.columnId} onClose={closeTaskModal} />}
      {deleteTaskId && <ConfirmDelete taskId={deleteTaskId} onClose={closeDelete} />}
    </main>
  );
}

function DragPreview({ task }) {
  return (
    <article className="rotate-[1deg] rounded-card border border-accent bg-card p-4 text-primary shadow-overlay">
      <div className="font-semibold">{task.title}</div>
      <div className="mt-2 text-meta font-medium text-secondary">{task.priority}</div>
    </article>
  );
}
