import { apiErrorBodySchema, usersPageSchema } from '@/schemas/user';
import type { UserFilters, UsersPage, UsersQuery } from '@/types/user';
import { filtersToSearchParams } from '@/utils/userFilters';

/*
 * Клиентский слой работы с API: запросы браузера к нашим Route Handler'ам
 * (не напрямую к DummyJSON) и «контракт» кэша TanStack Query —
 * ключи запросов и правило определения следующей страницы.
 * response.json() возвращает any, поэтому ответ проверяется схемой, а не приводится через `as`.
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Ключи кэша TanStack Query: фильтры — часть ключа, у каждой комбинации свой кэш */
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...usersKeys.lists(), filters] as const,
};

/** GET /api/users — одна страница списка */
export async function fetchUsersPage(query: UsersQuery, signal?: AbortSignal): Promise<UsersPage> {
  const params = filtersToSearchParams(query);
  params.set('skip', String(query.skip));
  params.set('limit', String(query.limit));

  const response = await fetch(`/api/users?${params}`, { signal });
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = apiErrorBodySchema.safeParse(json);
    throw new ApiError(body.success ? body.data.message : `Ошибка ${response.status}`, response.status);
  }

  const page = usersPageSchema.safeParse(json);
  if (!page.success) throw new ApiError('Сервер вернул данные в неожиданном формате', 502);
  return page.data;
}

/**
 * skip следующей страницы или undefined, если это конец списка.
 * Считаем по серверным данным (skip + сколько пришло), а не по видимым записям:
 * локальные удаления не должны сдвигать смещение, иначе появятся пропуски и дубли.
 */
export function getNextPageParam(lastPage: UsersPage): number | undefined {
  const next = lastPage.skip + lastPage.users.length;
  return lastPage.users.length > 0 && next < lastPage.total ? next : undefined;
}
