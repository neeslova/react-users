import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { z } from 'zod';
import { ROLES } from '@/constants/user';
import {
  toFieldErrors,
  userIdSchema,
  userInputSchema,
  userPatchSchema,
  type UserInput,
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
import { dummyFetch } from './dummyjson';
import { ServiceError } from './errors';

/*
 * Сервисный слой предметной области — единственное место с бизнес-логикой.
 * Его вызывают:
 *  - Server Components (чтение данных для страниц);
 *  - Route Handlers  (src/app/api/users/**) — HTTP API;
 *  - Server Functions (src/app/users/actions.ts) — мутации из интерфейса.
 * Валидация, проверка уникальности логина и приведение ответа DummyJSON
 * к типу User описаны здесь один раз.
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

interface RawUser {
  id: number;
  firstName?: string;
  lastName?: string;
  maidenName?: string;
  age?: number | null;
  gender?: string;
  email?: string;
  phone?: string;
  username?: string;
  birthDate?: string;
  image?: string;
  role?: string;
  bloodGroup?: string;
  height?: number | null;
  weight?: number | null;
  eyeColor?: string;
  hair?: { color?: string; type?: string };
  university?: string;
  address?: { address?: string; city?: string; state?: string; postalCode?: string; country?: string };
  company?: { name?: string; title?: string; department?: string };
}

interface RawUsersResponse {
  users: RawUser[];
  total: number;
}

const isRole = (value: unknown): value is UserRole => ROLES.includes(value as UserRole);

export const avatarUrl = (username: string) =>
  `https://dummyjson.com/icon/${encodeURIComponent(username || 'user')}/128`;

/** Ответ DummyJSON → User: только нужные поля, без null/undefined в строках */
function normalizeUser(raw: RawUser): User {
  const username = raw.username ?? '';
  return {
    id: raw.id,
    firstName: raw.firstName ?? '',
    lastName: raw.lastName ?? '',
    maidenName: raw.maidenName ?? '',
    age: raw.age ?? 0,
    gender: raw.gender === 'male' ? 'male' : 'female',
    birthDate: raw.birthDate ?? '',
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    username,
    image: raw.image || avatarUrl(username),
    role: isRole(raw.role) ? raw.role : 'user',
    bloodGroup: raw.bloodGroup ?? '',
    height: raw.height ?? null,
    weight: raw.weight ?? null,
    eyeColor: raw.eyeColor ?? '',
    hair: { color: raw.hair?.color ?? '', type: raw.hair?.type ?? '' },
    university: raw.university ?? '',
    address: {
      address: raw.address?.address ?? '',
      city: raw.address?.city ?? '',
      state: raw.address?.state ?? '',
      postalCode: raw.address?.postalCode ?? '',
      country: raw.address?.country ?? '',
    },
    company: {
      name: raw.company?.name ?? '',
      title: raw.company?.title ?? '',
      department: raw.company?.department ?? '',
    },
  };
}

// ---------- Чтение (кэшируется директивой 'use cache') ----------

/**
 * Страница списка с поиском, фильтром по роли и сортировкой.
 * Аргумент входит в ключ кэша: каждая комбинация фильтров и skip/limit кэшируется отдельно.
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

  const data = await dummyFetch<RawUsersResponse>(endpoint, {
    query: { ...params, sortBy: SORT_TO_API[sort], order, limit, skip, select: USER_FIELDS },
  });
  return { users: data.users.map(normalizeUser), total: data.total, skip, limit };
}

async function searchAllUsers(q: string, sort: SortField, order: SortOrder): Promise<User[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag(USERS_TAG);

  // limit=0 — все совпадения одним запросом
  const data = await dummyFetch<RawUsersResponse>('/users/search', {
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
    return normalizeUser(await dummyFetch<RawUser>(`/users/${id}`, { query: { select: USER_FIELDS } }));
  } catch (error) {
    if (error instanceof ServiceError && error.status === 404) return null;
    throw error;
  }
}

interface RawPost {
  id: number;
  title: string;
  body: string;
  tags?: string[];
  reactions?: { likes?: number; dislikes?: number };
  views?: number;
}

export async function getUserPosts(userId: number): Promise<UserPost[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(userTag(userId));

  const { posts } = await dummyFetch<{ posts: RawPost[] }>(`/users/${userId}/posts`, {
    query: { limit: 0, select: 'title,body,tags,reactions,views' },
  });
  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    body: post.body,
    tags: post.tags ?? [],
    likes: post.reactions?.likes ?? 0,
    dislikes: post.reactions?.dislikes ?? 0,
    views: post.views ?? 0,
  }));
}

export async function getUserTodos(userId: number): Promise<UserTodo[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(userTag(userId));

  const { todos } = await dummyFetch<{ todos: UserTodo[] }>(`/users/${userId}/todos`, { query: { limit: 0 } });
  return todos.map(({ id, todo, completed }) => ({ id, todo, completed }));
}

/**
 * Сводка по ролям. Сама функция не кэшируется: кэшируется компонент UsersStats,
 * который её вызывает (кэширование на уровне UI, а не данных).
 */
export async function getUsersStats(): Promise<UsersStats> {
  const { users } = await dummyFetch<{ users: { role?: string }[] }>('/users', {
    query: { limit: 0, select: 'role' },
  });
  const byRole: Record<UserRole, number> = { admin: 0, moderator: 0, user: 0 };
  for (const { role } of users) if (isRole(role)) byRole[role] += 1;
  return { total: users.length, byRole };
}

// ---------- Мутации (не кэшируются) ----------

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
  const { users } = await dummyFetch<RawUsersResponse>('/users/filter', {
    query: { key: 'username', value: username, select: 'username', limit: 1 },
  });
  if (users.some((user) => user.id !== exceptId)) {
    throw new ServiceError('Такой логин уже занят', 409, { username: 'Такой логин уже занят' });
  }
}

/** Плоские данные формы → тело запроса DummyJSON (вложенные объекты PUT/PATCH сливает с текущими) */
function toDummyPayload(input: Partial<UserInput>) {
  const { companyName, companyTitle, department, city, country, ...plain } = input;
  const company = { name: companyName, title: companyTitle, department };
  const address = { city, country };
  const defined = (obj: Record<string, unknown>) =>
    Object.values(obj).some((value) => value !== undefined) ? obj : undefined;

  return { ...plain, company: defined(company), address: defined(address) };
}

export async function createUser(input: unknown): Promise<User> {
  const data = parse(userInputSchema, input);
  await ensureUsernameAvailable(data.username);
  const created = await dummyFetch<RawUser>('/users/add', {
    method: 'POST',
    body: { ...toDummyPayload(data), image: avatarUrl(data.username) },
  });
  return normalizeUser(created);
}

/** partial: false — PUT (все поля формы), true — PATCH (только переданные) */
export async function updateUser(id: unknown, input: unknown, { partial = false } = {}): Promise<User> {
  const userId = parseId(id);
  const data = partial ? parse(userPatchSchema, input) : parse(userInputSchema, input);
  if (data.username) await ensureUsernameAvailable(data.username, userId);
  const updated = await dummyFetch<RawUser>(`/users/${userId}`, {
    method: partial ? 'PATCH' : 'PUT',
    body: toDummyPayload(data),
  });
  return normalizeUser(updated);
}

export async function deleteUser(id: unknown): Promise<{ id: number; deletedOn: string }> {
  const userId = parseId(id);
  const deleted = await dummyFetch<RawUser & { deletedOn?: string }>(`/users/${userId}`, { method: 'DELETE' });
  return { id: deleted.id, deletedOn: deleted.deletedOn ?? '' };
}
