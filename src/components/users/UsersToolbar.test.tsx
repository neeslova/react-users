import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersToolbar } from './UsersToolbar';

// Фильтры живут в адресной строке: стаб роутера читает текущий window.location
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/users',
  useSearchParams: () => new ReadonlyURLSearchParams(window.location.search),
}));

describe('UsersToolbar', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/users');
  });

  it('поиск попадает в адрес не на каждую букву, а после паузы (debounce)', async () => {
    const user = userEvent.setup();
    render(<UsersToolbar />);

    await user.type(screen.getByRole('textbox', { name: 'Поиск пользователей' }), ' em ');
    expect(window.location.search).toBe('');

    await waitFor(() => expect(window.location.search).toBe('?q=em'));
  });

  it('вкладка роли и направление сортировки меняют фильтры в адресе', async () => {
    const user = userEvent.setup();
    render(<UsersToolbar />);

    await user.click(screen.getByRole('tab', { name: 'Администраторы' }));
    expect(window.location.search).toBe('?role=admin');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Сортировка' }), 'По возрасту');
    await user.click(screen.getByRole('button', { name: /По убыванию/ }));
    expect(new URLSearchParams(window.location.search).toString()).toBe('role=admin&sort=age&order=asc');
  });

  it('крестик очищает поиск сразу', async () => {
    window.history.replaceState(null, '', '/users?q=em');
    const user = userEvent.setup();
    render(<UsersToolbar />);

    expect(screen.getByRole('textbox', { name: 'Поиск пользователей' })).toHaveValue('em');
    await user.click(screen.getByRole('button', { name: 'Очистить поиск' }));

    expect(screen.getByRole('textbox', { name: 'Поиск пользователей' })).toHaveValue('');
    expect(window.location.search).toBe('');
  });
});
