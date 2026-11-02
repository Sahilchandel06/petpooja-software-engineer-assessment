export function LoadingSkeleton() {
  return <div className="grid grid-cols-1 gap-4 lg:grid-cols-board" aria-label="Loading tasks" aria-busy="true">
    {[0, 1, 2].map((column) => <section key={column} className="min-h-72 rounded-column bg-column p-3"><div className="skeleton-surface mb-4 h-5 w-32 animate-shimmer rounded" />{[0, 1, 2].map((card) => <div key={card} className="skeleton-surface mb-2.5 h-28 animate-shimmer rounded-card" />)}</section>)}
    <span className="sr-only" role="status">Loading tasks…</span>
  </div>;
}
