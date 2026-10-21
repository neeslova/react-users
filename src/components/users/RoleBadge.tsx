import { ROLE_BADGE_CLASSES, ROLE_LABELS } from '@/constants/user';
import type { UserRole } from '@/types/user';
import type { LocalStatus } from '@/utils/localChanges';

export function RoleBadge({ role }: { role: UserRole }) {
  return <span className={`badge badge-soft badge-sm shrink-0 ${ROLE_BADGE_CLASSES[role]}`}>{ROLE_LABELS[role]}</span>;
}

const LOCAL_BADGES: Partial<Record<LocalStatus, { label: string; className: string; title: string }>> = {
  created: {
    label: 'Новый',
    className: 'badge-success',
    title: 'Создан в этой сессии. DummyJSON новые записи не сохраняет',
  },
  updated: {
    label: 'Изменён',
    className: 'badge-accent',
    title: 'Изменения хранятся локально. DummyJSON их не сохраняет',
  },
};

/** Пометка записи, которая отличается от данных сервера */
export function LocalStatusBadge({ status }: { status: LocalStatus }) {
  const badge = LOCAL_BADGES[status];
  if (!badge) return null;
  return (
    <span className={`badge badge-outline badge-sm shrink-0 ${badge.className}`} title={badge.title}>
      {badge.label}
    </span>
  );
}
