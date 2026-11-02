import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { COLUMNS, useBoardStore } from '../store/boardStore.js';

function initialForm(task) {
  return {
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    columnId: task?.columnId || 'todo',
    tags: task?.tags?.join(', ') || '',
    subtasks: task?.subtasks?.map(({ _id, title, completed }) => ({ _id, title, completed })) || [],
  };
}

export function TaskModal({ taskId, onClose }) {
  const task = useBoardStore((state) => (taskId ? state.tasksById[taskId] : null));
  const createTask = useBoardStore((state) => state.createTask);
  const updateTask = useBoardStore((state) => state.updateTask);
  const addSubtask = useBoardStore((state) => state.addSubtask);
  const updateSubtask = useBoardStore((state) => state.updateSubtask);
  const deleteSubtask = useBoardStore((state) => state.deleteSubtask);
  const [form, setForm] = useState(() => initialForm(task));
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitInProgress = useRef(false);
  const subtaskChangeInProgress = useRef(false);
  const localSubtaskCounter = useRef(0);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDrafts, setSubtaskDrafts] = useState({});
  const [subtaskPending, setSubtaskPending] = useState(false);
  const [subtaskError, setSubtaskError] = useState('');
  const isEditing = Boolean(taskId);
  const subtasks = isEditing ? task?.subtasks || [] : form.subtasks;

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

  async function runSubtaskChange(change) {
    if (subtaskChangeInProgress.current) return false;
    subtaskChangeInProgress.current = true;
    setSubtaskPending(true);
    setSubtaskError('');
    try {
      await change();
      return true;
    } catch (error) {
      setSubtaskError(error.response?.data?.error?.message || error.message || 'Could not update checklist.');
      return false;
    } finally {
      subtaskChangeInProgress.current = false;
      setSubtaskPending(false);
    }
  }

  function addChecklistItem() {
    const title = subtaskTitle.trim();
    if (!title || title.length > 120 || subtaskChangeInProgress.current) return;
    if (isEditing) {
      runSubtaskChange(async () => {
        await addSubtask(taskId, { title });
        setSubtaskTitle('');
      });
    } else {
      setForm((current) => ({
        ...current,
        subtasks: [...current.subtasks, { _id: `local-${Date.now()}-${localSubtaskCounter.current += 1}`, title, completed: false }],
      }));
      setSubtaskTitle('');
    }
  }

  function saveSubtaskTitle(subtask) {
    const draft = (subtaskDrafts[subtask._id] ?? subtask.title).trim();
    if (!draft || draft.length > 120) {
      setSubtaskDrafts((current) => ({ ...current, [subtask._id]: subtask.title }));
      return;
    }
    if (draft === subtask.title) return;
    if (isEditing) {
      Promise.resolve(runSubtaskChange(() => updateSubtask(taskId, subtask._id, { title: draft }))).then((succeeded) => {
        if (!succeeded) setSubtaskDrafts((current) => ({ ...current, [subtask._id]: subtask.title }));
      });
    } else {
      setForm((current) => ({
        ...current,
        subtasks: current.subtasks.map((item) => item._id === subtask._id ? { ...item, title: draft } : item),
      }));
    }
  }

  function toggleSubtask(subtask) {
    if (isEditing) {
      runSubtaskChange(() => updateSubtask(taskId, subtask._id, { completed: !subtask.completed }));
    } else {
      setForm((current) => ({
        ...current,
        subtasks: current.subtasks.map((item) => item._id === subtask._id ? { ...item, completed: !item.completed } : item),
      }));
    }
  }

  function removeChecklistItem(subtask) {
    if (isEditing) {
      runSubtaskChange(() => deleteSubtask(taskId, subtask._id));
    } else {
      setForm((current) => ({
        ...current,
        subtasks: current.subtasks.filter((item) => item._id !== subtask._id),
      }));
    }
  }

  async function submit(event) {
    event.preventDefault();
    // React state updates after this event; the ref closes the same-tick double-click gap.
    if (submitInProgress.current || subtaskChangeInProgress.current) return;
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
      subtasks: isEditing ? undefined : form.subtasks.map(({ title: subtaskName, completed }) => ({ title: subtaskName, completed })),
    };
    setSaving(true);
    submitInProgress.current = true;
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
      submitInProgress.current = false;
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
          <button type="button" onClick={onClose} aria-label="Close task form" className="rounded p-1 text-xl text-slate-500 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800">×</button>
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
              <label htmlFor="task-tags" className="mb-1 block text-sm font-medium text-slate-800 dark:text-slate-200">Tags <span className="font-normal text-slate-500 dark:text-slate-400">(comma-separated)</span></label>
              <input id="task-tags" name="tags" value={form.tags} onChange={changeField} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            </div>

            <fieldset className="rounded-lg border border-slate-200 p-3 dark:border-slate-700" disabled={saving || subtaskPending}>
              <legend className="px-1 text-sm font-semibold text-slate-800 dark:text-slate-200">Checklist</legend>
              <ul className="space-y-2">
                {subtasks.map((subtask) => (
                  <li key={subtask._id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => toggleSubtask(subtask)}
                      aria-label={`Mark ${subtask.title} ${subtask.completed ? 'incomplete' : 'complete'}`}
                      className="h-4 w-4 rounded border-slate-400 text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-slate-500"
                    />
                    <input
                      type="text"
                      value={subtaskDrafts[subtask._id] ?? subtask.title}
                      onChange={(event) => setSubtaskDrafts((current) => ({ ...current, [subtask._id]: event.target.value }))}
                      onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); saveSubtaskTitle(subtask); } }}
                      maxLength={120}
                      aria-label={`Checklist item title: ${subtask.title}`}
                      className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => saveSubtaskTitle(subtask)}
                      disabled={(subtaskDrafts[subtask._id] ?? subtask.title).trim() === subtask.title}
                      aria-label={`Save checklist item title: ${subtask.title}`}
                      className="rounded px-2 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed dark:text-indigo-300 dark:hover:bg-slate-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(subtask)}
                      aria-label={`Delete checklist item: ${subtask.title}`}
                      className="rounded px-2 py-1 text-sm font-medium text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 dark:text-rose-300 dark:hover:bg-slate-700"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              {subtasks.length === 0 && <p className="my-2 text-sm text-slate-600 dark:text-slate-400">No checklist items yet.</p>}
              <div className="mt-3 flex gap-2">
                <label htmlFor="new-subtask-title" className="sr-only">New checklist item title</label>
                <input
                  id="new-subtask-title"
                  value={subtaskTitle}
                  onChange={(event) => setSubtaskTitle(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addChecklistItem(); } }}
                  maxLength={120}
                  placeholder="Add a checklist item"
                  className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
                />
                <button type="button" onClick={addChecklistItem} disabled={!subtaskTitle.trim() || subtaskPending || saving} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700">Add</button>
              </div>
              {subtaskError && <p className="mt-2 text-sm font-medium text-rose-700 dark:text-rose-300" role="alert">{subtaskError}</p>}
            </fieldset>
          </div>

          {formError && <p id="task-form-error" className="mt-4 text-sm font-medium text-rose-700 dark:text-rose-300" role="alert">{formError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving || subtaskPending} className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-wait">{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create task'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
