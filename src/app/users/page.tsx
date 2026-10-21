import { Suspense } from 'react';
import { SectionErrorBoundary } from '@/components/ui/SectionErrorBoundary';
import { UsersInfiniteList } from '@/components/users/UsersInfiniteList';
import { UsersGridSkeleton, UsersToolbarSkeleton } from '@/components/users/UsersSkeletons';
import { UsersStats } from '@/components/users/UsersStats';
import { UsersToolbar } from '@/components/users/UsersToolbar';
import { USERS_PAGE_SIZE } from '@/constants/user';
import { parseUserFilters } from '@/schemas/user';
import { getUsersPage } from '@/server/users';
import { toUsersQuery } from '@/utils/userFilters';

/**
 * Страница списка — Server Component. Сама страница синхронная и не ждёт данных:
 * заголовок, кэшированная статистика и fallback-скелетоны попадают в статическую
 * оболочку (Partial Prerendering), а зависящая от ?q=&role=… выдача стримится
 * в <Suspense> во время запроса.
 */
export default function UsersPage({ searchParams }: PageProps<'/users'>) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <SectionErrorBoundary title="Не удалось загрузить статистику" variant="inline">
          <Suspense fallback={<div className="skeleton h-5 w-full max-w-md" />}>
            <UsersStats />
          </Suspense>
        </SectionErrorBoundary>
      </div>

      {/* useSearchParams внутри: на этапе пререндера URL неизвестен, поэтому нужен Suspense */}
      <Suspense fallback={<UsersToolbarSkeleton />}>
        <UsersToolbar />
      </Suspense>

      <SectionErrorBoundary title="Не удалось загрузить пользователей">
        <Suspense fallback={<UsersGridSkeleton />}>
          <UsersSection searchParams={searchParams} />
        </Suspense>
      </SectionErrorBoundary>
    </div>
  );
}

/**
 * Async Server Component: первая страница загружается на сервере
 * (тот же сервис, что и у Route Handler) и передаётся клиентскому списку пропсом.
 * Следующие страницы список запрашивает сам через GET /api/users.
 */
async function UsersSection({ searchParams }: Pick<PageProps<'/users'>, 'searchParams'>) {
  const filters = parseUserFilters(await searchParams);
  const firstPage = await getUsersPage(toUsersQuery(filters, 0, USERS_PAGE_SIZE));

  return <UsersInfiniteList initialFilters={filters} initialPage={firstPage} />;
}
