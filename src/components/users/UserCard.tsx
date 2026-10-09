import { memo, type ReactNode } from 'react';
import { Briefcase, Building2, Mail, MapPin, Pencil, Phone, Trash2, type LucideIcon } from 'lucide-react';
import type { User } from '../../types/user';
import { formatAge } from '../../utils/format';
import { getFullName } from '../../utils/userFilters';
import { RoleBadge } from './RoleBadge';
import { UserAvatar } from './UserAvatar';

interface InfoRowProps {
  icon: LucideIcon;
  children: ReactNode;
}

function InfoRow({ icon: Icon, children }: InfoRowProps) {
  return (
    <li className="flex items-center gap-2 min-w-0">
      <Icon size={15} className="shrink-0 opacity-50" />
      <span className="truncate">{children}</span>
    </li>
  );
}

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

/**
 * Карточка пользователя — «глупый» (презентационный) компонент:
 * своих данных не хранит, всё получает через props, а о действиях
 * сообщает родителю колбэками onEdit / onDelete.
 * memo: карточка не перерисовывается, если её props не изменились.
 */
function UserCardComponent({ user, onEdit, onDelete }: UserCardProps) {
  const { company, address } = user;
  const location = [address.city, address.country].filter(Boolean).join(', ');

  return (
    <article className="card border border-base-300 bg-base-100 shadow-sm transition-shadow hover:shadow-md">
      <div className="card-body gap-4 p-5">
        <header className="flex items-start gap-3">
          {/* key сбрасывает состояние аватара (failed), если сменилась картинка */}
          <UserAvatar key={user.image} user={user} />
          <div className="min-w-0 flex-1">
            <h2 className="card-title text-base leading-snug">{getFullName(user)}</h2>
            <p className="text-sm opacity-60">
              @{user.username} · {formatAge(user.age)}
            </p>
          </div>
          <RoleBadge role={user.role} />
        </header>

        <ul className="space-y-1.5 text-sm">
          {company.title && <InfoRow icon={Briefcase}>{company.title}</InfoRow>}
          {company.name && <InfoRow icon={Building2}>{company.name}</InfoRow>}
          <InfoRow icon={Mail}>
            <a className="link link-hover" href={`mailto:${user.email}`}>
              {user.email}
            </a>
          </InfoRow>
          {user.phone && <InfoRow icon={Phone}>{user.phone}</InfoRow>}
          {location && <InfoRow icon={MapPin}>{location}</InfoRow>}
        </ul>

        <footer className="card-actions mt-auto justify-end">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(user)}>
            <Pencil size={15} /> Изменить
          </button>
          <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => onDelete(user)}>
            <Trash2 size={15} /> Удалить
          </button>
        </footer>
      </div>
    </article>
  );
}

export const UserCard = memo(UserCardComponent);
