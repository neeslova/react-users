import { useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/user';
import { useLocalStorage } from './useLocalStorage';

export type Theme = 'corporate' | 'business';

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

/** Светлая/тёмная тема DaisyUI: выставляет data-theme на <html> и запоминает выбор. */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>(
    STORAGE_KEYS.theme,
    prefersDark() ? 'business' : 'corporate',
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((prev) => (prev === 'corporate' ? 'business' : 'corporate')),
    [setTheme],
  );

  return { theme, isDark: theme === 'business', toggleTheme };
}
