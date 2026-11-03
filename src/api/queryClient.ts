import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

/** Настройки кэша TanStack Query — общие для приложения и тестов */
export const QUERY_DEFAULTS = {
  queries: {
    // Первая страница приходит с сервера: минуту считаем её свежей и не перезапрашиваем
    staleTime: 60_000,
    // Повторная загрузка — по кнопке «Обновить», а не при каждом возврате на вкладку
    refetchOnWindowFocus: false,
    retry: 1,
  },
} satisfies DefaultOptions;

export const makeQueryClient = (overrides: DefaultOptions['queries'] = {}) =>
  new QueryClient({ defaultOptions: { queries: { ...QUERY_DEFAULTS.queries, ...overrides } } });
