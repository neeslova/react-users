import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { z } from 'zod';
import {
  toFieldErrors,
  userIdSchema,
  userInputSchema,
  userPatchSchema,
  type UserPatch,
} from '@/schemas/user';
import type {
  SortField,
  SortOrder,
  User,
  UserPost,
  UserRole,
  UsersPage,
  UsersQuery,
  UsersStats,
  UserTodo,
} from '@/types/user';
import { avatarUrl, dummyFetch } from './dummyjson';
import {
  dummyDeletedSchema,
  dummyPostsSchema,
  dummyRolesSchema,
  dummyTodosSchema,
  dummyUsernamesSchema,
  dummyUserSchema,
  dummyUsersListSchema,
  type DummyUser,
} from './dummyjsonSchemas';
import { ServiceError } from './errors';
import { requirePermission } from './session';

/*
 * Сервисный слой предметной области — единственное место с бизнес-логикой.
 * Его вызывают:
 *  - Server Components (чтение данных для страниц);
 *  - Route Handlers  (src/app/api/users/**) — HTTP API;
 *  - Server Functions (src/app/users/actions.ts) — мутации из интерфейса.
 * Проверка прав, валидация, уникальность логина и приведение ответа DummyJSON
 * к типу User описаны здесь один раз, поэтому их нельзя обойти, выбрав другой вход.
 */

// ---------- Теги кэша ----------

/** Все списки пользователей и сводная статистика */
export const USERS_TAG = 'users';
/** Одна запись */
export const userTag = (id: number) => `user:${id}`;

// ---------- Формат DummyJSON ----------

const USER_FIELDS = [
  'firstName', 'lastName', 'maidenName', 'age', 'gender', 'email', 'phone', 'username',
  'birthDate', 'image', 'bloodGroup', 'height', 'weight', 'eyeColor', 'hair', 'university',
  'address', 'company', 'role',
].join(',');

const SORT_TO_API: Record<SortField, string> = { id: 'id', name: 'firstName', age: 'age' };

/** Ответ DummyJSON (уже проверенный схемой) → User: у записи без картинки — аватар по логину */
const normalizeUser = (raw: DummyUser): User => ({ ...raw, image: raw.image || avatarUrl(raw.username) });

// ---------- Чтение (кэшируется директивой 'use cache') ----------

/**
 * Страница списка с поиском, фильтром по роли и сортировкой.
 * Аргумент входит в ключ кэша: каждая комбинация фильтров и skip/limit кэшируется отдельно.
 * Чтение открыто всем (и гостям), поэтому права здесь не проверяются, а в кэш
 * не попадает ничего, что зависит от текущего пользователя.
 */
export async function getUsersPage(query: UsersQuery): Promise<UsersPage> {
  'use cache';
  cacheLife('minutes');
  cacheTag(USERS_TAG);

  const { q, role, sort, order, skip, limit } = query;

  // DummyJSON не умеет одновременно искать (/users/search) и фильтровать (/users/filter).
  // Для такой комбинации берём все результаты поиска (они кэшируются отдельно),
  // фильтруем по роли и режем на страницы здесь — клиент этой разницы не видит.
  if (q && role !== 'all') {
    const found = (await searchAllUsers(q, sort, order)).filter((user) => user.role === role);
    return { users: found.slice(skip, skip + limit), total: found.length, skip, limit };
  }

  const [endpoint, params] = q
    ? ['/users/search', { q }]
    : role !== 'all'
      ? ['/users/filter', { key: 'role', value: role }]
      : ['/users', {}];

  const data = await dummyFetch(endpoint, dummyUsersListSchema, {
    query: { ...params, sortBy: SORT_TO_API[sort], order, limit, skip, select: USER_FIELDS },
  });
  return { users: data.users.map(normalizeUser), total: data.total, skip, limit };
}

async function searchAllUsers(q: string, sort: SortField, order: SortOrder): Promise<User[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag(USERS_TAG);

  // limit=0 — все совпадения одним запросом
  const data = await dummyFetch('/users/search', dummyUsersListSchema, {
    query: { q, sortBy: SORT_TO_API[sort], order, limit: 0, select: USER_FIELDS },
  });
  return data.users.map(normalizeUser);
}

/** null — пользователя нет (404 тоже кэшируется: такой id не появится) */
export async function getUser(id: number): Promise<User | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(userTag(id));

  try {
    return normalizeUser(await dummyFetch(`/users/${id}`, dummyUserSchema, { query: { select: USER_FIELDS } }));
  } catch (error) {
    if (error instanceof ServiceError && error.status === 404) return null;
    throw error;
  }
}

export async function getUserPosts(userId: number): Promise<UserPost[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(userTag(userId));

  const { posts } = await dummyFetch(`/users/${userId}/posts`, dummyPostsSchema, {
    query: { limit: 0, select: 'title,body,tags,reactions,views' },
  });
  return posts.map(({ reactions, ...post }) => ({ ...post, likes: reactions.likes, dislikes: reactions.dislikes }));
}

export async function getUserTodos(userId: number): Promise<UserTodo[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(userTag(userId));

  const { todos } = await dummyFetch(`/users/${userId}/todos`, dummyTodosSchema, { query: { limit: 0 } });
  return todos;
}

/**
 * Сводка по ролям. Сама функция не кэшируется: кэшируется компонент UsersStats,
 * который её вызывает (кэширование на уровне UI, а не данных).
 */
export async function getUsersStats(): Promise<UsersStats> {
  const { users } = await dummyFetch('/users', dummyRolesSchema, { query: { limit: 0, select: 'role' } });
  const byRole: Record<UserRole, number> = { admin: 0, moderator: 0, user: 0 };
  for (const { role } of users) byRole[role] += 1;
  return { total: users.length, byRole };
}

// ---------- Мутации (не кэшируются) ----------

/** Проверка входных данных на сервере: ошибки по полям → 422 */
function parse<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ServiceError('Проверьте правильность заполнения полей', 422, toFieldErrors(result.error));
  }
  return result.data;
}

function parseId(id: unknown): number {
  const result = userIdSchema.safeParse(id);
  if (!result.success) throw new ServiceError('Некорректный идентификатор пользователя', 400);
  return result.data;
}

/** Бизнес-правило: логин уникален. Проверка — по данным сервера */
async function ensureUsernameAvailable(username: string, exceptId?: number) {
  const { users } = await dummyFetch('/users/filter', dummyUsernamesSchema, {
    query: { key: 'username', value: username, select: 'username', limit: 1 },
  });
  if (users.some((user) => user.id !== exceptId)) {
    throw new ServiceError('Такой логин уже занят', 409, { username: 'Такой логин уже занят' });
  }
}

/** Плоские данные формы → тело запроса DummyJSON (вложенные объекты PUT/PATCH сливает с текущими) */
function toDummyPayload(input: UserPatch) {
  const { companyName, companyTitle, department, city, country, ...plain } = input;
  const company = { name: companyName, title: companyTitle, department };
  const address = { city, country };
  const defined = (obj: Record<string, unknown>) =>
    Object.values(obj).some((value) => value !== undefined) ? obj : undefined;

  return { ...plain, company: defined(company), address: defined(address) };
}

/*
 * Порядок в каждой мутации: права (401/403) → данные (400/422) → бизнес-правила (409) → запрос.
 * Гость не узнаёт даже о том, правильно ли он заполнил поля.
 */

export async function createUser(input: unknown): Promise<User> {
  await requirePermission('users:create');
  const data = parse(userInputSchema, input);
  await ensureUsernameAvailable(data.username);
  const created = await dummyFetch('/users/add', dummyUserSchema, {
    method: 'POST',
    body: { ...toDummyPayload(data), image: avatarUrl(data.username) },
  });
  return normalizeUser(created);
}

/** partial: false — PUT (все поля формы), true — PATCH (только переданные) */
export async function updateUser(id: unknown, input: unknown, { partial = false } = {}): Promise<User> {
  await requirePermission('users:update');
  const userId = parseId(id);
  const data = partial ? parse(userPatchSchema, input) : parse(userInputSchema, input);
  if (data.username) await ensureUsernameAvailable(data.username, userId);
  const updated = await dummyFetch(`/users/${userId}`, dummyUserSchema, {
    method: partial ? 'PATCH' : 'PUT',
    body: toDummyPayload(data),
  });
  return normalizeUser(updated);
}

export async function deleteUser(id: unknown): Promise<{ id: number; deletedOn: string }> {
  await requirePermission('users:delete');
  const userId = parseId(id);
  return dummyFetch(`/users/${userId}`, dummyDeletedSchema, { method: 'DELETE' });
}
