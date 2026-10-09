import { useEffect, useState } from 'react';

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
};

/**
 * Кастомный хук: useState, который синхронизируется с localStorage.
 *  - ленивая инициализация useState(() => ...) читает хранилище только при первом рендере;
 *  - useEffect записывает значение после каждого изменения (побочный эффект вне рендера).
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => read(key, initialValue));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* хранилище недоступно (приватный режим) — работаем только в памяти */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
