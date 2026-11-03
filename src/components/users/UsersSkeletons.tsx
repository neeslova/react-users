import { USERS_PAGE_SIZE } from '@/constants/user';

/*
 * Плейсхолдеры повторяют форму настоящего контента, поэтому при загрузке
 * страница не «прыгает». Компоненты без состояния: их можно рендерить
 * и в Server Components (loading.tsx, fallback у <Suspense>), и на клиенте.
 */

export function UserCardSkeleton() {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-sm" aria-hidden>
      <div className="card-body gap-4 p-5">
        <div className="flex items-start gap-3">
          <div className="skeleton size-12 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
          <div className="skeleton h-5 w-20" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="skeleton h-3 w-2/3" />
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton h-3 w-3/4" />
          <div className="skeleton h-3 w-2/5" />
        </div>
        <div className="flex justify-end gap-2">
          <div className="skeleton h-8 w-24" />
          <div className="skeleton h-8 w-24" />
        </div>
      </div>
    </div>
  );
}

export function UsersGridSkeleton({ count = USERS_PAGE_SIZE }: { count?: number }) {
  return (
    <div role="status" aria-label="Загрузка пользователей" className="flex flex-col gap-4">
      <div className="skeleton h-5 w-56" aria-hidden />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <UserCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function UsersToolbarSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="skeleton h-10 w-full sm:flex-1" />
        <div className="skeleton h-10 w-full sm:w-64" />
      </div>
      <div className="skeleton h-10 w-full max-w-md" />
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div role="status" aria-label="Загрузка профиля" className="flex flex-col gap-5">
      <div className="card border border-base-300 bg-base-100" aria-hidden>
        <div className="card-body flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="skeleton size-24 shrink-0 rounded-full" />
          <div className="flex w-full flex-col items-center gap-3 sm:items-start">
            <div className="skeleton h-7 w-64" />
            <div className="skeleton h-4 w-40" />
            <div className="flex gap-2">
              <div className="skeleton h-5 w-24" />
              <div className="skeleton h-5 w-16" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-10 w-28" />
            <div className="skeleton h-10 w-28" />
          </div>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2" aria-hidden>
        {Array.from({ length: 4 }, (_, index) => (
          <SectionSkeleton key={index} rows={4} />
        ))}
      </div>
    </div>
  );
}

export function SectionSkeleton({ rows = 3, title }: { rows?: number; title?: string }) {
  return (
    <section className="card border border-base-300 bg-base-100" aria-busy>
      <div className="card-body gap-4">
        {title ? <h2 className="card-title text-base">{title}</h2> : <div className="skeleton h-5 w-32" />}
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-3 w-3/5" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function UserFormSkeleton() {
  return (
    <div role="status" aria-label="Загрузка формы" className="card border border-base-300 bg-base-100">
      <div className="card-body gap-4" aria-hidden>
        <div className="flex flex-col gap-2">
          <div className="skeleton h-7 w-64" />
          <div className="skeleton h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-base-300 pt-4">
          <div className="skeleton h-10 w-24" />
          <div className="skeleton h-10 w-28" />
        </div>
      </div>
    </div>
  );
}
