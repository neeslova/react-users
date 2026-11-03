import 'server-only';
import { z } from 'zod';
import { ROLES } from '@/constants/user';

/*
 * Схемы ответов DummyJSON — проверка внешней границы. Тип в TypeScript
 * (dummyFetch<T>) ничего не гарантирует во время выполнения: если API вернёт
 * другой формат, ошибка вылезла бы далеко от места запроса (undefined в разметке,
 * NaN в возрасте). Здесь ответ разбирается сразу: обязательные поля проверяются,
 * необязательные получают значения по умолчанию.
 *
 * Схемы нестрогие: лишние поля (password, ip, crypto…) просто отбрасываются,
 * а отсутствие второстепенного поля не ломает страницу.
 */

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? '');
const measure = z
  .number()
  .nullish()
  .transform((value) => value ?? null);

export const dummyUserSchema = z.object({
  id: z.number().int().positive(),
  firstName: text,
  lastName: text,
  maidenName: text,
  age: z
    .number()
    .int()
    .nonnegative()
    .nullish()
    .transform((value) => value ?? 0),
  gender: z
    .string()
    .nullish()
    .transform((value) => (value === 'male' ? 'male' : 'female')),
  birthDate: text,
  email: text,
  phone: text,
  username: text,
  image: text,
  // Незнакомая роль — не повод ронять страницу: считаем такого пользователя обычным
  role: z.enum(ROLES).catch('user'),
  bloodGroup: text,
  height: measure,
  weight: measure,
  eyeColor: text,
  hair: z.object({ color: text, type: text }).catch({ color: '', type: '' }),
  university: text,
  address: z
    .object({ address: text, city: text, state: text, postalCode: text, country: text })
    .catch({ address: '', city: '', state: '', postalCode: '', country: '' }),
  company: z.object({ name: text, title: text, department: text }).catch({ name: '', title: '', department: '' }),
});

export type DummyUser = z.infer<typeof dummyUserSchema>;

export const dummyUsersListSchema = z.object({
  users: z.array(dummyUserSchema),
  total: z.number().int().nonnegative(),
});

/** Для проверки уникальности логина и статистики достаточно части полей */
export const dummyUsernamesSchema = z.object({
  users: z.array(z.object({ id: z.number().int(), username: z.string() })),
});

export const dummyRolesSchema = z.object({
  users: z.array(z.object({ role: z.enum(ROLES).catch('user') })),
});

export const dummyDeletedSchema = z.object({
  id: z.number().int().positive(),
  deletedOn: text,
});

export const dummyPostsSchema = z.object({
  posts: z.array(
    z.object({
      id: z.number().int(),
      title: z.string(),
      body: z.string(),
      tags: z.array(z.string()).catch([]),
      reactions: z
        .object({ likes: z.number().catch(0), dislikes: z.number().catch(0) })
        .catch({ likes: 0, dislikes: 0 }),
      views: z.number().catch(0),
    }),
  ),
});

export const dummyTodosSchema = z.object({
  todos: z.array(z.object({ id: z.number().int(), todo: z.string(), completed: z.boolean() })),
});

/** POST /auth/login: из ответа нужен только accessToken — дальше по нему читается профиль */
export const dummyLoginSchema = z.object({
  id: z.number().int().positive(),
  accessToken: z.string().min(1),
});
