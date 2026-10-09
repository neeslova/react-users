import { useEffect, useState } from 'react';

/**
 * Возвращает значение, которое обновляется только после паузы в delay мс.
 * Каждое новое value перезапускает таймер: функция очистки useEffect
 * отменяет предыдущий setTimeout.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
