import { useState } from 'react';
import type { User } from '../../types/user';
import { getInitials } from '../../utils/format';

const PLACEHOLDER_COLORS = [
  'bg-primary text-primary-content',
  'bg-secondary text-secondary-content',
  'bg-accent text-accent-content',
  'bg-info text-info-content',
  'bg-success text-success-content',
];

interface UserAvatarProps {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'image'>;
}

/**
 * Аватар с запасным вариантом: если картинки нет или она не загрузилась
 * (onError), показываются инициалы. Это условный рендеринг по локальному состоянию.
 */
export function UserAvatar({ user }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(user.firstName, user.lastName);

  if (!user.image || failed) {
    const color = PLACEHOLDER_COLORS[user.id % PLACEHOLDER_COLORS.length];
    return (
      <div className="avatar avatar-placeholder">
        <div className={`w-12 rounded-full ${color}`}>
          <span className="font-semibold">{initials}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="avatar">
      <div className="w-12 rounded-full bg-base-200">
        <img src={user.image} alt={initials} loading="lazy" onError={() => setFailed(true)} />
      </div>
    </div>
  );
}
