import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import type { User } from '@/types/user';
import type { LocalChanges } from '@/utils/localChanges';

/*
 * Store локальных изменений — общее клиентское состояние, которое читают
 * список, карточка пользователя, страница профиля и шапка (счётчик изменений).
 * Без store его пришлось бы поднимать в общий layout и передавать через props
 * по всей цепочке компонентов (prop drilling).
 *
 * Все обновления иммутабельны: set получает новый объект, старое состояние не меняется.
 * В браузере состояние живёт до перезагрузки страницы — так же, как «изменения» в DummyJSON.
 */

export interface UsersActions {
  /** DummyJSON на POST /users/add всегда отвечает id = 209 (total + 1), поэтому уникальный id выдаём сами */
  addCreated: (user: User) => User;
  saveUpdated: (user: User) => void;
  /** Optimistic update: запись скрывается сразу, до ответа сервера */
  markDeleted: (id: number) => void;
  /** Откат optimistic update, если сервер вернул ошибку */
  restoreDeleted: (id: number) => void;
  /** Удаление локальной записи: на сервере её нет, запрос не нужен */
  removeCreated: (id: number) => void;
  reset: () => void;
}

export type UsersStore = LocalChanges & UsersActions;
export type UsersStoreApi = ReturnType<typeof createUsersStore>;

export const initialLocalChanges: LocalChanges = { created: [], updated: {}, deletedIds: [] };

export const createUsersStore = (initState: LocalChanges = initialLocalChanges) =>
  createStore<UsersStore>()(
    // devtools: история действий в Redux DevTools (только в режиме разработки)
    devtools(
      (set, get) => ({
        ...initState,

        addCreated: (user) => {
          const id = get().created.reduce((max, item) => Math.max(max, item.id + 1), user.id);
          const created = { ...user, id };
          set((state) => ({ created: [created, ...state.created] }), false, 'users/created');
          return created;
        },

        saveUpdated: (user) =>
          set(
            (state) =>
              state.created.some((item) => item.id === user.id)
                ? { created: state.created.map((item) => (item.id === user.id ? user : item)) }
                : { updated: { ...state.updated, [user.id]: user } },
            false,
            'users/updated',
          ),

        markDeleted: (id) =>
          set(
            (state) => (state.deletedIds.includes(id) ? state : { deletedIds: [...state.deletedIds, id] }),
            false,
            'users/deleted',
          ),

        restoreDeleted: (id) =>
          set((state) => ({ deletedIds: state.deletedIds.filter((item) => item !== id) }), false, 'users/restored'),

        removeCreated: (id) =>
          set((state) => ({ created: state.created.filter((item) => item.id !== id) }), false, 'users/removedLocal'),

        reset: () => set(initialLocalChanges, false, 'users/reset'),
      }),
      { name: 'users-store', enabled: process.env.NODE_ENV !== 'production' },
    ),
  );
