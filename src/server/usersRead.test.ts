// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_FILTERS } from '@/constants/user';
import { errorResponse } from './http';
import { ServiceError } from './errors';
import { getUser, getUsersPage, getUserTodos } from './users';

/*
 * Чтение: какой эндпоинт DummyJSON выбирается для фильтров и как ответ
 * приводится к типам приложения. Сеть — фейковый fetch.
 */
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

const fetchMock = vi.fn<typeof fetch>();
const requested = (call = 0) => new URL(String(fetchMock.mock.calls[call][0]));
const query = (filters: Partial<typeof DEFAULT_FILTERS>) => ({ ...DEFAULT_FILTERS, ...filters, skip: 0, limit: 2 });

describe('server/users — чтение', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('без фильтров — /users с сортировкой; отсутствующие поля получают значения по умолчанию', async () => {
    fetchMock.mockResolvedValue(Response.json({ users: [{ id: 1, firstName: 'Emily', username: 'emilys' }], total: 208 }));

    const page = await getUsersPage(query({ sort: 'name', order: 'asc' }));

    expect(requested().pathname).toBe('/users');
    expect(requested().searchParams.get('sortBy')).toBe('firstName');
    expect(page.total).toBe(208);
    expect(page.users[0]).toMatchObject({
      id: 1,
      firstName: 'Emily',
      lastName: '',
      role: 'user',
      image: 'https://dummyjson.com/icon/emilys/128',
      address: { city: '' },
    });
  });

  it('поиск — /users/search, роль — /users/filter', async () => {
    fetchMock.mockImplementation(async () => Response.json({ users: [], total: 0 }));

    await getUsersPage(query({ q: 'em' }));
    await getUsersPage(query({ role: 'admin' }));

    expect(requested(0).pathname).toBe('/users/search');
    expect(requested(0).searchParams.get('q')).toBe('em');
    expect(requested(1).pathname).toBe('/users/filter');
    expect(requested(1).searchParams.get('value')).toBe('admin');
  });

  it('поиск + роль: DummyJSON так не умеет — фильтруем и режем на страницы сами', async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        users: [
          { id: 1, role: 'admin' },
          { id: 2, role: 'user' },
          { id: 3, role: 'admin' },
          { id: 4, role: 'admin' },
        ],
        total: 4,
      }),
    );

    const page = await getUsersPage({ ...query({ q: 'e', role: 'admin' }), skip: 2 });

    expect(requested().searchParams.get('limit')).toBe('0');
    expect(page).toMatchObject({ total: 3, skip: 2 });
    expect(page.users.map((user) => user.id)).toEqual([4]);
  });

  it('getUser: 404 → null; задачи приводятся к нужным полям', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: 'not found' }, { status: 404 }));
    await expect(getUser(9999)).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(Response.json({ todos: [{ id: 1, todo: 'Купить хлеб', completed: true, userId: 5 }] }));
    await expect(getUserTodos(5)).resolves.toEqual([{ id: 1, todo: 'Купить хлеб', completed: true }]);
  });
});

describe('server/http — ответы Route Handler с ошибкой', () => {
  it('ServiceError → его статус, сообщение и ошибки полей', async () => {
    const response = errorResponse(new ServiceError('Такой логин уже занят', 409, { username: 'Такой логин уже занят' }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: 'Такой логин уже занят',
      fieldErrors: { username: 'Такой логин уже занят' },
    });
  });

  it('неожиданная ошибка → 500 без подробностей (или запасной статус)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const internal = errorResponse(new Error('секретная деталь'));
    expect(internal.status).toBe(500);
    await expect(internal.json()).resolves.toEqual({ message: 'Внутренняя ошибка сервера' });

    const upstream = errorResponse(new Error('сбой'), { status: 502, message: 'Не удалось получить данные от DummyJSON' });
    expect(upstream.status).toBe(502);
  });
});
