export function Avatar({ label = 'TaskFlow', initials = 'TF' }) {
  return <span role="img" aria-label={label} className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-meta font-semibold text-accent">{initials}</span>;
}
