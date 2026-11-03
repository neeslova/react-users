import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { parseUserId } from '@/schemas/user';
import { errorResponse, readJson, UPSTREAM_ERROR } from '@/server/http';
import { requirePermission } from '@/server/session';
import { deleteUser, getUser, updateUser, USERS_TAG, userTag } from '@/server/users';
import type { Permission } from '@/types/auth';

/*
 * REST API одной записи: GET (открыт всем), PUT (все поля), PATCH (часть полей), DELETE.
 * Неподдерживаемые методы Next.js сам отклоняет ответом 405.
 * Мутации сначала проверяют права (401/403), потом id и тело запроса (400/422).
 */

type Context = RouteContext<'/api/users/[id]'>;

const invalidId = () => Response.json({ message: 'Некорректный идентификатор пользователя' }, { status: 400 });

export async function GET(_request: NextRequest, ctx: Context) {
  const id = parseUserId((await ctx.params).id);
  if (id === null) return invalidId();
  try {
    const user = await getUser(id);
    return user
      ? Response.json(user)
      : Response.json({ message: 'Пользователь не найден' }, { status: 404 });
  } catch (error) {
    return errorResponse(error, UPSTREAM_ERROR);
  }
}

/** Права → id: гость не узнаёт, корректен ли адрес */
async function authorizedId(ctx: Context, permission: Permission): Promise<number | Response> {
  try {
    await requirePermission(permission);
  } catch (error) {
    return errorResponse(error);
  }
  return parseUserId((await ctx.params).id) ?? invalidId();
}

async function update(request: NextRequest, ctx: Context, partial: boolean) {
  const id = await authorizedId(ctx, 'users:update');
  if (id instanceof Response) return id;
  try {
    const user = await updateUser(id, await readJson(request), { partial });
    revalidateTag(USERS_TAG, 'max');
    revalidateTag(userTag(id), 'max');
    return Response.json(user);
  } catch (error) {
    return errorResponse(error);
  }
}

export const PUT = (request: NextRequest, ctx: Context) => update(request, ctx, false);
export const PATCH = (request: NextRequest, ctx: Context) => update(request, ctx, true);

export async function DELETE(_request: NextRequest, ctx: Context) {
  const id = await authorizedId(ctx, 'users:delete');
  if (id instanceof Response) return id;
  try {
    const result = await deleteUser(id);
    revalidateTag(USERS_TAG, 'max');
    revalidateTag(userTag(id), 'max');
    return Response.json({ ...result, isDeleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
