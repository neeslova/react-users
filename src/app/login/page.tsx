import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { parseCallbackUrl } from '@/schemas/auth';
import { readSearchParam } from '@/schemas/user';
import { getViewer } from '@/server/session';
import { loginAction } from './actions';

export const metadata: Metadata = { title: 'Вход' };

/** Страница входа. Заголовок статический, форма зависит от ?callbackUrl= и сессии */
export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 py-4">
      <div>
        <h1 className="text-2xl font-bold">Вход</h1>
        <p className="text-sm opacity-70">
          Просматривать список может любой посетитель. Чтобы добавлять, изменять и удалять пользователей, войдите
          учётной записью DummyJSON.
        </p>
      </div>
      <section className="card border border-base-300 bg-base-100">
        <div className="card-body">
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginSection searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

async function LoginSection({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const params = await searchParams;
  // Адрес возврата — из URL, то есть недоверенный: схема пропускает только пути этого сайта
  const callbackUrl = parseCallbackUrl(readSearchParam(params, 'callbackUrl'));
  // Уже вошёл (proxy.ts обычно перенаправляет раньше) — на страницу, куда шёл
  if (await getViewer()) redirect(callbackUrl);

  return (
    <>
      {readSearchParam(params, 'callbackUrl') && (
        <div role="note" className="alert alert-info alert-soft mb-4">
          Эта страница доступна только после входа.
        </div>
      )}
      <LoginForm action={loginAction} callbackUrl={callbackUrl} />
    </>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-16 w-full" />
      <div className="skeleton h-10 w-full" />
      <div className="skeleton h-36 w-full" />
    </div>
  );
}
