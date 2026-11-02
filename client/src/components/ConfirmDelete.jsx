import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useBoardStore } from '../store/boardStore.js';

export function ConfirmDelete({ taskId, onClose }) {
  const task = useBoardStore((state) => state.tasksById[taskId]);
  const deleteTask = useBoardStore((state) => state.deleteTask);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Could not delete task.');
      setDeleting(false);
    }
  }

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 id="delete-title" className="text-lg font-bold text-slate-900 dark:text-white">Delete this task?</h2>
        <p id="delete-description" className="mt-2 text-sm text-slate-600 dark:text-slate-300">“{task.title}” will be permanently removed.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
          <button type="button" onClick={confirmDelete} disabled={deleting} className="rounded-md bg-rose-700 px-4 py-2 font-semibold text-white hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{deleting ? 'Deleting…' : 'Delete task'}</button>
        </div>
      </section>
    </div>
  );
}
