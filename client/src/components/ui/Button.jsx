const variants = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover shadow-sm',
  secondary: 'border border-border-strong bg-elevated text-secondary hover:bg-card-hover',
  ghost: 'text-secondary hover:bg-card-hover',
  danger: 'bg-danger text-on-danger hover:opacity-90',
};

export function Button({ variant = 'secondary', size = 'normal', className = '', type = 'button', ...props }) {
  const sizing = size === 'small' ? 'min-h-8 px-2.5 text-secondary' : 'min-h-9 px-3 text-body';
  return <button type={type} className={`inline-flex items-center justify-center gap-2 rounded-button font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-app disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizing} ${className}`} {...props} />;
}
