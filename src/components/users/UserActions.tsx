'use client';

import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { useUiStore } from '@/stores/StoreProvider';
import type { User } from '@/types/user';
import { can } from '@/utils/permissions';
import { useViewer } from '../auth/ViewerProvider';

interface UserActionsProps {
  user: User;
  size?: 'sm' | 'md';
}

/**
 * Действия над записью по правам текущего пользователя: гость не видит ничего,
 * пользователь и модератор — «Изменить», администратор — ещё и «Удалить».
 * Скрытая кнопка — только удобство: сервер проверяет права сам.
 *
 * Свой <Suspense>: кнопки ждут сессию, а карточка и профиль показываются сразу.
 */
export function UserActions(props: UserActionsProps) {
  return (
    <Suspense fallback={null}>
      <PermittedActions {...props} />
    </Suspense>
  );
}

function PermittedActions({ user, size = 'sm' }: UserActionsProps) {
  const viewer = useViewer();
  const openDialog = useUiStore((state) => state.openDialog);
  const sizeClass = size === 'sm' ? 'btn-sm btn-ghost' : 'btn-outline';

  return (
    <>
      {can(viewer?.role, 'users:update') && (
        <Link href={`/users/${user.id}/edit`} className={`btn ${sizeClass}`}>
          <Pencil size={15} aria-hidden /> Изменить
        </Link>
      )}
      {can(viewer?.role, 'users:delete') && (
        <button
          type="button"
          className={`btn ${sizeClass} ${size === 'sm' ? 'text-error' : 'btn-error'}`}
          onClick={() => openDialog({ type: 'delete', user })}
        >
          <Trash2 size={15} aria-hidden /> Удалить
        </button>
      )}
    </>
  );
}
