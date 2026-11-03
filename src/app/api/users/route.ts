import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { toFieldErrors, usersApiQuerySchema } from '@/schemas/user';
import { errorResponse, readJson, UPSTREAM_ERROR } from '@/server/http';
import { requirePermission } from '@/server/session';
import { createUser, getUsersPage, USERS_TAG } from '@/server/users';
import { toUsersQuery } from '@/utils/userFilters';

/*
 * Route Handler — HTTP-эндпоинт на Web Request/Response API.
 * GET используется интерфейсом: следующие страницы infinite query клиент
 * запрашивает отсюда, он открыт и гостям. POST — часть REST API для внешних
 * клиентов (curl, Postman); бизнес-логика — общая с Server Functions.
 *
 * Мутации: сначала права (401 — нет сессии, 403 — не та роль), потом разбор тела.
 * Сервис проверяет права ещё раз — его вызывают и Server Functions.
 */

/** GET /api/users?q=&role=&sort=&order=&skip=&limit= */
export async function GET(request: NextRequest) {
  const parsed = usersApiQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return Response.json(
      { message: 'Некорректные параметры запроса', fieldErrors: toFieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const { skip, limit, ...filters } = parsed.data;
  try {
    return Response.json(await getUsersPage(toUsersQuery(filters, skip, limit)));
  } catch (error) {
    return errorResponse(error, UPSTREAM_ERROR);
  }
}

/** POST /api/users — создать пользователя (тело — JSON с полями формы) */
export async function POST(request: NextRequest) {
  try {
    await requirePermission('users:create');
    const user = await createUser(await readJson(request));
    // updateTag доступен только в Server Functions; здесь — revalidateTag (stale-while-revalidate)
    revalidateTag(USERS_TAG, 'max');
    return Response.json(user, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
