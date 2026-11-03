'use client';

import { createContext, use, type ReactNode } from 'react';
import type { Viewer } from '@/schemas/auth';
import type { Permission } from '@/types/auth';
import { can } from '@/utils/permissions';

/*
 * Текущий пользователь для Client Components. Корневой layout не ждёт сессию,
 * а передаёт промис: оболочка страницы остаётся статической, а компоненты,
 * которым нужен пользователь, читают его через use() внутри своего <Suspense>.
 * Так «текущий пользователь» не протаскивается пропсами через список и карточки.
 *
 * Права здесь — только для интерфейса (спрятать недоступные кнопки).
 * Настоящую проверку делает сервер перед каждой мутацией.
 */

const ViewerContext = createContext<Promise<Viewer | null> | null>(null);

export function ViewerProvider({ viewer, children }: { viewer: Promise<Viewer | null>; children: ReactNode }) {
  return <ViewerContext value={viewer}>{children}</ViewerContext>;
}

/** Текущий пользователь или null (гость). Компонент должен быть внутри <Suspense> */
export function useViewer(): Viewer | null {
  const viewer = use(ViewerContext);
  if (!viewer) throw new Error('useViewer нужно вызывать внутри <ViewerProvider>');
  return use(viewer);
}

/** Есть ли у текущего пользователя право на действие */
export function useCan(permission: Permission): boolean {
  return can(useViewer()?.role, permission);
}
