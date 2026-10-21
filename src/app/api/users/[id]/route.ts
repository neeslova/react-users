import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { parseUserId } from '@/schemas/user';
import { errorResponse, readJson, UPSTREAM_ERROR } from '@/server/http';
import { deleteUser, getUser, updateUser, USERS_TAG, userTag } from '@/server/users';

/*
 * REST API одной записи: GET, PUT (все поля), PATCH (часть полей), DELETE.
 * Неподдерживаемые методы Next.js сам отклоняет ответом 405.
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

async function update(request: NextRequest, ctx: Context, partial: boolean) {
  const id = parseUserId((await ctx.params).id);
  if (id === null) return invalidId();
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
  const id = parseUserId((await ctx.params).id);
  if (id === null) return invalidId();
  try {
    const result = await deleteUser(id);
    revalidateTag(USERS_TAG, 'max');
    revalidateTag(userTag(id), 'max');
    return Response.json({ ...result, isDeleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
