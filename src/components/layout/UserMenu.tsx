'use client';

import { LogIn, LogOut, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { logoutAction } from '@/app/login/actions';
import { loginHref } from '@/schemas/auth';
import { can } from '@/utils/permissions';
import { useViewer } from '../auth/ViewerProvider';
import { RoleBadge } from '../users/RoleBadge';
import { UserAvatar } from '../users/UserAvatar';

/**
 * Правая часть шапки, зависящая от сессии: «Войти» для гостя;
 * «Добавить» (если есть право) и меню с выходом — для вошедшего.
 * Рендерится внутри <Suspense>: ждёт промис текущего пользователя.
 */
export function UserMenu() {
  const viewer = useViewer();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!viewer) {
    if (pathname === '/login') return null;
    const query = searchParams.toString();
    return (
      <Link href={loginHref(query ? `${pathname}?${query}` : pathname)} className="btn btn-primary">
        <LogIn size={18} aria-hidden />
        Войти
      </Link>
    );
  }

  const [firstName = '', lastName = ''] = viewer.name.split(' ');

  return (
    <>
      {can(viewer.role, 'users:create') && (
        <Link href="/users/new" className="btn btn-primary">
          <UserPlus size={18} aria-hidden />
          <span className="hidden sm:inline">Добавить</span>
        </Link>
      )}

      {/* Выпадающее меню DaisyUI на :focus-within: открывается по клику, закрывается при потере фокуса */}
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost gap-2 px-2" aria-label={`Меню пользователя ${viewer.name}`}>
          <UserAvatar user={{ id: viewer.id, firstName, lastName, image: viewer.image }} size="sm" />
          <span className="hidden max-w-32 truncate lg:inline">{viewer.name}</span>
        </div>
        <div
          tabIndex={0}
          className="dropdown-content z-40 mt-2 w-72 rounded-box border border-base-300 bg-base-100 p-4 shadow-lg"
        >
          <p className="font-semibold break-words">{viewer.name}</p>
          <p className="text-sm opacity-60">@{viewer.username}</p>
          <p className="truncate text-sm opacity-60" title={viewer.email}>
            {viewer.email}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            Роль: <RoleBadge role={viewer.role} />
          </div>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="btn btn-outline btn-sm w-full">
              <LogOut size={16} aria-hidden /> Выйти
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export function UserMenuSkeleton() {
  return <div className="skeleton h-10 w-28" aria-hidden />;
}
