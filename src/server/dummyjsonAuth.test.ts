// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticate } from './dummyjsonAuth';

/*
 * Проверка логина и пароля через DummyJSON. Сеть заменена фейковым fetch,
 * который отвечает как настоящий API: /auth/login, затем /auth/me.
 */
const fetchMock = vi.fn<typeof fetch>();
const credentials = { username: 'averyp', password: 'averyppass' };

describe('authenticate', () => {
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('верный пароль → профиль с ролью из /auth/me, токен DummyJSON наружу не выходит', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ id: 16, username: 'averyp', accessToken: 'secret-token', refreshToken: 'r' }))
      .mockResolvedValueOnce(
        Response.json({ id: 16, firstName: 'Avery', lastName: 'Perez', username: 'averyp', email: 'a@x.com', image: '', role: 'user', password: 'averyppass' }),
      );

    const viewer = await authenticate(credentials);

    expect(viewer).toEqual({
      id: 16,
      username: 'averyp',
      name: 'Avery Perez',
      email: 'a@x.com',
      image: 'https://dummyjson.com/icon/averyp/128',
      role: 'user',
    });
    expect(JSON.stringify(viewer)).not.toMatch(/secret-token|averyppass/);
    const [, meInit] = fetchMock.mock.calls[1];
    expect(meInit?.headers).toMatchObject({ Authorization: 'Bearer secret-token' });
  });

  it('неверный пароль (400 от DummyJSON) → null', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ message: 'Invalid credentials' }, { status: 400 }));
    await expect(authenticate(credentials)).resolves.toBeNull();
  });

  it('DummyJSON недоступен → ошибка 502 (а не «неверный пароль»)', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(authenticate(credentials)).rejects.toMatchObject({ status: 502 });
  });
});
