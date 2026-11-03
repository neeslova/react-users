import 'server-only';
import { forbidden, redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from '@/auth';
import { loginHref, viewerSchema, type Viewer } from '@/schemas/auth';
import type { Permission } from '@/types/auth';
import { can, FORBIDDEN_MESSAGES, UNAUTHORIZED_MESSAGE } from '@/utils/permissions';
import { ServiceError } from './errors';

/*
 * Data Access Layer сессии: единственное место, где сервер узнаёт,
 * кто делает запрос и что ему разрешено. Его вызывают страницы,
 * Server Functions и Route Handlers (через сервис src/server/users.ts),
 * поэтому проверка прав не зависит от того, каким путём пришёл запрос.
 */

/**
 * Текущий пользователь или null (гость). Auth.js расшифровывает cookie сессии;
 * содержимое дополнительно проверяется схемой. cache() — один разбор cookie
 * на запрос, сколько бы компонентов ни спрашивали.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth();
  const viewer = viewerSchema.safeParse(session?.viewer);
  return viewer.success ? viewer.data : null;
});

/** Для мутаций: гость → 401, нет нужной роли → 403 */
export async function requirePermission(permission: Permission): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new ServiceError(UNAUTHORIZED_MESSAGE, 401);
  if (!can(viewer.role, permission)) throw new ServiceError(FORBIDDEN_MESSAGES[permission], 403);
  return viewer;
}

/**
 * Для страниц: гость → редирект на вход с возвратом обратно,
 * вошёл, но не хватает прав → страница 403 (forbidden.tsx).
 */
export async function requirePageAccess(permission: Permission, returnTo: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(loginHref(returnTo));
  if (!can(viewer.role, permission)) forbidden();
  return viewer;
}
