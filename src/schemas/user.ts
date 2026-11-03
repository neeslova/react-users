import { z } from 'zod';
import { ru } from 'zod/locales';
import {
  ADULT_AGE,
  DEFAULT_FILTERS,
  GENDERS,
  ROLES,
  SORT_FIELDS,
  SORT_ORDERS,
  USERS_PAGE_SIZE,
} from '@/constants/user';
import type { FieldErrors } from '@/types/api';
import type { User, UserFilters, UsersPage } from '@/types/user';

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

/** Первое значение параметра: и из URLSearchParams, и из объекта searchParams страницы */
export function readSearchParam(source: URLSearchParams | SearchParamsRecord, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

/** Работает и с searchParams страницы (Server Component), и с useSearchParams() (Client Component) */
export function parseUserFilters(source: URLSearchParams | SearchParamsRecord): UserFilters {
  return userFiltersSchema.parse({
    q: readSearchParam(source, 'q'),
    role: readSearchParam(source, 'role'),
    sort: readSearchParam(source, 'sort'),
    order: readSearchParam(source, 'order'),
  });
}

/** Поле сортировки из <select>: значение проверяется, а не приводится через `as` */
export const parseSortField = (value: unknown) => sortSchema.catch(DEFAULT_FILTERS.sort).parse(value);

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
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;
const MIN_BIRTH_DATE = '1900-01-01';

/** Сегодняшняя дата в формате <input type="date"> (YYYY-MM-DD) по местному времени */
export function todayIsoDate(now = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const optionalText = (max: number) => z.string().trim().max(max, `Не длиннее ${max} символов`);

/** Логин: тот же формат у формы пользователя и у формы входа */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Введите логин')
  .regex(USERNAME_RE, 'Латиница, цифры, . _ - (от 3 до 20 символов)');

/**
 * Поля формы. Плоская схема — один в один с полями формы, поэтому ошибка
 * по полю находится по issue.path[0]. В формат DummyJSON (вложенные
 * company/address) данные превращаются уже на сервере.
 */
const userFieldsSchema = z.object({
  firstName: z.string().trim().min(1, 'Введите имя').max(40, 'Не длиннее 40 символов'),
  lastName: z.string().trim().min(1, 'Введите фамилию').max(40, 'Не длиннее 40 символов'),
  username: usernameSchema,
  email: z.string().trim().min(1, 'Введите email').pipe(z.email('Некорректный email')),
  phone: optionalText(30).refine(
    (phone) => phone === '' || PHONE_RE.test(phone),
    'Телефон: цифры, пробелы, скобки и дефисы, в начале можно +',
  ),
  age: z.coerce
    .number({ error: 'Возраст от 1 до 120' })
    .int('Возраст — целое число')
    .min(1, 'Возраст от 1 до 120')
    .max(120, 'Возраст от 1 до 120'),
  gender: z.enum(GENDERS),
  role: z.enum(ROLES),
  birthDate: z.union([
    z.literal(''),
    z.iso
      .date('Некорректная дата')
      // Строки YYYY-MM-DD сравниваются как даты
      .refine((date) => date <= todayIsoDate(), 'Дата рождения не может быть в будущем')
      .refine((date) => date >= MIN_BIRTH_DATE, 'Дата рождения не раньше 1900 года'),
  ]),
  companyName: optionalText(60),
  companyTitle: optionalText(60),
  department: optionalText(60),
  city: optionalText(60),
  country: optionalText(60),
});

/**
 * Правило предметной области: роль «Администратор» даёт право удалять записи,
 * поэтому назначить её можно только совершеннолетнему.
 * Зависит сразу от двух полей, поэтому описано на уровне объекта.
 */
const adminAgeRule = {
  check: (data: { role?: User['role']; age?: number }) =>
    data.role !== 'admin' || data.age === undefined || data.age >= ADULT_AGE,
  params: {
    message: `Администратором может быть только совершеннолетний (от ${ADULT_AGE} лет)`,
    path: ['age'],
  },
};

/**
 * По умолчанию проверки объекта не запускаются, пока в любом поле есть ошибка.
 * when: правило проверяется, как только корректны сами role и age, — пользователь
 * видит все ошибки формы сразу, а не по очереди.
 */
const roleAndAgeValid = (fields: z.ZodType) => (payload: z.core.ParsePayload) =>
  fields.safeParse(payload.value).success;

export const userInputSchema = userFieldsSchema.refine(adminAgeRule.check, {
  ...adminAgeRule.params,
  when: roleAndAgeValid(userFieldsSchema.pick({ role: true, age: true })),
});

/** Частичное обновление (PATCH /api/users/:id): правило про возраст — если переданы оба поля */
export const userPatchSchema = userFieldsSchema.partial().refine(adminAgeRule.check, {
  ...adminAgeRule.params,
  when: roleAndAgeValid(userFieldsSchema.pick({ role: true, age: true }).partial()),
});

/** Типы выводятся из схем (z.infer): правила и типы не могут разойтись */
export type UserInput = z.infer<typeof userInputSchema>;
export type UserPatch = z.infer<typeof userPatchSchema>;
export type UserInputField = keyof UserInput;

/** { username: ['...'], age: ['...'] } → { username: '...', age: '...' } — по одной ошибке на поле */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const { fieldErrors } = z.flattenError(error);
  const result: FieldErrors = {};
  for (const [field, messages] of Object.entries<string[] | undefined>(fieldErrors)) {
    if (messages?.[0]) result[field] = messages[0];
  }
  return result;
}

// ---------- Ответы нашего API (проверяются в браузере) ----------

/**
 * Запись в том виде, в каком её отдают Route Handler'ы. Клиент проверяет
 * ответ, а не верит ему на слово: response.json() возвращает any.
 * satisfies гарантирует, что схема совпадает с типом User.
 */
export const userSchema = z.object({
  id: z.number().int().positive(),
  firstName: z.string(),
  lastName: z.string(),
  maidenName: z.string(),
  age: z.number(),
  gender: z.enum(GENDERS),
  birthDate: z.string(),
  email: z.string(),
  phone: z.string(),
  username: z.string(),
  image: z.string(),
  role: z.enum(ROLES),
  bloodGroup: z.string(),
  height: z.number().nullable(),
  weight: z.number().nullable(),
  eyeColor: z.string(),
  hair: z.object({ color: z.string(), type: z.string() }),
  university: z.string(),
  address: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  company: z.object({ name: z.string(), title: z.string(), department: z.string() }),
}) satisfies z.ZodType<User>;

export const usersPageSchema = z.object({
  users: z.array(userSchema),
  total: z.number().int().nonnegative(),
  skip: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
}) satisfies z.ZodType<UsersPage>;

/** Тело ответа с ошибкой (ApiErrorBody) */
export const apiErrorBodySchema = z.object({
  message: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
});
