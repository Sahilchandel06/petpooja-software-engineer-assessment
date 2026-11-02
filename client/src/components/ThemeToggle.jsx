import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme.js';
import { IconButton } from './ui/IconButton.jsx';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const Icon = theme === 'dark' ? Sun : Moon;
  return <IconButton label={`Switch to ${nextTheme} mode`} aria-pressed={theme === 'dark'} onClick={toggleTheme}><Icon size={16} aria-hidden="true" /></IconButton>;
}
