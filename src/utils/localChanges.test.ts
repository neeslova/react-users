import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS } from '@/constants/user';
import { makeUser } from '@/test/fixtures';
import { applyLocalChanges, countLocalChanges, getLocalStatus, type LocalChanges } from './localChanges';

const server = [makeUser({ id: 1, firstName: 'Анна' }), makeUser({ id: 2, firstName: 'Борис' }), makeUser({ id: 3, firstName: 'Вера' })];
const none: LocalChanges = { created: [], updated: {}, deletedIds: [] };

describe('applyLocalChanges', () => {
  it('без изменений возвращает данные сервера как есть', () => {
    expect(applyLocalChanges(server, none, DEFAULT_FILTERS)).toEqual({ users: server, hiddenCount: 0, createdCount: 0 });
  });

  it('созданные — сверху, изменённые подменяются, удалённые скрываются', () => {
    const created = makeUser({ id: 500, firstName: 'Новый' });
    const changes: LocalChanges = {
      created: [created],
      updated: { 2: makeUser({ id: 2, firstName: 'Борис (изм.)' }) },
      deletedIds: [3],
    };

    const { users, hiddenCount, createdCount } = applyLocalChanges(server, changes, DEFAULT_FILTERS);

    expect(users.map((user) => user.firstName)).toEqual(['Новый', 'Анна', 'Борис (изм.)']);
    expect(hiddenCount).toBe(1);
    expect(createdCount).toBe(1);
  });

  it('отбрасывает дубли по id (одна запись в двух страницах)', () => {
    const { users } = applyLocalChanges([...server, server[0]], none, DEFAULT_FILTERS);
    expect(users.map((user) => user.id)).toEqual([1, 2, 3]);
  });

  it('изменённая запись, переставшая подходить под фильтр, скрывается', () => {
    const changes: LocalChanges = { ...none, updated: { 1: makeUser({ id: 1, role: 'admin' }) } };
    const { users, hiddenCount } = applyLocalChanges(server, changes, { ...DEFAULT_FILTERS, role: 'user' });
    expect(users.map((user) => user.id)).toEqual([2, 3]);
    expect(hiddenCount).toBe(1);
  });
});

describe('статус и счётчик изменений', () => {
  const changes: LocalChanges = { created: [makeUser({ id: 500 })], updated: { 1: server[0], 3: server[2] }, deletedIds: [3] };

  it('getLocalStatus', () => {
    expect(getLocalStatus(500, changes)).toBe('created');
    expect(getLocalStatus(1, changes)).toBe('updated');
    expect(getLocalStatus(3, changes)).toBe('deleted');
    expect(getLocalStatus(2, changes)).toBe('server');
  });

  it('правка удалённой записи отдельно не считается', () => {
    expect(countLocalChanges(changes)).toBe(3);
  });
});
