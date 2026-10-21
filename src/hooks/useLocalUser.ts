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
