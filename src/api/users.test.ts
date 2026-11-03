import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_FILTERS } from '@/constants/user';
import { makeUser } from '@/test/fixtures';
import { ApiError, fetchUsersPage, getNextPageParam } from './users';

const fetchMock = vi.fn<typeof fetch>();
const query = { ...DEFAULT_FILTERS, q: 'em', skip: 12, limit: 12 };

describe('клиентский API', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('fetchUsersPage: запрос к Route Handler и проверка ответа схемой', async () => {
    const page = { users: [makeUser()], total: 13, skip: 12, limit: 12 };
    fetchMock.mockResolvedValue(Response.json(page));

    await expect(fetchUsersPage(query)).resolves.toEqual(page);
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/users?q=em&skip=12&limit=12');
  });

  it('fetchUsersPage: сообщение об ошибке берётся из тела ответа', async () => {
    fetchMock.mockResolvedValue(Response.json({ message: 'Некорректные параметры запроса' }, { status: 400 }));
    await expect(fetchUsersPage(query)).rejects.toEqual(new ApiError('Некорректные параметры запроса', 400));
  });

  it('fetchUsersPage: ответ не того формата → ошибка, а не «битые» данные в списке', async () => {
    fetchMock.mockResolvedValue(Response.json({ users: [{ id: 'x' }] }));
    await expect(fetchUsersPage(query)).rejects.toMatchObject({ status: 502 });
  });

  it('getNextPageParam: skip следующей страницы или конец списка', () => {
    const users = Array.from({ length: 12 }, (_, index) => makeUser({ id: index + 1 }));
    expect(getNextPageParam({ users, total: 30, skip: 0, limit: 12 })).toBe(12);
    expect(getNextPageParam({ users: users.slice(0, 6), total: 30, skip: 24, limit: 12 })).toBeUndefined();
    expect(getNextPageParam({ users: [], total: 30, skip: 36, limit: 12 })).toBeUndefined();
  });
});
