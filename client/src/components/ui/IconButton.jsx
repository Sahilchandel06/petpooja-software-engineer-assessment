import { Tooltip } from './Tooltip.jsx';

export function IconButton({ label, children, className = '', ...props }) {
  return <Tooltip label={label}><button type="button" aria-label={label} className={`inline-flex size-8 items-center justify-center rounded-button text-secondary transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50 ${className}`} {...props}>{children}</button></Tooltip>;
}
