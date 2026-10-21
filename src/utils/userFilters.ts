import { DEFAULT_FILTERS } from '@/constants/user';
import type { User, UserFilters, UsersQuery } from '@/types/user';

export const getFullName = (user: Pick<User, 'firstName' | 'lastName'>) =>
  `${user.firstName} ${user.lastName}`.trim();

/**
 * Повторяет логику GET /users/search?q= у DummyJSON: подстрока без учёта
 * регистра в имени, фамилии, логине или email. Нужна для записей, которые
 * изменены или созданы локально: сервер о них не знает, поэтому решать,
 * попадают ли они в выдачу, приходится на клиенте.
 */
export function matchesFilters(user: User, filters: Pick<UserFilters, 'q' | 'role'>) {
  if (filters.role !== 'all' && user.role !== filters.role) return false;
  const q = filters.q.trim().toLowerCase();
  if (!q) return true;
  return [user.firstName, user.lastName, user.username, user.email].some((field) =>
    field.toLowerCase().includes(q),
  );
}

export const hasActiveFilters = (filters: UserFilters) => filters.q !== '' || filters.role !== 'all';

export const isSameFilters = (a: UserFilters, b: UserFilters) =>
  a.q === b.q && a.role === b.role && a.sort === b.sort && a.order === b.order;

/** Фильтры → query string. Значения по умолчанию не пишутся, чтобы URL оставался коротким */
export function filtersToSearchParams(filters: UserFilters) {
  const params = new URLSearchParams();
  for (const key of ['q', 'role', 'sort', 'order'] as const) {
    if (filters[key] !== DEFAULT_FILTERS[key]) params.set(key, filters[key]);
  }
  return params;
}

/**
 * Объект запроса с фиксированным порядком ключей. Аргументы функций с 'use cache'
 * сериализуются в ключ кэша, поэтому одинаковые запросы должны выглядеть одинаково.
 */
export const toUsersQuery = (filters: UserFilters, skip: number, limit: number): UsersQuery => ({
  q: filters.q,
  role: filters.role,
  sort: filters.sort,
  order: filters.order,
  skip,
  limit,
});
