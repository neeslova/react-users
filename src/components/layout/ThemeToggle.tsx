'use client';

import { Moon, Sun } from 'lucide-react';
import { useLayoutEffect } from 'react';
import { THEME_STORAGE_KEY } from '@/constants/user';

const LIGHT = 'corporate';
const DARK = 'business';

function readStoredTheme() {
  try {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    if (theme === LIGHT || theme === DARK) return theme;
  } catch {
    /* хранилище недоступно (приватный режим) */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
}

/**
 * Тема — атрибут data-theme на <html>. До гидратации его выставляет inline-скрипт
 * в layout (без «мигания» светлой темы), поэтому React-состояния у переключателя нет:
 * нужную иконку выбирает CSS-вариант dark:, и разметка сервера совпадает с клиентской.
 */
export function ThemeToggle() {
  // В dev StrictMode повторно монтирует дерево и сбрасывает атрибуты <html>,
  // стирая выставленный скриптом data-theme, — восстанавливаем до отрисовки
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = readStoredTheme();
  }, []);

  const toggleTheme = () => {
    const next = document.documentElement.dataset.theme === DARK ? LIGHT : DARK;
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* тема просто не запомнится */
    }
  };

  return (
    <button
      type="button"
      className="btn btn-ghost btn-square"
      onClick={toggleTheme}
      aria-label="Сменить тему"
      title="Сменить тему"
    >
      <Moon size={18} className="dark:hidden" />
      <Sun size={18} className="hidden dark:block" />
    </button>
  );
}
