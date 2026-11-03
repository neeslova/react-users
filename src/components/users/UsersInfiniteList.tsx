'use client';

import { CircleCheckBig, RefreshCw, SearchX, UserPlus, UserRoundX } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo } from 'react';
import { DEFAULT_FILTERS } from '@/constants/user';
import { useInView } from '@/hooks/useInView';
import { useUserFilters } from '@/hooks/useUserFilters';
import { useUsers } from '@/hooks/useUsers';
import { useLocalChanges, useUiStore } from '@/stores/StoreProvider';
import type { UserFilters, UsersPage } from '@/types/user';
import { pluralize } from '@/utils/format';
import { applyLocalChanges, getLocalStatus } from '@/utils/localChanges';
import { filtersToSearchParams, hasActiveFilters, isSameFilters } from '@/utils/userFilters';
import { useCan } from '../auth/ViewerProvider';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState, getErrorMessage } from '../ui/ErrorState';
import { UserList } from './UserList';
import { UsersGridSkeleton } from './UsersSkeletons';

const USER_FORMS: [string, string, string] = ['пользователь', 'пользователя', 'пользователей'];
const LOADING_MORE_PLACEHOLDERS = 3;

interface UsersInfiniteListProps {
  /** Фильтры и первая страница, с которыми страницу отрендерил сервер */
  initialFilters: UserFilters;
  initialPage: UsersPage;
}

/**
 * Client Component: бесконечная лента (infinite query), фильтры из URL
 * и локальные изменения из store. Первая страница приходит с сервера
 * пропсом и сразу попадает в HTML — без спиннера при первом открытии.
 */
export function UsersInfiniteList({ initialFilters, initialPage }: UsersInfiniteListProps) {
  const { filters, setFilters } = useUserFilters();
  const {
    data,
    error,
    isPending,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    isRefetchError,
    isPlaceholderData,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useUsers(filters, isSameFilters(filters, initialFilters) ? initialPage : undefined);

  const changes = useLocalChanges();
  const serverUsers = useMemo(() => data?.pages.flatMap((page) => page.users) ?? [], [data]);
  const { users, hiddenCount, createdCount } = useMemo(
    () => applyLocalChanges(serverUsers, changes, filters),
    [serverUsers, changes, filters],
  );
  const statusOf = useCallback((id: number) => getLocalStatus(id, changes), [changes]);

  // Адрес списка с текущими фильтрами — для ссылки «Назад» на странице профиля
  const setListHref = useUiStore((state) => state.setListHref);
  const listQuery = filtersToSearchParams(filters).toString();
  useEffect(() => {
    setListHref(listQuery ? `/users?${listQuery}` : '/users');
  }, [listQuery, setListHref]);

  // Автоматическая дозагрузка, когда низ списка показался на экране (кнопка тоже работает)
  const [sentinelRef, sentinelVisible] = useInView<HTMLDivElement>('400px');
  const canLoadMore = hasNextPage && !isFetching && !isFetchNextPageError && !isPlaceholderData;
  useEffect(() => {
    if (sentinelVisible && canLoadMore) void fetchNextPage();
  }, [sentinelVisible, canLoadMore, fetchNextPage]);

  // 1. Первоначальная загрузка (данных ещё нет совсем)
  if (isPending) return <UsersGridSkeleton />;

  // 2. Ошибка, а показать нечего
  if (isError && !data) {
    return (
      <ErrorState
        title="Не удалось загрузить пользователей"
        description={getErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  const lastPage = data.pages[data.pages.length - 1];
  const total = Math.max(lastPage.total + createdCount - hiddenCount, users.length);
  const remaining = Math.max(lastPage.total - (lastPage.skip + lastPage.users.length), 0);
  // 3. Повторная загрузка при уже показанных данных: новые фильтры или «Обновить»
  const isStale = isFetching && !isFetchingNextPage;
  const filtered = hasActiveFilters(filters);

  return (
    <section className="flex flex-col gap-4" aria-busy={isStale || isFetchingNextPage}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <p className="opacity-70">
          {filtered ? 'Найдено' : 'Всего'} {pluralize(total, USER_FORMS)}
          {users.length < total && ` · показано ${users.length}`}
        </p>
        {isStale && (
          <span className="badge badge-ghost gap-1.5" role="status">
            <span className="loading loading-spinner loading-xs" /> Обновляем…
          </span>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm ml-auto"
          onClick={() => void refetch()}
          disabled={isFetching}
          title="Загрузить данные с сервера заново"
        >
          <RefreshCw size={15} className={isStale ? 'animate-spin' : ''} /> Обновить
        </button>
      </div>

      {isRefetchError && (
        <div role="alert" className="alert alert-warning alert-soft">
          <span>Не удалось обновить данные: {getErrorMessage(error)}. Показана прежняя выдача.</span>
        </div>
      )}

      {users.length === 0 && !hasNextPage ? (
        // 4. Успешный, но пустой результат — не ошибка
        filtered ? (
          <EmptyState
            icon={SearchX}
            title="Ничего не найдено"
            description="Попробуйте изменить запрос или выбрать другую роль."
            action={
              <button type="button" className="btn btn-outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Сбросить фильтры
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={UserRoundX}
            title="Список пуст"
            description="Все пользователи удалены. Добавьте нового или сбросьте локальные изменения в шапке."
            action={<AddFirstUserButton />}
          />
        )
      ) : (
        // 5. Данные получены (во время обновления — приглушены)
        <div className={`transition-opacity duration-200 ${isStale ? 'pointer-events-none opacity-50' : ''}`}>
          <UserList
            users={users}
            statusOf={statusOf}
            loadingCount={isFetchingNextPage ? Math.min(remaining, LOADING_MORE_PLACEHOLDERS) : 0}
          />
        </div>
      )}

      {isFetchNextPageError ? (
        <div role="alert" className="alert alert-error alert-soft">
          <span>Не удалось загрузить следующую страницу: {getErrorMessage(error)}</span>
          <button type="button" className="btn btn-sm" onClick={() => void fetchNextPage()}>
            Повторить
          </button>
        </div>
      ) : hasNextPage ? (
        <div ref={sentinelRef} className="flex justify-center">
          <button
            type="button"
            className="btn btn-wide btn-outline"
            onClick={() => void fetchNextPage()}
            disabled={!canLoadMore}
          >
            {isFetchingNextPage ? (
              <>
                <span className="loading loading-spinner loading-sm" /> Загрузка…
              </>
            ) : (
              `Загрузить ещё (${remaining})`
            )}
          </button>
        </div>
      ) : (
        users.length > 0 && (
          <p className="flex items-center justify-center gap-2 py-2 text-sm opacity-60">
            <CircleCheckBig size={16} aria-hidden /> Показаны все пользователи
          </p>
        )
      )}
    </section>
  );
}

function AddFirstUserButton() {
  const canCreate = useCan('users:create');
  if (!canCreate) return null;
  return (
    <Link href="/users/new" className="btn btn-primary">
      <UserPlus size={18} aria-hidden /> Добавить пользователя
    </Link>
  );
}
