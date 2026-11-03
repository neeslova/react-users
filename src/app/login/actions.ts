'use server';

import { CredentialsSignin } from 'next-auth';
import { redirect } from 'next/navigation';
import { AuthServiceUnavailable, signIn, signOut } from '@/auth';
import { DEFAULT_CALLBACK_URL, loginSchema, parseCallbackUrl } from '@/schemas/auth';
import { toFieldErrors } from '@/schemas/user';
import type { LoginState } from '@/types/auth';

/**
 * Вход (Server Function для useActionState). Форма проверила поля в браузере,
 * но здесь они проверяются снова: Server Function можно вызвать и без формы.
 */
export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { message: 'Проверьте поля формы', fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    // redirect: false — редирект делаем сами, на проверенный относительный адрес
    await signIn('credentials', { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthServiceUnavailable) {
      return { message: 'Сервис авторизации DummyJSON недоступен. Попробуйте позже' };
    }
    if (error instanceof CredentialsSignin) {
      // Не уточняем, что именно неверно: так нельзя подобрать существующие логины
      return { message: 'Неверный логин или пароль' };
    }
    throw error;
  }

  redirect(parseCallbackUrl(formData.get('callbackUrl')));
}

/** Выход: Auth.js удаляет cookie сессии */
export async function logoutAction() {
  await signOut({ redirect: false });
  redirect(DEFAULT_CALLBACK_URL);
}
