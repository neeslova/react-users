// @vitest-environment node
import { forbidden, redirect } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { viewers } from '@/test/fixtures';
import { getViewer, requirePageAccess, requirePermission } from './session';

/*
 * Серверная проверка прав (Data Access Layer). Auth.js подменён моком:
 * тест задаёт, какую сессию «расшифровал» сервер, и проверяет ответ — 401, 403 или пропуск.
 */
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
  forbidden: vi.fn(() => {
    throw new Error('forbidden');
  }),
}));

// auth() у Auth.js перегружен (сессия, middleware, route handler) — мокаем вариант без аргументов
const mockSession = (viewer: unknown) => vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(viewer && { viewer });

describe('session (DAL)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getViewer: гость → null', async () => {
    mockSession(null);
    await expect(getViewer()).resolves.toBeNull();
  });

  it('getViewer: содержимое сессии проверяется схемой', async () => {
    mockSession({ ...viewers.user, role: 'superadmin' });
    await expect(getViewer()).resolves.toBeNull();
  });

  it('requirePermission: гость → 401', async () => {
    mockSession(null);
    await expect(requirePermission('users:create')).rejects.toMatchObject({
      status: 401,
      message: 'Войдите в систему, чтобы выполнить это действие',
    });
  });

  it('requirePermission: пользователь удаляет → 403', async () => {
    mockSession(viewers.user);
    await expect(requirePermission('users:delete')).rejects.toMatchObject({
      status: 403,
      message: 'Удалять пользователей может только администратор',
    });
  });

  it('requirePermission: администратору удаление разрешено', async () => {
    mockSession(viewers.admin);
    await expect(requirePermission('users:delete')).resolves.toEqual(viewers.admin);
  });

  it('requirePageAccess: гость → редирект на вход с возвратом', async () => {
    mockSession(null);
    await expect(requirePageAccess('users:update', '/users/5/edit')).rejects.toThrow(
      'redirect:/login?callbackUrl=%2Fusers%2F5%2Fedit',
    );
    expect(redirect).toHaveBeenCalledOnce();
  });

  it('requirePageAccess: вошёл, но роли не хватает прав → 403 (forbidden)', async () => {
    mockSession(viewers.moderator);
    await expect(requirePageAccess('users:delete', '/users')).rejects.toThrow('forbidden');
    expect(forbidden).toHaveBeenCalledOnce();
  });
});
