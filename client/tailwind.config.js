/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        app: 'var(--bg-app)',
        column: 'var(--bg-column)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        elevated: 'var(--bg-elevated)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-subtle': 'var(--accent-subtle)',
        focus: 'var(--focus-ring)',
        danger: 'var(--danger)',
        'danger-subtle': 'var(--danger-subtle)',
        success: 'var(--success)',
        'success-subtle': 'var(--success-subtle)',
        warning: 'var(--warning)',
        'warning-subtle': 'var(--warning-subtle)',
        'on-accent': 'var(--text-on-accent)',
        'on-danger': 'var(--text-on-danger)',
        'status-todo': 'var(--status-todo)',
        'status-progress': 'var(--status-progress)',
        'status-done': 'var(--status-done)',
      },
      fontFamily: {
        sans: ['InterVariable', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        meta: ['12px', { lineHeight: '16px' }],
        secondary: ['13px', { lineHeight: '18px' }],
        body: ['14px', { lineHeight: '20px' }],
        modal: ['16px', { lineHeight: '24px' }],
        page: ['20px', { lineHeight: '28px' }],
      },
      fontWeight: { regular: '400', medium: '500', semibold: '600' },
      borderRadius: {
        badge: '4px',
        button: '6px',
        card: '6px',
        column: '8px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        overlay: 'var(--shadow-overlay)',
      },
      transitionDuration: { fast: '140ms', standard: '160ms' },
      gridTemplateColumns: {
        board: 'repeat(3, minmax(0, 1fr))',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '180% 0' },
          '100%': { backgroundPosition: '-80% 0' },
        },
        'backdrop-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'modal-in': {
          from: { opacity: '0', transform: 'scale(.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s ease-in-out infinite',
        'backdrop-in': 'backdrop-in 150ms ease-out both',
        'modal-in': 'modal-in 150ms ease-out both',
      },
    },
  },
  plugins: [],
};
