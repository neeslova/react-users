import { describe, expect, it } from 'vitest';
import { makeUser } from '@/test/fixtures';
import { createUsersStore } from './usersStore';

describe('usersStore', () => {
  it('выдаёт уникальные id, хотя DummyJSON на каждое добавление отвечает id = 209', () => {
    const store = createUsersStore();
    const first = store.getState().addCreated(makeUser({ id: 209, username: 'a' }));
    const second = store.getState().addCreated(makeUser({ id: 209, username: 'b' }));

    expect(first.id).toBe(209);
    expect(second.id).toBe(210);
    expect(store.getState().created.map((user) => user.username)).toEqual(['b', 'a']);
  });

  it('изменение локальной записи остаётся в created, серверной — попадает в updated', () => {
    const store = createUsersStore();
    const local = store.getState().addCreated(makeUser({ id: 209 }));

    store.getState().saveUpdated({ ...local, firstName: 'Новое имя' });
    store.getState().saveUpdated(makeUser({ id: 5, firstName: 'Серверная' }));

    expect(store.getState().created[0].firstName).toBe('Новое имя');
    expect(store.getState().updated[5].firstName).toBe('Серверная');
  });

  it('optimistic delete: пометка, повторная пометка без дублей, откат', () => {
    const store = createUsersStore();
    store.getState().markDeleted(5);
    store.getState().markDeleted(5);
    expect(store.getState().deletedIds).toEqual([5]);

    store.getState().restoreDeleted(5);
    expect(store.getState().deletedIds).toEqual([]);
  });

  it('удаление локальной записи и полный сброс', () => {
    const store = createUsersStore();
    const local = store.getState().addCreated(makeUser({ id: 209 }));
    store.getState().removeCreated(local.id);
    expect(store.getState().created).toEqual([]);

    store.getState().markDeleted(1);
    store.getState().reset();
    expect(store.getState()).toMatchObject({ created: [], updated: {}, deletedIds: [] });
  });
});
