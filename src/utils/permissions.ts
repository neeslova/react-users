import type { Permission } from '@/types/auth';
import type { UserRole } from '@/types/user';

/*
 * Матрица прав (RBAC: права выдаются роли, а не конкретному человеку).
 * Модуль общий: интерфейс по нему прячет недоступные кнопки, а сервер
 * повторно проверяет права перед каждой мутацией (src/server/session.ts).
 * Роли берутся из DummyJSON: модератор там есть, по правам он равен пользователю.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  user: ['users:create', 'users:update'],
  moderator: ['users:create', 'users:update'],
  admin: ['users:create', 'users:update', 'users:delete'],
};

/** Гость (role = null) может только смотреть */
export const can = (role: UserRole | null | undefined, permission: Permission): boolean =>
  role ? ROLE_PERMISSIONS[role].includes(permission) : false;

/** Сообщения для 403: что именно запрещено и кому разрешено */
export const FORBIDDEN_MESSAGES: Record<Permission, string> = {
  'users:create': 'Недостаточно прав для добавления пользователей',
  'users:update': 'Недостаточно прав для изменения пользователей',
  'users:delete': 'Удалять пользователей может только администратор',
};

export const UNAUTHORIZED_MESSAGE = 'Войдите в систему, чтобы выполнить это действие';
