export function EmptyState({ title = 'Nothing here yet', message = 'Add a task to get started.' }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center dark:border-slate-700">
      <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  );
}
