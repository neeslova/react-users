import type { User } from '../../types/user';
import { getFullName } from '../../utils/userFilters';
import { ConfirmDialog } from '../ui/ConfirmDialog';

interface DeleteUserDialogProps {
  user: User | null;
  onConfirm: (user: User) => void;
  onCancel: () => void;
}

export function DeleteUserDialog({ user, onConfirm, onCancel }: DeleteUserDialogProps) {
  return (
    <ConfirmDialog
      open={user !== null}
      title="Удалить пользователя?"
      confirmLabel="Удалить"
      danger
      onConfirm={() => user && onConfirm(user)}
      onCancel={onCancel}
    >
      {user && (
        <p>
          Пользователь <b>{getFullName(user)}</b> (@{user.username}) будет удалён из списка. Это действие
          нельзя отменить.
        </p>
      )}
    </ConfirmDialog>
  );
}
