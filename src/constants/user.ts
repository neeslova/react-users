import type { Gender, SortField, SortOrder, UserFilters, UserRole } from '@/types/user';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  moderator: 'Модератор',
  user: 'Пользователь',
};

export const ROLE_PLURAL_LABELS: Record<UserRole, string> = {
  admin: 'Администраторы',
  moderator: 'Модераторы',
  user: 'Пользователи',
};

/** Классы DaisyUI для бейджа каждой роли */
export const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  admin: 'badge-error',
  moderator: 'badge-warning',
  user: 'badge-info',
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Мужской',
  female: 'Женский',
};

export const SORT_LABELS: Record<SortField, string> = {
  id: 'По дате добавления',
  name: 'По имени',
  age: 'По возрасту',
};

export const ROLES = ['admin', 'moderator', 'user'] as const satisfies readonly UserRole[];
export const GENDERS = ['female', 'male'] as const satisfies readonly Gender[];
export const SORT_FIELDS = ['id', 'name', 'age'] as const satisfies readonly SortField[];
export const SORT_ORDERS = ['asc', 'desc'] as const satisfies readonly SortOrder[];

export const DEFAULT_FILTERS: UserFilters = {
  q: '',
  role: 'all',
  sort: 'id',
  order: 'desc', // новые пользователи — сверху (как в ЛР1)
};

/** Размер страницы для limit/skip-пагинации */
export const USERS_PAGE_SIZE = 12;

export const SEARCH_DEBOUNCE_MS = 400;

export const THEME_STORAGE_KEY = 'users-lab:theme';
