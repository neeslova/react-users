import type { Viewer } from '@/schemas/auth';

/*
 * Расширение типов Auth.js (module augmentation): в сессии и JWT
 * лежит проверенный профиль текущего пользователя.
 */

declare module 'next-auth' {
  interface User {
    viewer?: Viewer;
  }

  interface Session {
    viewer: Viewer | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    viewer?: Viewer;
  }
}
