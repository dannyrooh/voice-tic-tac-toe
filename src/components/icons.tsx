/** Inline icons: no dependency, and they inherit currentColor in both themes. */
const base = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true, focusable: false,
} as const;

export function SunIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg {...base}>
      <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
    </svg>
  );
}

export function HelpIcon() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.3a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4" />
      <path d="M12 16.8h.01" strokeWidth="2.4" />
    </svg>
  );
}

/** Tiny tic-tac-toe grid used as the app mark in the header. */
export function BrandMark() {
  return (
    <svg className="brandmark" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
      <path d="M4.3 4.3 7.7 7.7M7.7 4.3 4.3 7.7" fill="none" stroke="var(--x)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="18" r="2" fill="none" stroke="var(--o)" strokeWidth="2" />
    </svg>
  );
}
