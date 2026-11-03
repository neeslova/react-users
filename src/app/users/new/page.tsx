import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BackToListLink } from '@/components/users/BackToListLink';
import { CreateUserScreen } from '@/components/users/UserFormScreens';
import { UserFormSkeleton } from '@/components/users/UsersSkeletons';
import { requirePageAccess } from '@/server/session';

export const metadata: Metadata = { title: 'Новый пользователь' };

/**
 * Страница добавления — только для вошедших. Доступ проверяется на сервере
 * при каждом запросе (proxy.ts лишь заранее перенаправляет гостя на вход).
 * Проверка читает cookie, поэтому она внутри <Suspense>: заголовок и скелетон
 * формы остаются в статической оболочке.
 */
export default function NewUserPage() {
  return (
    <div className="flex flex-col gap-4">
      <BackToListLink className="btn btn-ghost btn-sm -ml-2 w-fit" />
      <Suspense fallback={<UserFormSkeleton />}>
        <NewUserGate />
      </Suspense>
    </div>
  );
}

async function NewUserGate() {
  await requirePageAccess('users:create', '/users/new');
  return <CreateUserScreen />;
}
