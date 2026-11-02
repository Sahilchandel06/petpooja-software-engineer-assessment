import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { COLUMNS, useBoardStore } from '../store/boardStore.js';

function initialForm(task) {
  return {
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    columnId: task?.columnId || 'todo',
    tags: task?.tags?.join(', ') || '',
  };
}

export function TaskModal({ taskId, onClose }) {
  const task = useBoardStore((state) => (taskId ? state.tasksById[taskId] : null));
  const createTask = useBoardStore((state) => state.createTask);
  const updateTask = useBoardStore((state) => state.updateTask);
  const [form, setForm] = useState(() => initialForm(task));
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(taskId);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  function changeField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setFormError('Enter a task title.');
      return;
    }
    if (title.length > 120) {
      setFormError('Task titles must be 120 characters or fewer.');
      return;
    }

    const commonFields = {
      title,
      description: form.description.trim(),
      priority: form.priority,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    };
    setSaving(true);
    setFormError('');
    try {
      if (isEditing) {
        await updateTask(taskId, commonFields);
        toast.success('Task updated');
      } else {
        await createTask({ ...commonFields, columnId: form.columnId });
        toast.success('Task created');
      }
      onClose();
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message || 'Could not save task.';
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="task-modal-title" className="my-auto w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="task-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Edit task' : 'Create task'}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Fields marked required must be filled in.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close task form" className="rounded p-1 text-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800">×</button>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="space-y-4">
            <div>
              <label htmlFor="task-title" className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">Title <span aria-hidden="true">*</span></label>
              <input id="task-title" name="title" value={form.title} onChange={changeField} maxLength={120} required autoFocus aria-invalid={Boolean(formError)} aria-describedby={formError ? 'task-form-error' : undefined} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            </div>

            <div>
              <label htmlFor="task-description" className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">Description</label>
              <textarea id="task-description" name="description" value={form.description} onChange={changeField} rows="3" className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="task-priority" className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">Priority</label>
                <select id="task-priority" name="priority" value={form.priority} onChange={changeField} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </div>
              {!isEditing && (
                <div>
                  <label htmlFor="task-column" className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">Column</label>
                  <select id="task-column" name="columnId" value={form.columnId} onChange={changeField} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                    {COLUMNS.map((column) => <option key={column.id} value={column.id}>{column.title}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="task-tags" className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">Tags <span className="font-normal text-slate-500">(comma-separated)</span></label>
              <input id="task-tags" name="tags" value={form.tags} onChange={changeField} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            </div>
          </div>

          {formError && <p id="task-form-error" className="mt-4 text-sm font-medium text-rose-700 dark:text-rose-300" role="alert">{formError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create task'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
