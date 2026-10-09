import type { Gender, UserRole } from '../types/user';

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

export const ROLES = Object.keys(ROLE_LABELS) as UserRole[];
export const GENDERS = Object.keys(GENDER_LABELS) as Gender[];

export const STORAGE_KEYS = {
  users: 'users-lab:users-v2', // v2 — русифицированные данные (старые сохранения игнорируются)
  theme: 'users-lab:theme',
} as const;
