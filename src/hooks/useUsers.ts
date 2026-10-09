import { useCallback } from 'react';
import { STORAGE_KEYS } from '../constants/user';
import { mockUsersResponse } from '../data/mockUsers';
import type { User, UserDraft } from '../types/user';
import { useLocalStorage } from './useLocalStorage';

const nextId = (users: User[]) => users.reduce((max, u) => Math.max(max, u.id), 0) + 1;

/**
 * Кастомный хук с CRUD-логикой над списком пользователей.
 * Компоненты не знают, где хранятся данные (сейчас — localStorage,
 * позже — dummyjson API): они получают массив и функции-колбэки.
 *
 * Все обновления — через функциональную форму setUsers(prev => ...),
 * поэтому колбэки не зависят от текущего users и стабильны (useCallback).
 * Состояние не мутируется: каждый раз создаётся новый массив.
 */
export function useUsers() {
  const [users, setUsers] = useLocalStorage<User[]>(STORAGE_KEYS.users, mockUsersResponse.users);

  /** POST /users/add */
  const addUser = useCallback(
    (draft: UserDraft) => {
      setUsers((prev) => [{ ...draft, id: nextId(prev) }, ...prev]);
    },
    [setUsers],
  );

  /** PUT /users/:id */
  const updateUser = useCallback(
    (id: number, draft: UserDraft) => {
      setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, ...draft, id } : user)));
    },
    [setUsers],
  );

  /** DELETE /users/:id */
  const deleteUser = useCallback(
    (id: number) => {
      setUsers((prev) => prev.filter((user) => user.id !== id));
    },
    [setUsers],
  );

  /** Вернуть исходные мок-данные */
  const resetUsers = useCallback(() => setUsers(mockUsersResponse.users), [setUsers]);

  return { users, addUser, updateUser, deleteUser, resetUsers };
}
