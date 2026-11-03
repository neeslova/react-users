import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { loginSchema, viewerSchema } from '@/schemas/auth';
import { authenticate } from '@/server/dummyjsonAuth';
import { env } from '@/server/env';

/*
 * Auth.js (next-auth v5): вход по логину и паролю DummyJSON.
 *
 * Сессия — JWT в cookie: после входа Auth.js шифрует профиль (JWE, ключ AUTH_SECRET)
 * и кладёт в cookie authjs.session-token с флагами httpOnly (недоступна JavaScript),
 * sameSite=lax (не уходит с чужих сайтов в POST-запросах) и secure на HTTPS.
 * Браузер присылает cookie с каждым запросом — так сервер узнаёт пользователя
 * и после перезагрузки страницы. В localStorage ничего не хранится.
 */

/** Учётные данные не проверены, потому что DummyJSON недоступен (а не потому что неверны) */
export class AuthServiceUnavailable extends CredentialsSignin {
  code = 'service_unavailable';
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  // Приложение запускается и вне Vercel (next start): адрес берётся из заголовка Host
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Логин' },
        password: { label: 'Пароль', type: 'password' },
      },
      /**
       * authorize — публичная точка входа (POST /api/auth/callback/credentials),
       * поэтому данные проверяются схемой ещё раз, даже если форма их уже проверила.
       */
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        let viewer;
        try {
          viewer = await authenticate(parsed.data);
        } catch (error) {
          console.error('Вход: DummyJSON недоступен', error);
          throw new AuthServiceUnavailable();
        }
        if (!viewer) return null;
        return { id: String(viewer.id), name: viewer.name, email: viewer.email, image: viewer.image, viewer };
      },
    }),
  ],
  callbacks: {
    // user передаётся только в момент входа: переносим профиль в токен
    jwt({ token, user }) {
      if (user?.viewer) token.viewer = user.viewer;
      return token;
    },
    // Что увидит приложение в auth(): профиль проверяется схемой, а не берётся на веру
    session({ session, token }) {
      const viewer = viewerSchema.safeParse(token.viewer);
      return { ...session, viewer: viewer.success ? viewer.data : null };
    },
  },
  logger: {
    // Неверный пароль — ожидаемая ситуация, а не ошибка сервера: в лог не пишем
    error(error) {
      if (error instanceof CredentialsSignin) return;
      console.error(error);
    },
  },
});
