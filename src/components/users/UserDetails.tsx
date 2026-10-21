'use client';

import { Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLocalUser } from '@/hooks/useLocalUser';
import type { User } from '@/types/user';
import { getFullName } from '@/utils/userFilters';
import { EmptyState } from '../ui/EmptyState';
import { BackToListLink } from './BackToListLink';
import { UserActions } from './UserActions';
import { UserProfileView } from './UserProfileView';

interface UserDetailsProps {
  /** Версия с сервера (или локальная запись, если на сервере её нет) */
  serverUser: User;
  /** Секции, отрендеренные на сервере (посты, задачи) */
  children?: ReactNode;
}

/**
 * Клиентская «обёртка» профиля: подставляет локальную версию записи из store
 * (после правки) или показывает, что запись удалена.
 *
 * children — Server Components, переданные из page.tsx: клиентский компонент
 * получает уже готовый результат их рендера и просто вставляет его в разметку.
 * Код UserPosts/UserTodos в клиентский бандл не попадает.
 */
export function UserDetails({ serverUser, children }: UserDetailsProps) {
  const { user, status } = useLocalUser(serverUser);

  if (status === 'deleted') {
    return (
      <EmptyState
        icon={Trash2}
        title="Пользователь удалён"
        description={`${getFullName(user)} удалён в этой сессии. DummyJSON удаление только имитирует — после перезагрузки страницы запись вернётся.`}
        action={<BackToListLink className="btn btn-primary" />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <UserProfileView user={user} status={status} actions={<UserActions user={user} size="md" />} />
      {children}
    </div>
  );
}
