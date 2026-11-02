import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useBoardStore } from '../store/boardStore.js';
import { useDialogFocus } from '../hooks/useDialogFocus.js';
import { Button } from './ui/Button.jsx';

export function ConfirmDelete({ taskId, onClose }) {
  const task = useBoardStore((state) => state.tasksById[taskId]);
  const deleteTask = useBoardStore((state) => state.deleteTask);
  const [deleting, setDeleting] = useState(false);
  const [taskTitle] = useState(() => task?.title || 'this task');
  const dialogRef = useRef(null);
  useDialogFocus(dialogRef, onClose);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
      onClose();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-primary/50 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} tabIndex={-1} role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description" className="w-full max-w-md rounded-column border border-border-subtle bg-elevated p-5 text-primary shadow-overlay">
        <h2 id="delete-title" className="text-modal font-semibold">Delete this task?</h2>
        <p id="delete-description" className="mt-2 text-body text-secondary">“{task?.title || taskTitle}” will be permanently removed.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete task'}</Button>
        </div>
      </section>
    </div>
  );
}
