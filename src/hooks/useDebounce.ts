import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Отложенный вызов: callback выполнится через delay мс после последнего вызова.
 * Каждый новый вызов перезапускает таймер. Работает от событий (onChange),
 * а не от эффекта, поэтому нет цепочки «state → эффект → новый state».
 */
export function useDebouncedCallback<A extends unknown[]>(callback: (...args: A) => void, delay: number) {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Таймер всегда вызывает свежий callback, даже если тот изменился после запуска
  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  const cancel = useCallback(() => clearTimeout(timerRef.current), []);

  // Отмена при размонтировании
  useEffect(() => cancel, [cancel]);

  const debounced = useCallback(
    (...args: A) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay],
  );

  return [debounced, cancel] as const;
}
