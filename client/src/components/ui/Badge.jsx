const styles = {
  neutral: 'bg-column text-secondary',
  high: 'bg-danger-subtle text-danger',
  medium: 'bg-warning-subtle text-warning',
  low: 'bg-success-subtle text-success',
};

export function Badge({ variant = 'neutral', className = '', ...props }) {
  return <span className={`inline-flex items-center rounded-badge px-2 py-0.5 text-meta font-medium ${styles[variant]} ${className}`} {...props} />;
}
