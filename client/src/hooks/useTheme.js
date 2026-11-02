import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'taskflow-theme';

function readTheme() {
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme) {
    return document.documentElement.dataset.theme;
  }
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (_error) {
    // Fall through to the system preference when browser storage is unavailable.
  }
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.theme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState(readTheme);

  const setTheme = useCallback((nextTheme) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark') return;
    applyTheme(nextTheme);
    setThemeState(nextTheme);
    try { localStorage.setItem(THEME_KEY, nextTheme); } catch (_error) {
      // Theme still applies for this page load even if persistence is blocked.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  useEffect(() => {
    function syncFromAnotherTab(event) {
      if (event.key === THEME_KEY && (event.newValue === 'light' || event.newValue === 'dark')) {
        applyTheme(event.newValue);
        setThemeState(event.newValue);
      }
    }
    window.addEventListener('storage', syncFromAnotherTab);
    return () => window.removeEventListener('storage', syncFromAnotherTab);
  }, []);

  return { theme, setTheme, toggleTheme };
}
