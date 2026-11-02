export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Loading tasks" aria-busy="true">
      {[0, 1, 2].map((column) => (
        <section key={column} className="min-h-64 rounded-xl bg-slate-100 p-4 dark:bg-slate-900">
          <div className="mb-4 h-6 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          {[0, 1].map((card) => (
            <div key={card} className="mb-3 h-28 animate-pulse rounded-lg bg-white shadow-sm dark:bg-slate-800" />
          ))}
        </section>
      ))}
      <span className="sr-only" role="status">Loading tasks…</span>
    </div>
  );
}
