import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_FILTERS } from '@/constants/user';
import type { UsersPage } from '@/types/user';
import { makeUser } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { UsersInfiniteList } from './UsersInfiniteList';

// Фильтры читаются из адресной строки: стаб роутера отдаёт текущий window.location
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/users',
  useSearchParams: () => new ReadonlyURLSearchParams(window.location.search),
}));

const page = (ids: number[], total: number, skip = 0): UsersPage => ({
  users: ids.map((id) => makeUser({ id, firstName: `Имя${id}`, lastName: 'Тестов', username: `user${id}` })),
  total,
  skip,
  limit: 12,
});
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

const fetchMock = vi.fn<typeof fetch>();

describe('UsersInfiniteList', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/users');
    vi.stubGlobal('fetch', fetchMock);
    // Автодозагрузку при прокрутке выключаем (стаб без наблюдения): страницы грузятся по кнопке
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('показывает первую страницу с сервера без лишнего запроса', async () => {
    await renderWithProviders(<UsersInfiniteList initialFilters={DEFAULT_FILTERS} initialPage={page(range(1, 12), 14)} />);

    expect(screen.getAllByRole('article')).toHaveLength(12);
    expect(screen.getByText(/Всего 14 пользователей · показано 12/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Загрузить ещё (2)' })).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('догружает следующую страницу без дублей и понимает, что список закончился', async () => {
    // Данные на сервере «сдвинулись»: запись 12 пришла и во второй странице
    fetchMock.mockResolvedValue(Response.json(page([12, 13, 14], 14, 12)));
    const user = userEvent.setup();
    await renderWithProviders(<UsersInfiniteList initialFilters={DEFAULT_FILTERS} initialPage={page(range(1, 12), 14)} />);

    await user.click(screen.getByRole('button', { name: 'Загрузить ещё (2)' }));

    expect(await screen.findByText('Показаны все пользователи')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(14);
    expect(screen.queryByRole('button', { name: /Загрузить ещё/ })).not.toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0][0])).toContain('skip=12');
  });

  it('ошибка следующей страницы не стирает список и даёт повторить', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: 'Не удалось получить данные от DummyJSON' }, { status: 502 }));
    const user = userEvent.setup();
    await renderWithProviders(<UsersInfiniteList initialFilters={DEFAULT_FILTERS} initialPage={page(range(1, 12), 14)} />);

    await user.click(screen.getByRole('button', { name: 'Загрузить ещё (2)' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Не удалось загрузить следующую страницу: Не удалось получить данные от DummyJSON',
    );
    expect(screen.getAllByRole('article')).toHaveLength(12);

    fetchMock.mockResolvedValueOnce(Response.json(page([13, 14], 14, 12)));
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByText('Показаны все пользователи')).toBeInTheDocument();
  });

  it('пустой результат поиска — не ошибка: подсказка и сброс фильтров', async () => {
    window.history.replaceState(null, '', '/users?q=zzz');
    const user = userEvent.setup();
    await renderWithProviders(<UsersInfiniteList initialFilters={{ ...DEFAULT_FILTERS, q: 'zzz' }} initialPage={page([], 0)} />);

    expect(screen.getByRole('heading', { name: 'Ничего не найдено' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));
    expect(window.location.search).toBe('');
  });
});
