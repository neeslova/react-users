'use client';

import { useUiStore } from '@/stores/StoreProvider';
import { UserForm } from './UserForm';

/**
 * Окно добавления/изменения. Открывается из любого места через ui-store.
 * Форма монтируется заново при каждом открытии, а key даёт новый экземпляр
 * (и чистое состояние) при смене пользователя.
 */
export function UserFormModal() {
  const dialog = useUiStore((state) => state.dialog);
  if (dialog.type !== 'create' && dialog.type !== 'edit') return null;

  const user = dialog.type === 'edit' ? dialog.user : null;
  return <UserForm key={user?.id ?? 'new'} initialUser={user} />;
}
