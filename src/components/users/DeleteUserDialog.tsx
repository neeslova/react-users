'use client';

import { useUserMutations } from '@/hooks/useUserMutations';
import { useUiStore } from '@/stores/StoreProvider';
import { getFullName } from '@/utils/userFilters';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function DeleteUserDialog() {
  const dialog = useUiStore((state) => state.dialog);
  const closeDialog = useUiStore((state) => state.closeDialog);
  const { deleteUser } = useUserMutations();
  const user = dialog.type === 'delete' ? dialog.user : null;

  return (
    <ConfirmDialog
      open={user !== null}
      title="Удалить пользователя?"
      confirmLabel="Удалить"
      danger
      onConfirm={() => {
        if (!user) return;
        // Окно закрывается сразу: удаление оптимистичное, запрос продолжится в фоне
        deleteUser(user);
        closeDialog();
      }}
      onCancel={closeDialog}
    >
      {user && (
        <p>
          Пользователь <b>{getFullName(user)}</b> (@{user.username}) будет удалён из списка.
        </p>
      )}
    </ConfirmDialog>
  );
}

export function ResetChangesDialog() {
  const isOpen = useUiStore((state) => state.dialog.type === 'reset');
  const closeDialog = useUiStore((state) => state.closeDialog);
  const { resetLocalChanges } = useUserMutations();

  return (
    <ConfirmDialog
      open={isOpen}
      title="Сбросить локальные изменения?"
      confirmLabel="Сбросить"
      onConfirm={() => {
        resetLocalChanges();
        closeDialog();
      }}
      onCancel={closeDialog}
    >
      <p>
        Добавленные записи исчезнут, изменённые и удалённые вернутся к данным сервера DummyJSON — как после
        перезагрузки страницы.
      </p>
    </ConfirmDialog>
  );
}
