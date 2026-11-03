import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { COLUMNS } from '../store/boardStore.js';
import { Button } from './ui/Button.jsx';

const PRIORITIES = ['Low', 'Medium', 'High'];

/** Keeps the input responsive while applying the board query after a short pause. */
export function TaskFilters({ query, onQueryChange, priorities, onPrioritiesChange, columns, onColumnsChange, resultCount, totalCount }) {
  const [input, setInput] = useState(query);

  useEffect(() => {
    const timer = window.setTimeout(() => onQueryChange(input.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [input, onQueryChange]);

  useEffect(() => setInput(query), [query]);

  const hasFilters = input || priorities.length || columns.length;

  function toggle(values, setValues, value) {
    setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  function clear() {
    setInput('');
    onQueryChange('');
    onPrioritiesChange([]);
    onColumnsChange([]);
  }

  return (
    <section className="mb-4 rounded-column border border-border-subtle bg-column p-3" aria-label="Search and filter tasks">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search task titles and descriptions</span>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={input} onChange={(event) => setInput(event.target.value)} type="search" placeholder="Search tasks…" className="min-h-10 w-full rounded-button border border-border-subtle bg-card pl-9 pr-3 text-body text-primary placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
        </label>
        <fieldset className="flex flex-wrap items-center gap-1.5">
          <legend className="sr-only">Filter by priority</legend>
          <span className="mr-1 text-meta font-medium text-muted">Priority</span>
          {PRIORITIES.map((priority) => <FilterChip key={priority} pressed={priorities.includes(priority)} onClick={() => toggle(priorities, onPrioritiesChange, priority)}>{priority}</FilterChip>)}
        </fieldset>
        <fieldset className="flex flex-wrap items-center gap-1.5">
          <legend className="sr-only">Filter by column</legend>
          <span className="mr-1 text-meta font-medium text-muted">Column</span>
          {COLUMNS.map((column) => <FilterChip key={column.id} pressed={columns.includes(column.id)} onClick={() => toggle(columns, onColumnsChange, column.id)}>{column.title}</FilterChip>)}
        </fieldset>
      </div>
      <div className="mt-2 flex min-h-7 items-center justify-between gap-2 text-meta text-muted" aria-live="polite">
        <span>Showing {resultCount} of {totalCount} {totalCount === 1 ? 'task' : 'tasks'}</span>
        {hasFilters && <Button variant="ghost" size="small" onClick={clear}><X size={13} aria-hidden="true" />Clear filters</Button>}
      </div>
    </section>
  );
}

function FilterChip({ pressed, onClick, children }) {
  return <button type="button" aria-pressed={pressed} onClick={onClick} className={`min-h-8 rounded-button border px-2.5 text-meta font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${pressed ? 'border-accent bg-accent-subtle text-accent' : 'border-border-subtle bg-card text-secondary hover:border-border-strong hover:bg-card-hover'}`}>{children}</button>;
}
