import { screen } from '@testing-library/react';
import { ReadonlyURLSearchParams, usePathname, useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { viewers } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { UserMenu } from './UserMenu';

// Server Function выхода тянет за собой Auth.js — в компонентном тесте она не нужна
vi.mock('@/app/login/actions', () => ({ logoutAction: vi.fn(), loginAction: vi.fn() }));

// Адрес текущей страницы задаёт роутер Next.js; в тесте подменяем его хуки (стабы)
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('UserMenu', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/users');
    vi.mocked(useSearchParams).mockReturnValue(new ReadonlyURLSearchParams('q=em'));
  });

  it('гостю предлагает войти с возвратом на текущую страницу', async () => {
    await renderWithProviders(<UserMenu />);

    expect(screen.getByRole('link', { name: 'Войти' })).toHaveAttribute(
      'href',
      `/login?callbackUrl=${encodeURIComponent('/users?q=em')}`,
    );
    expect(screen.queryByRole('link', { name: /Добавить/ })).not.toBeInTheDocument();
  });

  it('вошедшему показывает имя, роль, «Добавить» и «Выйти»', async () => {
    await renderWithProviders(<UserMenu />, { viewer: viewers.user });

    expect(screen.getByRole('button', { name: 'Меню пользователя Avery Perez' })).toBeInTheDocument();
    expect(screen.getByText('Пользователь')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Добавить/ })).toHaveAttribute('href', '/users/new');
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Войти' })).not.toBeInTheDocument();
  });
});
