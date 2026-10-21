import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { fetchUsersPage, getNextPageParam, usersKeys } from '@/api/users';
import { USERS_PAGE_SIZE } from '@/constants/user';
import type { UserFilters, UsersPage } from '@/types/user';
import { toUsersQuery } from '@/utils/userFilters';

/**
 * Infinite query списка пользователей.
 *  - pageParam — это skip: следующая страница запрашивается с GET /api/users?skip=…;
 *  - initialPage — первая страница, загруженная Server Component'ом: используется,
 *    только пока в кэше нет данных для этих фильтров (без лишнего запроса при гидратации);
 *  - keepPreviousData: при смене фильтров старая выдача остаётся на экране (stale)
 *    до прихода новой, а не сменяется скелетоном.
 */
export function useUsers(filters: UserFilters, initialPage?: UsersPage) {
  return useInfiniteQuery({
    queryKey: usersKeys.list(filters),
    queryFn: ({ pageParam, signal }) => fetchUsersPage(toUsersQuery(filters, pageParam, USERS_PAGE_SIZE), signal),
    initialPageParam: 0,
    getNextPageParam,
    initialData: initialPage && { pages: [initialPage], pageParams: [0] },
    placeholderData: keepPreviousData,
  });
}
