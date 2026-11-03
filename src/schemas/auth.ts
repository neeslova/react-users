import { z } from 'zod';
import { ROLES } from '@/constants/user';
import { usernameSchema } from './user';

/*
 * Схемы аутентификации — общие для формы входа (браузер) и сервера
 * (Server Function входа и authorize у Auth.js).
 */

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Введите пароль').max(128, 'Не длиннее 128 символов'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Текущий пользователь (viewer) — то, что хранится в сессии и уходит в браузер.
 * Только публичные поля: ни пароля, ни токенов DummyJSON здесь нет.
 */
export const viewerSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string(),
  role: z.enum(ROLES),
});

export type Viewer = z.infer<typeof viewerSchema>;

export const DEFAULT_CALLBACK_URL = '/users';

/**
 * ?callbackUrl= — куда вернуть пользователя после входа. Параметр приходит из URL,
 * то есть его может подставить кто угодно. Разрешён только путь этого же сайта:
 * «//evil.com» или «https://evil.com» превратили бы вход в open redirect.
 * Пробелы и обратные слэши запрещены: браузер вырезает табы и меняет «\» на «/».
 */
const callbackUrlSchema = z
  .string()
  .regex(/^\/(?![/\\])[^\s\\]*$/)
  .refine((url) => !/^\/(login|api)(?=[/?#]|$)/.test(url))
  .catch(DEFAULT_CALLBACK_URL);

export const parseCallbackUrl = (value: unknown): string =>
  callbackUrlSchema.parse(Array.isArray(value) ? value[0] : value);

/** Ссылка на вход с возвратом на текущую страницу */
export const loginHref = (returnTo: string) => `/login?${new URLSearchParams({ callbackUrl: returnTo })}`;
