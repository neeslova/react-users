'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useUiStore } from '@/stores/StoreProvider';
import type { User } from '@/types/user';

interface UserActionsProps {
  user: User;
  size?: 'sm' | 'md';
}

/**
 * Кнопки открывают общие диалоги через ui-store. Без store колбэки onEdit/onDelete
 * пришлось бы протаскивать из layout через страницу, список и карточку (prop drilling).
 */
export function UserActions({ user, size = 'sm' }: UserActionsProps) {
  const openDialog = useUiStore((state) => state.openDialog);
  const sizeClass = size === 'sm' ? 'btn-sm btn-ghost' : 'btn-outline';

  return (
    <>
      <button type="button" className={`btn ${sizeClass}`} onClick={() => openDialog({ type: 'edit', user })}>
        <Pencil size={15} /> Изменить
      </button>
      <button
        type="button"
        className={`btn ${sizeClass} ${size === 'sm' ? 'text-error' : 'btn-error'}`}
        onClick={() => openDialog({ type: 'delete', user })}
      >
        <Trash2 size={15} /> Удалить
      </button>
    </>
  );
}
