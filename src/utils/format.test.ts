import { describe, expect, it } from 'vitest';
import { formatAge, formatBirthDate, formatMeasure, getInitials, toInputDate } from './format';
import { filtersToSearchParams, matchesFilters } from './userFilters';
import { DEFAULT_FILTERS } from '@/constants/user';
import { makeUser } from '@/test/fixtures';

/** Число и слово разделены неразрывным пробелом, чтобы не разрываться на две строки */
const nbsp = (text: string) => text.replace(' ', '\u00a0');

describe('format', () => {
  it.each([
    [1, '1 год'],
    [3, '3 года'],
    [11, '11 лет'],
    [21, '21 год'],
    [24, '24 года'],
    [35, '35 лет'],
  ])('formatAge(%i) → %s', (age, expected) => {
    expect(formatAge(age)).toBe(nbsp(expected));
  });

  it('даты DummyJSON без ведущих нулей', () => {
    expect(formatBirthDate('1996-5-30')).toBe('30 мая 1996');
    expect(formatBirthDate('')).toBe('—');
    expect(toInputDate('1996-5-3')).toBe('1996-05-03');
    expect(toInputDate('')).toBe('');
  });

  it('инициалы и размеры', () => {
    expect(getInitials('ольга', 'морозова')).toBe('ОМ');
    expect(formatMeasure(167.6, 'см')).toBe(nbsp('168 см'));
    expect(formatMeasure(null, 'кг')).toBe('—');
  });
});

describe('userFilters', () => {
  it('поиск по имени, логину и email без учёта регистра + фильтр по роли', () => {
    const user = makeUser({ firstName: 'Ольга', username: 'olga.m', email: 'olga@example.ru', role: 'user' });
    expect(matchesFilters(user, { q: 'ОЛЬ', role: 'all' })).toBe(true);
    expect(matchesFilters(user, { q: 'example', role: 'user' })).toBe(true);
    expect(matchesFilters(user, { q: '', role: 'admin' })).toBe(false);
    expect(matchesFilters(user, { q: 'иван', role: 'all' })).toBe(false);
  });

  it('в адрес попадают только отличные от значений по умолчанию фильтры', () => {
    expect(filtersToSearchParams(DEFAULT_FILTERS).toString()).toBe('');
    expect(filtersToSearchParams({ ...DEFAULT_FILTERS, q: 'em', role: 'admin' }).toString()).toBe('q=em&role=admin');
  });
});
