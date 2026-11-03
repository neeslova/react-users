import { handlers } from '@/auth';

/**
 * Служебные эндпоинты Auth.js: /api/auth/session, /api/auth/csrf,
 * /api/auth/callback/credentials, /api/auth/signout и другие.
 */
export const { GET, POST } = handlers;
