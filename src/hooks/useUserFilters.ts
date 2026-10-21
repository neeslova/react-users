import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { parseUserFilters } from '@/schemas/user';
import type { UserFilters } from '@/types/user';
import { filtersToSearchParams } from '@/utils/userFilters';

/**
 * Фильтры списка живут в URL: ссылкой можно поделиться, а Server Component
 * при прямом заходе сразу загружает нужную выдачу.
 *
 * Меняются они через native History API (replaceState): Next.js синхронизирует
 * с ним useSearchParams, но запрос к серверу не отправляет — следующую выдачу
 * загружает TanStack Query через Route Handler.
 */
export function useUserFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const filters = useMemo(() => parseUserFilters(searchParams), [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<UserFilters>) => {
      // Берём текущий URL, а не filters из замыкания: вызов мог быть отложен (debounce)
      const current = parseUserFilters(new URLSearchParams(window.location.search));
      const query = filtersToSearchParams({ ...current, ...patch }).toString();
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname);
    },
    [pathname],
  );

  return { filters, setFilters };
}
