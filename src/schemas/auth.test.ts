import { describe, expect, it } from 'vitest';
import { loginHref, loginSchema, parseCallbackUrl } from './auth';

describe('loginSchema', () => {
  it('обрезает пробелы и приводит логин к нижнему регистру', () => {
    expect(loginSchema.parse({ username: ' EmilyS ', password: 'secret' })).toEqual({
      username: 'emilys',
      password: 'secret',
    });
  });

  it('пустые поля — понятные сообщения', () => {
    const result = loginSchema.safeParse({ username: '', password: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.message)).toContain('Введите пароль');
  });
});

describe('parseCallbackUrl — защита от open redirect', () => {
  it.each(['/users', '/users/5/edit', '/users?q=em&role=admin'])('пропускает путь этого сайта %s', (url) => {
    expect(parseCallbackUrl(url)).toBe(url);
  });

  it.each([
    'https://evil.com',
    '//evil.com',
    String.raw`/\evil.com`,
    '/\t/evil.com',
    'javascript:alert(1)',
    '/login',
    '/api/users',
    undefined,
  ])('заменяет %s на /users', (url) => {
    expect(parseCallbackUrl(url)).toBe('/users');
  });

  it('loginHref кодирует адрес возврата', () => {
    expect(loginHref('/users?q=em')).toBe('/login?callbackUrl=%2Fusers%3Fq%3Dem');
  });
});
