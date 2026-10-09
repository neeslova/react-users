import type { User, UserDraft } from '../../types/user';
import { Modal } from '../ui/Modal';
import { UserForm } from './UserForm';

/** Размеченное объединение: в режиме edit всегда есть user, в других — нет */
export type UserFormState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; user: User };

interface UserFormModalProps {
  state: UserFormState;
  takenUsernames: ReadonlySet<string>;
  onSubmit: (draft: UserDraft) => void;
  onClose: () => void;
}

export function UserFormModal({ state, takenUsernames, onSubmit, onClose }: UserFormModalProps) {
  const editingUser = state.mode === 'edit' ? state.user : null;

  return (
    <Modal
      open={state.mode !== 'closed'}
      title={editingUser ? 'Редактирование пользователя' : 'Новый пользователь'}
      onClose={onClose}
      wide
    >
      {/*
        Условный рендеринг: форма монтируется заново при каждом открытии,
        а key гарантирует новый экземпляр (сброс state) при смене пользователя.
      */}
      {state.mode !== 'closed' && (
        <UserForm
          key={editingUser?.id ?? 'new'}
          initialUser={editingUser}
          takenUsernames={takenUsernames}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
