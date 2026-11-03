// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { viewers } from '@/test/fixtures';
import { createUser, deleteUser, getUser, updateUser } from './users';

/*
 * Сервис пользователей: права проверяются до валидации и до запроса к DummyJSON,
 * данные — до запроса, ответ DummyJSON — схемой. Сеть заменена фейковым fetch.
 */
vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));

const fetchMock = vi.fn<typeof fetch>();
const mockSession = (viewer: unknown) => vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(viewer && { viewer });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const validInput = {
  firstName: 'Иван',
  lastName: 'Петров',
  username: 'ivan',
  email: 'ivan@example.ru',
  phone: '',
  age: 30,
  gender: 'male',
  role: 'user',
  birthDate: '',
  companyName: '',
  companyTitle: '',
  department: '',
  city: '',
  country: '',
};

describe('server/users — мутации', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('гость не может создать запись: 401, запрос к DummyJSON не уходит', async () => {
    mockSession(null);
    await expect(createUser(validInput)).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('пользователь не может удалить запись: 403, запрос к DummyJSON не уходит', async () => {
    mockSession(viewers.user);
    await expect(deleteUser(5)).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('неверные данные отклоняются на сервере (422) даже без формы', async () => {
    mockSession(viewers.user);
    await expect(updateUser(5, { ...validInput, role: 'admin', age: 16 })).rejects.toMatchObject({
      status: 422,
      fieldErrors: { age: 'Администратором может быть только совершеннолетний (от 18 лет)' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('администратор удаляет запись: DELETE в DummyJSON', async () => {
    mockSession(viewers.admin);
    fetchMock.mockResolvedValue(json({ id: 5, firstName: 'Emma', isDeleted: true, deletedOn: '2026-11-03T10:00:00Z' }));

    await expect(deleteUser(5)).resolves.toEqual({ id: 5, deletedOn: '2026-11-03T10:00:00Z' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://dummyjson.com/users/5');
    expect(init?.method).toBe('DELETE');
  });

  it('ответ DummyJSON неожиданного формата → 502, а не undefined в интерфейсе', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue(json({ id: 'не число', firstName: 42 }));

    await expect(getUser(1)).rejects.toMatchObject({
      status: 502,
      message: 'DummyJSON вернул данные в неожиданном формате',
    });
  });
});
