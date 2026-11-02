export function Select({ id, label, children, className = '', ...props }) {
  return <div className="grid gap-1.5"><label htmlFor={id} className="text-body font-medium text-secondary">{label}</label><select id={id} className={`min-h-10 w-full rounded-button border border-border-strong bg-elevated px-3 text-body text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ${className}`} {...props}>{children}</select></div>;
}
