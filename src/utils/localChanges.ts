import type { User, UserFilters } from '@/types/user';
import { matchesFilters } from './userFilters';

/**
 * Локальные изменения поверх данных сервера.
 * DummyJSON только имитирует POST/PUT/DELETE и ничего не сохраняет: повторный
 * запрос вернёт исходные данные. Поэтому результат мутаций хранится в клиентском
 * store и накладывается на каждый ответ сервера при рендере.
 */
export interface LocalChanges {
  /** Созданные в этой сессии (новые — первыми). На сервере их нет */
  created: User[];
  /** Изменённые записи сервера: id → актуальная версия */
  updated: Record<number, User>;
  /** Удалённые записи сервера */
  deletedIds: number[];
}

export type LocalStatus = 'server' | 'created' | 'updated' | 'deleted';

export interface VisibleUsers {
  users: User[];
  /** Сколько загруженных серверных записей скрыто (удалены или после правки не подходят под фильтр) */
  hiddenCount: number;
  /** Сколько локальных записей подходит под фильтр */
  createdCount: number;
}

/**
 * Чистая функция: страницы с сервера + локальные изменения → то, что видит пользователь.
 *  - локально созданные, подходящие под фильтр, — сверху;
 *  - дубли по id отбрасываются: одна запись может прийти в двух страницах,
 *    если данные на сервере сдвинулись между запросами (skip-пагинация);
 *  - изменённые подменяются актуальной версией, удалённые — пропускаются.
 */
export function applyLocalChanges(
  serverUsers: readonly User[],
  changes: LocalChanges,
  filters: UserFilters,
): VisibleUsers {
  const deleted = new Set(changes.deletedIds);
  const seen = new Set<number>();
  const users: User[] = [];

  for (const user of changes.created) {
    if (seen.has(user.id) || !matchesFilters(user, filters)) continue;
    seen.add(user.id);
    users.push(user);
  }
  const createdCount = users.length;

  let hiddenCount = 0;
  for (const serverUser of serverUsers) {
    if (seen.has(serverUser.id)) continue;
    seen.add(serverUser.id);

    const updated = changes.updated[serverUser.id];
    // Серверные записи уже отфильтрованы API; перепроверяем только изменённые локально
    if (deleted.has(serverUser.id) || (updated && !matchesFilters(updated, filters))) {
      hiddenCount += 1;
      continue;
    }
    users.push(updated ?? serverUser);
  }

  return { users, hiddenCount, createdCount };
}

export function getLocalStatus(id: number, changes: LocalChanges): LocalStatus {
  if (changes.deletedIds.includes(id)) return 'deleted';
  if (changes.created.some((user) => user.id === id)) return 'created';
  if (id in changes.updated) return 'updated';
  return 'server';
}

/** Число изменений для индикатора в шапке (правка удалённой записи отдельно не считается) */
export function countLocalChanges({ created, updated, deletedIds }: LocalChanges) {
  const deleted = new Set(deletedIds);
  const updatedCount = Object.keys(updated).filter((id) => !deleted.has(Number(id))).length;
  return created.length + updatedCount + deleted.size;
}
