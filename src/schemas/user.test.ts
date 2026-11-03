import { describe, expect, it } from 'vitest';
import { parseUserFilters, parseUserId, toFieldErrors, todayIsoDate, userInputSchema, userPatchSchema } from './user';

const valid = {
  firstName: 'Иван',
  lastName: 'Петров',
  username: 'ivan',
  email: 'ivan@example.ru',
  phone: '',
  age: '30',
  gender: 'male',
  role: 'user',
  birthDate: '',
  companyName: '',
  companyTitle: '',
  department: '',
  city: '',
  country: '',
};

describe('userInputSchema', () => {
  it('parse возвращает данные, приведённые к типам схемы', () => {
    expect(userInputSchema.parse(valid)).toMatchObject({ age: 30, username: 'ivan' });
  });

  it('parse бросает ZodError, safeParse возвращает результат с ошибкой', () => {
    const input = { ...valid, email: 'не email' };
    expect(() => userInputSchema.parse(input)).toThrow('Некорректный email');

    const result = userInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(toFieldErrors(result.error)).toEqual({ email: 'Некорректный email' });
  });

  it('администратор должен быть совершеннолетним', () => {
    const result = userInputSchema.safeParse({ ...valid, role: 'admin', age: '17' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error)).toEqual({ age: 'Администратором может быть только совершеннолетний (от 18 лет)' });
    }
    expect(userInputSchema.safeParse({ ...valid, role: 'admin', age: '18' }).success).toBe(true);
    expect(userInputSchema.safeParse({ ...valid, role: 'user', age: '16' }).success).toBe(true);
  });

  it('правило про возраст проверяется вместе с ошибками других полей', () => {
    const result = userInputSchema.safeParse({ ...valid, firstName: '', role: 'admin', age: '15' });
    expect(result.success).toBe(false);
    if (!result.success) expect(Object.keys(toFieldErrors(result.error)).sort()).toEqual(['age', 'firstName']);
  });

  it('дата рождения не может быть в будущем', () => {
    const tomorrow = todayIsoDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const result = userInputSchema.safeParse({ ...valid, birthDate: tomorrow });
    expect(result.success).toBe(false);
    if (!result.success) expect(toFieldErrors(result.error).birthDate).toBe('Дата рождения не может быть в будущем');
  });

  it('PATCH: можно передать часть полей, правило про возраст — если есть оба', () => {
    expect(userPatchSchema.safeParse({ age: '40' }).success).toBe(true);
    expect(userPatchSchema.safeParse({ role: 'admin' }).success).toBe(true);
    expect(userPatchSchema.safeParse({ role: 'admin', age: 12 }).success).toBe(false);
  });
});

describe('параметры URL', () => {
  it('parseUserFilters заменяет мусор значениями по умолчанию', () => {
    expect(parseUserFilters(new URLSearchParams('q=em&role=boss&sort=age&order=up'))).toEqual({
      q: 'em',
      role: 'all',
      sort: 'age',
      order: 'desc',
    });
  });

  it('parseUserId пропускает только положительные целые', () => {
    expect(parseUserId('42')).toBe(42);
    expect(parseUserId('abc')).toBeNull();
    expect(parseUserId('-1')).toBeNull();
    expect(parseUserId('1.5')).toBeNull();
  });
});
