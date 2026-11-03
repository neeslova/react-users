import { useMemo } from 'react';
import { createUserAction, deleteUserAction, updateUserAction } from '@/app/users/actions';
import type { UserInput } from '@/schemas/user';
import { useUiStoreApi, useUsersStoreApi } from '@/stores/StoreProvider';
import type { MutationResult } from '@/types/api';
import type { User } from '@/types/user';
import { getFullName } from '@/utils/userFilters';
import { applyUserInput } from '@/utils/userForm';

const NETWORK_ERROR = 'Нет связи с сервером. Проверьте подключение и попробуйте снова';

/**
 * Мутации из интерфейса: вызов Server Function + обновление store + уведомление.
 * Компоненты (диалоги) не знают, как устроены мутации, — они вызывают эти функции.
 *
 * Состояние читается через getState() в момент вызова: хуку не нужно
 * подписываться на store, и возвращаемые функции стабильны.
 */
export function useUserMutations() {
  const usersStore = useUsersStoreApi();
  const uiStore = useUiStoreApi();

  return useMemo(() => {
    const users = () => usersStore.getState();
    const ui = () => uiStore.getState();
    const isLocal = (id: number) => users().created.some((user) => user.id === id);

    /** Счётчик мутаций в полёте (индикатор в шапке) + сетевые ошибки → результат */
    async function send<T>(request: () => Promise<MutationResult<T>>): Promise<MutationResult<T>> {
      ui().mutationStarted();
      try {
        return await request();
      } catch {
        // status 0 — как у fetch без ответа: до сервера запрос не дошёл
        return { ok: false, status: 0, message: NETWORK_ERROR };
      } finally {
        ui().mutationFinished();
      }
    }

    async function createUser(input: UserInput): Promise<MutationResult<User>> {
      const result = await send(() => createUserAction(input));
      if (!result.ok) return result;

      const user = users().addCreated(result.data);
      ui().showToast(`Пользователь ${getFullName(user)} добавлен`, 'success', `/users/${user.id}`);
      return { ok: true, data: user };
    }

    async function updateUser(user: User, input: UserInput): Promise<MutationResult<User>> {
      // Созданной локально записи на сервере нет (PUT вернул бы 404) — меняем её только в store
      if (isLocal(user.id)) {
        const updated = applyUserInput(user, input);
        users().saveUpdated(updated);
        ui().showToast(`Изменения для ${getFullName(updated)} сохранены`);
        return { ok: true, data: updated };
      }

      const result = await send(() => updateUserAction(user.id, input));
      if (!result.ok) return result;

      users().saveUpdated(result.data);
      ui().showToast(`Изменения для ${getFullName(result.data)} сохранены`);
      return result;
    }

    /**
     * Optimistic update: запись пропадает из интерфейса сразу, а запрос идёт
     * в фоне. Если сервер ответил ошибкой — откатываем изменение и сообщаем об этом.
     */
    function deleteUser(user: User) {
      const name = getFullName(user);

      if (isLocal(user.id)) {
        users().removeCreated(user.id);
        ui().showToast(`Пользователь ${name} удалён`, 'info');
        return;
      }

      users().markDeleted(user.id);
      void send(() => deleteUserAction(user.id)).then((result) => {
        if (result.ok) {
          ui().showToast(`Пользователь ${name} удалён`, 'info');
        } else {
          users().restoreDeleted(user.id);
          ui().showToast(`Не удалось удалить ${name}: ${result.message}`, 'error');
        }
      });
    }

    function resetLocalChanges() {
      users().reset();
      ui().showToast('Локальные изменения сброшены — показаны данные сервера', 'info');
    }

    return { createUser, updateUser, deleteUser, resetLocalChanges };
  }, [usersStore, uiStore]);
}
