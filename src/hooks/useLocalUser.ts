import { useMemo } from 'react';
import { useUsersStore } from '@/stores/StoreProvider';
import type { User } from '@/types/user';
import type { LocalStatus } from '@/utils/localChanges';

/**
 * Пользователь с учётом локальных изменений: сервер отдал исходную версию,
 * а в store может лежать изменённая (или отметка об удалении).
 * Каждый селектор возвращает ссылку из состояния или примитив — подписка точечная.
 */
export function useLocalUser(serverUser: User): { user: User; status: LocalStatus } {
  const { id } = serverUser;
  const created = useUsersStore((state) => state.created.find((user) => user.id === id));
  const updated = useUsersStore((state) => state.updated[id]);
  const deleted = useUsersStore((state) => state.deletedIds.includes(id));

  if (deleted) return { user: updated ?? serverUser, status: 'deleted' };
  if (created) return { user: created, status: 'created' };
  if (updated) return { user: updated, status: 'updated' };
  return { user: serverUser, status: 'server' };
}

/**
 * Запись для страницы изменения: локальная версия (созданная или изменённая
 * в этой сессии) важнее серверной. null — записи нет или она удалена.
 */
export function useEditableUser(id: number, serverUser: User | null): User | null {
  const created = useUsersStore((state) => state.created.find((user) => user.id === id));
  const updated = useUsersStore((state) => state.updated[id]);
  const deleted = useUsersStore((state) => state.deletedIds.includes(id));

  if (deleted) return null;
  return created ?? updated ?? serverUser;
}

/** Логины локальных записей (о них сервер не знает); свой логин при изменении не считается занятым */
export function useTakenUsernames(except: User | null): ReadonlySet<string> {
  const created = useUsersStore((state) => state.created);
  const updated = useUsersStore((state) => state.updated);
  const ownUsername = except?.username.toLowerCase();

  return useMemo(() => {
    const taken = new Set([...created, ...Object.values(updated)].map((user) => user.username.toLowerCase()));
    if (ownUsername) taken.delete(ownUsername);
    return taken;
  }, [created, updated, ownUsername]);
}
