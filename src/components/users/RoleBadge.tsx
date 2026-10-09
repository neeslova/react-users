import { ROLE_BADGE_CLASSES, ROLE_LABELS } from '../../constants/user';
import type { UserRole } from '../../types/user';

interface RoleBadgeProps {
  role: UserRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return <span className={`badge badge-soft badge-sm shrink-0 ${ROLE_BADGE_CLASSES[role]}`}>{ROLE_LABELS[role]}</span>;
}
