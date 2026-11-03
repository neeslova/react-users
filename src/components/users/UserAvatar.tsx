'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { User } from '@/types/user';
import { getInitials } from '@/utils/format';

const PLACEHOLDER_COLORS = [
  'bg-primary text-primary-content',
  'bg-secondary text-secondary-content',
  'bg-accent text-accent-content',
  'bg-info text-info-content',
  'bg-success text-success-content',
];

const SIZES = {
  sm: { px: 32, box: 'w-8', text: 'text-xs' },
  md: { px: 48, box: 'w-12', text: '' },
  lg: { px: 96, box: 'w-24', text: 'text-3xl' },
} as const;

interface UserAvatarProps {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'image'>;
  size?: keyof typeof SIZES;
}

/**
 * Client Component из-за состояния: если картинка не загрузилась (onError),
 * показываются инициалы. next/image отдаёт картинку через оптимизатор Next.js
 * (нужный размер и формат), домен разрешён в next.config.ts.
 */
export function UserAvatar({ user, size = 'md' }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const { px, box, text } = SIZES[size];

  if (!user.image || failed) {
    const color = PLACEHOLDER_COLORS[Math.abs(user.id) % PLACEHOLDER_COLORS.length];
    return (
      <div className="avatar avatar-placeholder">
        <div className={`${box} rounded-full ${color}`}>
          <span className={`font-semibold ${text}`}>{getInitials(user.firstName, user.lastName)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="avatar">
      <div className={`${box} rounded-full bg-base-200`}>
        <Image src={user.image} alt="" width={px} height={px} onError={() => setFailed(true)} />
      </div>
    </div>
  );
}
