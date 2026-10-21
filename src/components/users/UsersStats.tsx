import { cacheLife, cacheTag } from 'next/cache';
import { getUsersStats, USERS_TAG } from '@/server/users';
import { pluralize } from '@/utils/format';

/**
 * Server Component с 'use cache' на уровне UI: кэшируется готовая разметка.
 * Компонент не зависит от запроса (cookies, searchParams), поэтому рендерится
 * при сборке и попадает в статическую оболочку страницы (Partial Prerendering).
 */
export async function UsersStats() {
  'use cache';
  cacheLife('hours');
  cacheTag(USERS_TAG);

  const { total, byRole } = await getUsersStats();

  return (
    <p className="text-sm opacity-70">
      В базе DummyJSON {pluralize(total, ['пользователь', 'пользователя', 'пользователей'])}: из них{' '}
      {pluralize(byRole.admin, ['администратор', 'администратора', 'администраторов'])} и{' '}
      {pluralize(byRole.moderator, ['модератор', 'модератора', 'модераторов'])}
    </p>
  );
}
