import Link from 'next/link';
import { Users } from 'lucide-react';
import { Suspense } from 'react';
import { LocalChangesButton, SyncIndicator } from './HeaderActions';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu, UserMenuSkeleton } from './UserMenu';

/**
 * Server Component: разметка шапки рендерится на сервере и попадает в статическую
 * оболочку. Интерактивные части — небольшие Client Components («острова»).
 * Меню пользователя зависит от сессии, поэтому оно в своём <Suspense>:
 * до ответа сервера на его месте скелетон, остальная шапка видна сразу.
 */
export function Header() {
  return (
    <header className="navbar sticky top-0 z-30 border-b border-base-300 bg-base-100/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-1 px-2 sm:gap-2 sm:px-4">
        <div className="flex-1">
          <Link href="/users" className="flex w-fit items-center gap-3 rounded-field">
            <span className="grid size-10 place-items-center rounded-field bg-primary text-primary-content">
              <Users size={22} aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-bold">Пользователи</span>
              <span className="hidden text-xs opacity-60 sm:block">Next.js · DummyJSON</span>
            </span>
          </Link>
        </div>

        <SyncIndicator />
        <LocalChangesButton />
        <ThemeToggle />
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
