'use client';

import { UserRoundX } from 'lucide-react';
import { useParams } from 'next/navigation';
import { EmptyState } from '@/components/ui/EmptyState';
import { BackToListLink } from '@/components/users/BackToListLink';
import { UserDetails } from '@/components/users/UserDetails';
import { parseUserId } from '@/schemas/user';
import { useUsersStore } from '@/stores/StoreProvider';

/**
 * notFound() в page.tsx: такого id нет на сервере. Но запись могла быть создана
 * в этой сессии — DummyJSON её не сохранил, а store помнит. Тогда показываем её профиль.
 * Поэтому этот not-found — Client Component: ему нужны useParams и store.
 */
export default function UserNotFound() {
  const params = useParams<{ id: string }>();
  const id = parseUserId(params.id);
  const localUser = useUsersStore((state) => state.created.find((user) => user.id === id));

  if (localUser) {
    return (
      <UserDetails serverUser={localUser}>
        <div role="note" className="alert alert-info alert-soft">
          Запись создана в этой сессии и хранится только в браузере: DummyJSON новые записи не сохраняет,
          поэтому постов и задач у неё нет.
        </div>
      </UserDetails>
    );
  }

  return (
    <EmptyState
      icon={UserRoundX}
      title="Пользователь не найден"
      description="Записи с таким id нет на сервере — возможно, адрес набран с ошибкой или запись удалена."
      action={<BackToListLink className="btn btn-primary" />}
    />
  );
}
