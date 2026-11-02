import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { COLUMNS, useBoardStore } from '../store/boardStore.js';
import { useDialogFocus } from '../hooks/useDialogFocus.js';
import { Input } from './ui/Input.jsx';
import { Select } from './ui/Select.jsx';

function initialForm(task, initialColumnId) {
  return {
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    columnId: task?.columnId || initialColumnId || 'todo',
    tags: task?.tags?.join(', ') || '',
    subtasks: task?.subtasks?.map(({ _id, title, completed }) => ({ _id, title, completed })) || [],
  };
}

export function TaskModal({ taskId, initialColumnId = 'todo', onClose }) {
  const task = useBoardStore((state) => (taskId ? state.tasksById[taskId] : null));
  const createTask = useBoardStore((state) => state.createTask);
  const updateTask = useBoardStore((state) => state.updateTask);
  const addSubtask = useBoardStore((state) => state.addSubtask);
  const updateSubtask = useBoardStore((state) => state.updateSubtask);
  const deleteSubtask = useBoardStore((state) => state.deleteSubtask);
  const [form, setForm] = useState(() => initialForm(task, initialColumnId));
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitInProgress = useRef(false);
  const subtaskChangeInProgress = useRef(false);
  const localSubtaskCounter = useRef(0);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDrafts, setSubtaskDrafts] = useState({});
  const [subtaskPending, setSubtaskPending] = useState(false);
  const [subtaskError, setSubtaskError] = useState('');
  const dialogRef = useRef(null);
  const isEditing = Boolean(taskId);
  const titleValidationError = formError === 'Enter a task title.' || formError.startsWith('Task titles') ? formError : '';
  const subtasks = isEditing ? task?.subtasks || [] : form.subtasks;
  useDialogFocus(dialogRef, onClose);

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
      className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-primary/50 p-3 backdrop-blur-[2px] sm:p-6 animate-backdrop-in"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="task-modal-title" className="my-auto w-full max-w-3xl overflow-hidden rounded-column border border-border-subtle bg-elevated text-primary shadow-overlay animate-modal-in">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4 sm:px-6">
          <div>
            <p className="text-meta font-semibold uppercase tracking-wide text-accent">{isEditing ? 'Edit issue' : 'New issue'}</p>
            <h2 id="task-modal-title" className="mt-1 text-page font-semibold text-primary">{isEditing ? 'Update task' : 'Create task'}</h2>
            <p className="mt-1 text-secondary text-muted">Fields marked required must be filled in.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close task form" className="rounded-button p-1 text-xl text-muted hover:bg-column focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">×</button>
        </div>

        <form onSubmit={submit} noValidate>
          <div className="grid max-h-[min(70vh,700px)] grid-cols-1 gap-6 overflow-y-auto p-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(220px,.8fr)] sm:px-6">
            <div className="space-y-4">
            <Input id="task-title" label={<>Summary <span aria-hidden="true">*</span></>} name="title" value={form.title} onChange={changeField} maxLength={120} required autoFocus error={titleValidationError} placeholder="Write a concise issue title" />

            <div>
              <label htmlFor="task-description" className="mb-1.5 block text-secondary font-medium">Description</label>
              <textarea id="task-description" name="description" value={form.description} onChange={changeField} rows="4" placeholder="Add details, context, or acceptance criteria…" className="w-full rounded-button border border-border-strong bg-elevated px-3 py-2 text-body text-primary placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
            </div>

            <fieldset className="rounded-card border border-border-subtle p-3" disabled={saving || subtaskPending}>
              <legend className="px-1 text-secondary font-semibold">Checklist</legend>
              <ul className="space-y-2">
                {subtasks.map((subtask) => <li key={subtask._id} className="flex items-center gap-2">
                  <input type="checkbox" checked={subtask.completed} onChange={() => toggleSubtask(subtask)} aria-label={`Mark ${subtask.title} ${subtask.completed ? 'incomplete' : 'complete'}`} className="size-4 accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
                  <input type="text" value={subtaskDrafts[subtask._id] ?? subtask.title} onChange={(event) => setSubtaskDrafts((current) => ({ ...current, [subtask._id]: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); saveSubtaskTitle(subtask); } }} maxLength={120} aria-label={`Checklist item title: ${subtask.title}`} className="min-w-0 flex-1 rounded border border-border-strong bg-elevated px-2 py-1.5 text-secondary text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
                  <button type="button" onClick={() => saveSubtaskTitle(subtask)} disabled={(subtaskDrafts[subtask._id] ?? subtask.title).trim() === subtask.title} aria-label={`Save checklist item title: ${subtask.title}`} className="text-secondary font-medium text-accent hover:underline disabled:opacity-40">Save</button>
                  <button type="button" onClick={() => removeChecklistItem(subtask)} aria-label={`Delete checklist item: ${subtask.title}`} className="text-secondary font-medium text-danger hover:underline">Remove</button>
                </li>)}
              </ul>
              {subtasks.length === 0 && <p className="my-2 text-secondary text-muted">No checklist items yet.</p>}
              <div className="mt-3 flex gap-2"><label htmlFor="new-subtask-title" className="sr-only">New checklist item title</label><input id="new-subtask-title" value={subtaskTitle} onChange={(event) => setSubtaskTitle(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addChecklistItem(); } }} maxLength={120} placeholder="Add a checklist item" className="min-w-0 flex-1 rounded-button border border-border-strong bg-elevated px-3 py-2 text-secondary text-primary placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" /><button type="button" onClick={addChecklistItem} disabled={!subtaskTitle.trim() || subtaskPending || saving} className="rounded-button border border-border-strong px-3 py-2 text-secondary font-semibold text-primary hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-40">Add</button></div>
              {subtaskError && <p className="mt-2 text-secondary font-medium text-danger" role="alert">{subtaskError}</p>}
            </fieldset>
            </div>

            <aside className="space-y-4 rounded-card bg-column p-3 sm:bg-transparent sm:p-0">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Select id="task-priority" label="Priority" name="priority" value={form.priority} onChange={changeField}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </Select>
              </div>
              {!isEditing && (
                <div>
                  <Select id="task-column" label="Status" name="columnId" value={form.columnId} onChange={changeField}>
                    {COLUMNS.map((column) => <option key={column.id} value={column.id}>{column.title}</option>)}
                  </Select>
                </div>
              )}
              {isEditing && <div><span className="mb-1.5 block text-secondary font-medium">Status</span><p className="rounded-button border border-border-subtle bg-card px-3 py-2 text-body text-secondary">{COLUMNS.find(({ id }) => id === task?.columnId)?.title || 'Unknown'}</p><p className="mt-1 text-meta text-muted">Move this issue from its card menu or drag it to another column.</p></div>}
            </div>

            <Input id="task-tags" label={<>Labels <span className="font-normal text-muted">(comma-separated)</span></>} name="tags" value={form.tags} onChange={changeField} placeholder="design, frontend" />
            </aside>
          </div>

          {formError && !titleValidationError && <p id="task-form-error" className="px-6 pb-2 text-secondary font-medium text-danger" role="alert">{formError}</p>}
          <div className="flex justify-end gap-2 border-t border-border-subtle bg-card px-5 py-4 sm:px-6">
            <button type="button" onClick={onClose} className="min-h-9 rounded-button border border-border-strong px-3 text-body font-medium text-secondary hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">Cancel</button>
            <button type="submit" disabled={saving || subtaskPending} className="min-h-9 rounded-button bg-accent px-3 text-body font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-wait disabled:opacity-50">{saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create task'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
