import { z } from 'zod';
import { ru } from 'zod/locales';
import {
  DEFAULT_FILTERS,
  GENDERS,
  ROLES,
  SORT_FIELDS,
  SORT_ORDERS,
  USERS_PAGE_SIZE,
} from '@/constants/user';
import type { FieldErrors } from '@/types/api';
import type { UserFilters } from '@/types/user';

/*
 * Схемы общие для клиента и сервера (в модуле нет ни 'use client', ни server-only):
 *  - форма проверяет данные сразу при вводе;
 *  - Server Function и Route Handler проверяют их повторно — клиенту доверять нельзя.
 * Правила описаны один раз, поэтому проверки не расходятся.
 */

// Стандартные сообщения zod (там, где не заданы свои) — на русском
z.config(ru());

const roleFilterSchema = z.enum(['all', ...ROLES]);
const sortSchema = z.enum(SORT_FIELDS);
const orderSchema = z.enum(SORT_ORDERS);
const querySchema = z.string().trim().max(100);

// ---------- Фильтры списка из URL ----------

/** Нестрогий разбор: мусор в адресной строке просто заменяется значениями по умолчанию */
const userFiltersSchema = z.object({
  q: querySchema.catch(DEFAULT_FILTERS.q),
  role: roleFilterSchema.catch(DEFAULT_FILTERS.role),
  sort: sortSchema.catch(DEFAULT_FILTERS.sort),
  order: orderSchema.catch(DEFAULT_FILTERS.order),
});

type SearchParamsRecord = Record<string, string | string[] | undefined>;
type SearchParamsSource = Pick<URLSearchParams, 'get'> | SearchParamsRecord;

const readParam = (source: SearchParamsSource, key: string): string | undefined => {
  if (typeof source.get === 'function') return (source as Pick<URLSearchParams, 'get'>).get(key) ?? undefined;
  const value = (source as SearchParamsRecord)[key];
  return Array.isArray(value) ? value[0] : value;
};

/** Работает и с searchParams страницы (Server Component), и с useSearchParams() (Client Component) */
export function parseUserFilters(source: SearchParamsSource): UserFilters {
  return userFiltersSchema.parse({
    q: readParam(source, 'q'),
    role: readParam(source, 'role'),
    sort: readParam(source, 'sort'),
    order: readParam(source, 'order'),
  });
}

/** Строгий разбор параметров GET /api/users: на некорректный запрос API отвечает 400 */
export const usersApiQuerySchema = z.object({
  q: querySchema.default(DEFAULT_FILTERS.q),
  role: roleFilterSchema.default(DEFAULT_FILTERS.role),
  sort: sortSchema.default(DEFAULT_FILTERS.sort),
  order: orderSchema.default(DEFAULT_FILTERS.order),
  skip: z.coerce.number().int().min(0).max(10_000).default(0),
  limit: z.coerce.number().int().min(1).max(50).default(USERS_PAGE_SIZE),
});

// ---------- Идентификатор ----------

export const userIdSchema = z.coerce.number().int().positive().max(1_000_000);

/** '42' → 42, всё остальное ('abc', '-1', '1.5') → null */
export function parseUserId(value: unknown): number | null {
  if (typeof value === 'string' && !/^\d+$/.test(value)) return null;
  const result = userIdSchema.safeParse(value);
  return result.success ? result.data : null;
}

// ---------- Форма пользователя (добавление / изменение) ----------

const USERNAME_RE = /^[a-z0-9._-]{3,20}$/;
const optionalText = (max: number) => z.string().trim().max(max, `Не длиннее ${max} символов`);

/**
 * Плоская схема — один в один с полями формы, поэтому ошибка по полю
 * находится по issue.path[0]. В формат DummyJSON (вложенные company/address)
 * данные превращаются уже на сервере.
 */
export const userInputSchema = z.object({
  firstName: z.string().trim().min(1, 'Введите имя').max(40, 'Не длиннее 40 символов'),
  lastName: z.string().trim().min(1, 'Введите фамилию').max(40, 'Не длиннее 40 символов'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_RE, 'Латиница, цифры, . _ - (от 3 до 20 символов)'),
  email: z.string().trim().pipe(z.email('Некорректный email')),
  phone: optionalText(30),
  age: z.coerce
    .number({ error: 'Возраст от 1 до 120' })
    .int('Возраст — целое число')
    .min(1, 'Возраст от 1 до 120')
    .max(120, 'Возраст от 1 до 120'),
  gender: z.enum(GENDERS),
  role: z.enum(ROLES),
  birthDate: z.union([z.literal(''), z.iso.date('Некорректная дата')]),
  companyName: optionalText(60),
  companyTitle: optionalText(60),
  department: optionalText(60),
  city: optionalText(60),
  country: optionalText(60),
});

/** Частичное обновление (PATCH /api/users/:id) */
export const userPatchSchema = userInputSchema.partial();

/** Проверенные данные формы (age уже число, строки обрезаны) */
export type UserInput = z.output<typeof userInputSchema>;
export type UserInputField = keyof UserInput;

/** { username: ['...'], age: ['...'] } → { username: '...', age: '...' } — по одной ошибке на поле */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const { fieldErrors } = z.flattenError(error);
  const result: FieldErrors = {};
  for (const [field, messages] of Object.entries(fieldErrors) as [string, string[] | undefined][]) {
    if (messages?.[0]) result[field] = messages[0];
  }
  return result;
}
