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
  const openCreate = useCallback(() => setTaskModal({ taskId: null }), []);
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
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Header onCreateTask={openCreate} />
      {error && taskCount > 0 && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
          <span>{error}</span>
          <button type="button" onClick={retry} className="font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">Retry</button>
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
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3" aria-label="Task columns">
            {COLUMNS.map((column) => (
              <Column key={column.id} column={column} onEditTask={openEdit} onDeleteTask={setDeleteTaskId} />
            ))}
          </div>
          <DragOverlay>{activeTask && <DragPreview task={activeTask} />}</DragOverlay>
        </DndContext>
      )}

      {taskModal && <TaskModal key={taskModal.taskId || 'new-task'} taskId={taskModal.taskId} onClose={closeTaskModal} />}
      {deleteTaskId && <ConfirmDelete taskId={deleteTaskId} onClose={closeDelete} />}
    </main>
  );
}

function DragPreview({ task }) {
  return (
    <article className="rotate-1 rounded-lg border border-indigo-300 bg-white p-4 shadow-xl dark:border-indigo-700 dark:bg-slate-800">
      <div className="font-semibold text-slate-900 dark:text-white">{task.title}</div>
      <div className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{task.priority}</div>
    </article>
  );
}
