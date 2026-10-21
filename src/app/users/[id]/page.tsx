import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SectionErrorBoundary } from '@/components/ui/SectionErrorBoundary';
import { UserDetails } from '@/components/users/UserDetails';
import { UserPosts } from '@/components/users/UserPosts';
import { SectionSkeleton } from '@/components/users/UsersSkeletons';
import { UserTodos } from '@/components/users/UserTodos';
import { DEFAULT_FILTERS, USERS_PAGE_SIZE } from '@/constants/user';
import { parseUserId } from '@/schemas/user';
import { getUser, getUsersPage } from '@/server/users';
import { getFullName, toUsersQuery } from '@/utils/userFilters';

/**
 * Профили первой страницы списка генерируются при сборке (SSG).
 * Остальные — при первом запросе, после чего результат кэшируется (ISR).
 */
export async function generateStaticParams() {
  try {
    const { users } = await getUsersPage(toUsersQuery(DEFAULT_FILTERS, 0, USERS_PAGE_SIZE));
    if (users.length > 0) return users.map((user) => ({ id: String(user.id) }));
  } catch (error) {
    // В dev функция вызывается при каждом переходе: недоступный API не должен ронять маршрут
    console.warn('generateStaticParams: DummyJSON недоступен, профили будут созданы по запросу', error);
  }
  // С Cache Components нужен хотя бы один параметр; пользователь 1 в DummyJSON есть всегда
  return [{ id: '1' }];
}

export async function generateMetadata({ params }: PageProps<'/users/[id]'>): Promise<Metadata> {
  const id = parseUserId((await params).id);
  // getUser кэширован ('use cache'), поэтому страница не сделает второй запрос
  const user = id === null ? null : await getUser(id);
  return { title: user ? getFullName(user) : 'Пользователь не найден' };
}

/** Страница записи с динамическим маршрутом /users/[id] — Server Component */
export default async function UserPage({ params }: PageProps<'/users/[id]'>) {
  const id = parseUserId((await params).id);
  if (id === null) notFound();

  const user = await getUser(id);
  if (!user) notFound();

  return (
    <UserDetails serverUser={user}>
      {/* Посты и задачи грузятся независимо: каждая секция в своём Suspense и error boundary */}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <SectionErrorBoundary title="Не удалось загрузить посты" variant="compact">
          <Suspense fallback={<SectionSkeleton title="Посты" rows={3} />}>
            <UserPosts userId={id} />
          </Suspense>
        </SectionErrorBoundary>
        <SectionErrorBoundary title="Не удалось загрузить задачи" variant="compact">
          <Suspense fallback={<SectionSkeleton title="Задачи" rows={4} />}>
            <UserTodos userId={id} />
          </Suspense>
        </SectionErrorBoundary>
      </div>
    </UserDetails>
  );
}
