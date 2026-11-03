import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { EditUserScreen } from '@/components/users/UserFormScreens';
import { UserFormSkeleton } from '@/components/users/UsersSkeletons';
import { parseUserId } from '@/schemas/user';
import { requirePageAccess } from '@/server/session';
import { getUser } from '@/server/users';

export const metadata: Metadata = { title: 'Изменение пользователя' };

/** Страница изменения /users/[id]/edit — только для вошедших (проверка на сервере) */
export default function EditUserPage({ params }: PageProps<'/users/[id]/edit'>) {
  return (
    <Suspense fallback={<UserFormSkeleton />}>
      <EditUserGate params={params} />
    </Suspense>
  );
}

async function EditUserGate({ params }: Pick<PageProps<'/users/[id]/edit'>, 'params'>) {
  const { id: rawId } = await params;
  // Сначала права, потом данные: гость не узнаёт даже, существует ли запись
  await requirePageAccess('users:update', `/users/${encodeURIComponent(rawId)}/edit`);

  const id = parseUserId(rawId);
  if (id === null) notFound();

  // null — на сервере записи нет; если она создана в этой сессии, её найдёт клиент в store
  const user = await getUser(id);
  return <EditUserScreen id={id} serverUser={user} />;
}
