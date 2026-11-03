import 'server-only';
import type { LoginInput, Viewer } from '@/schemas/auth';
import { getFullName } from '@/utils/userFilters';
import { avatarUrl, dummyFetch } from './dummyjson';
import { dummyLoginSchema, dummyUserSchema } from './dummyjsonSchemas';
import { ServiceError } from './errors';

/**
 * Проверка логина и пароля через DummyJSON (POST /auth/login).
 * null — неверные учётные данные; исключение — сервис недоступен.
 *
 * Токены DummyJSON нам не нужны и нигде не сохраняются: сессию приложения
 * выдаёт Auth.js. Токен используется один раз — прочитать профиль с ролью
 * (в ответе /auth/login её нет).
 */
export async function authenticate({ username, password }: LoginInput): Promise<Viewer | null> {
  let accessToken: string;
  try {
    ({ accessToken } = await dummyFetch('/auth/login', dummyLoginSchema, {
      method: 'POST',
      body: { username, password, expiresInMins: 1 },
    }));
  } catch (error) {
    if (error instanceof ServiceError && (error.status === 400 || error.status === 401)) return null;
    throw error;
  }

  const profile = await dummyFetch('/auth/me', dummyUserSchema, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return {
    id: profile.id,
    username: profile.username,
    name: getFullName(profile),
    email: profile.email,
    image: profile.image || avatarUrl(profile.username),
    role: profile.role,
  };
}
