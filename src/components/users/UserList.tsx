import type { User } from '../../types/user';
import { UserCard } from './UserCard';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

/**
 * Рендер списка через map. key={user.id} — стабильный уникальный
 * идентификатор: React по нему сопоставляет элементы между рендерами
 * и не пересоздаёт карточки при сортировке, фильтрации и удалении.
 */
export function UserList({ users, onEdit, onDelete }: UserListProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {users.map((user) => (
        <UserCard key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </section>
  );
}
