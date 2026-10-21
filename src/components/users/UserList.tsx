import type { User } from '@/types/user';
import type { LocalStatus } from '@/utils/localChanges';
import { UserCard } from './UserCard';
import { UserCardSkeleton } from './UsersSkeletons';

interface UserListProps {
  users: User[];
  statusOf: (id: number) => LocalStatus;
  /** Сколько плейсхолдеров показать в конце, пока грузится следующая страница */
  loadingCount?: number;
}

/**
 * Рендер списка через map. key={user.id} — стабильный уникальный идентификатор:
 * React сопоставляет по нему карточки между рендерами и не пересоздаёт их,
 * когда дозагружаются страницы или запись удаляется.
 */
export function UserList({ users, statusOf, loadingCount = 0 }: UserListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <UserCard key={user.id} user={user} status={statusOf(user.id)} />
      ))}
      {Array.from({ length: loadingCount }, (_, index) => (
        <UserCardSkeleton key={`loading-${index}`} />
      ))}
    </div>
  );
}
