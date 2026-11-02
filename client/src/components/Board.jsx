import { useCallback, useEffect, useState } from 'react';
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

  useEffect(() => {
    fetchTasks().catch(() => {});
  }, [fetchTasks]);

  const retry = useCallback(() => fetchTasks().catch(() => {}), [fetchTasks]);
  const openCreate = useCallback(() => setTaskModal({ taskId: null }), []);
  const openEdit = useCallback((taskId) => setTaskModal({ taskId }), []);
  const closeTaskModal = useCallback(() => setTaskModal(null), []);
  const closeDelete = useCallback(() => setDeleteTaskId(null), []);

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
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3" aria-label="Task columns">
          {COLUMNS.map((column) => (
            <Column key={column.id} column={column} onEditTask={openEdit} onDeleteTask={setDeleteTaskId} />
          ))}
        </div>
      )}

      {taskModal && <TaskModal key={taskModal.taskId || 'new-task'} taskId={taskModal.taskId} onClose={closeTaskModal} />}
      {deleteTaskId && <ConfirmDelete taskId={deleteTaskId} onClose={closeDelete} />}
    </main>
  );
}
