import { memo, type ReactNode } from 'react';
import Link from 'next/link';
import { Briefcase, Building2, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import type { User } from '@/types/user';
import { formatAge } from '@/utils/format';
import type { LocalStatus } from '@/utils/localChanges';
import { getFullName } from '@/utils/userFilters';
import { LocalStatusBadge, RoleBadge } from './RoleBadge';
import { UserActions } from './UserActions';
import { UserAvatar } from './UserAvatar';

function InfoRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-center gap-2">
      <Icon size={15} className="shrink-0 opacity-50" aria-hidden />
      <span className="truncate">{children}</span>
    </li>
  );
}

interface UserCardProps {
  user: User;
  status: LocalStatus;
}

/**
 * Карточка — презентационный компонент без своего состояния: всё приходит через props.
 * Имя — ссылка на /users/[id], растянутая на всю карточку (after:inset-0);
 * кнопки и email лежат выше этого слоя (relative z-[1]) и остаются кликабельными.
 * memo: карточка не перерисовывается, если её props не изменились.
 */
function UserCardComponent({ user, status }: UserCardProps) {
  const { company, address } = user;
  const location = [address.city, address.country].filter(Boolean).join(', ');

  return (
    <article className="card relative border border-base-300 bg-base-100 shadow-sm transition-shadow hover:shadow-md">
      <div className="card-body gap-4 p-5">
        <header className="flex items-start gap-3">
          {/* key сбрасывает состояние аватара (failed), если сменилась картинка */}
          <UserAvatar key={user.image} user={user} />
          <div className="min-w-0 flex-1">
            <h2 className="card-title text-base leading-snug">
              <Link
                href={`/users/${user.id}`}
                className="link-hover after:absolute after:inset-0 after:rounded-box after:content-['']"
              >
                {getFullName(user)}
              </Link>
            </h2>
            <p className="text-sm opacity-60">
              @{user.username} · {formatAge(user.age)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <RoleBadge role={user.role} />
            <LocalStatusBadge status={status} />
          </div>
        </header>

        <ul className="space-y-1.5 text-sm">
          {company.title && <InfoRow icon={Briefcase}>{company.title}</InfoRow>}
          {company.name && <InfoRow icon={Building2}>{company.name}</InfoRow>}
          <InfoRow icon={Mail}>
            <a className="link link-hover relative z-[1]" href={`mailto:${user.email}`}>
              {user.email}
            </a>
          </InfoRow>
          {user.phone && <InfoRow icon={Phone}>{user.phone}</InfoRow>}
          {location && <InfoRow icon={MapPin}>{location}</InfoRow>}
        </ul>

        <footer className="card-actions relative z-[1] mt-auto justify-end">
          <UserActions user={user} />
        </footer>
      </div>
    </article>
  );
}

export const UserCard = memo(UserCardComponent);
