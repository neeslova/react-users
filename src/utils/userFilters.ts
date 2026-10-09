import type { User, UserRole } from '../types/user';

export type SortField = 'id' | 'name' | 'age';
export type SortOrder = 'asc' | 'desc';

export interface UserFilters {
  query: string;
  role: UserRole | 'all';
  sortBy: SortField;
  order: SortOrder;
}

export const DEFAULT_FILTERS: UserFilters = {
  query: '',
  role: 'all',
  sortBy: 'id',
  order: 'desc', // новые пользователи — сверху
};

export const getFullName = (user: Pick<User, 'firstName' | 'lastName'>) =>
  `${user.firstName} ${user.lastName}`.trim();

/** Поиск по имени, логину, email и компании (аналог GET /users/search?q=) */
const matchesQuery = (user: User, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [getFullName(user), user.username, user.email, user.company.name]
    .some((field) => field.toLowerCase().includes(q));
};

const compare = (a: User, b: User, sortBy: SortField) => {
  switch (sortBy) {
    case 'name':
      return getFullName(a).localeCompare(getFullName(b), 'ru');
    case 'age':
      return a.age - b.age;
    default:
      return a.id - b.id;
  }
};

/** Чистая функция: не мутирует исходный массив, возвращает новый. */
export function filterUsers(users: User[], filters: UserFilters): User[] {
  const direction = filters.order === 'asc' ? 1 : -1;
  return users
    .filter((user) => filters.role === 'all' || user.role === filters.role)
    .filter((user) => matchesQuery(user, filters.query))
    .sort((a, b) => compare(a, b, filters.sortBy) * direction);
}

/** Количество пользователей по ролям — для счётчиков на вкладках */
export function countByRole(users: User[]): Record<UserRole | 'all', number> {
  const counts = { all: users.length, admin: 0, moderator: 0, user: 0 };
  for (const user of users) counts[user.role] += 1;
  return counts;
}

export const hasActiveFilters =(filters: UserFilters) =>
  filters.query.trim() !== '' || filters.role !== 'all';
