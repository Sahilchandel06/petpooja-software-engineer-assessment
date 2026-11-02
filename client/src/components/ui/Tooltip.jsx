import { cloneElement, useId } from 'react';

export function Tooltip({ label, children }) {
  const id = useId();
  const child = cloneElement(children, { 'aria-describedby': id });
  return <span className="group/tooltip relative inline-flex">{child}<span id={id} role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-primary px-2 py-1 text-meta text-app opacity-0 shadow transition-opacity duration-standard group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">{label}</span></span>;
}
