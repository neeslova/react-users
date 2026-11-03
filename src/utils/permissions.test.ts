import { describe, expect, it } from 'vitest';
import { can } from './permissions';

describe('can — матрица прав', () => {
  it('гость только смотрит', () => {
    expect(can(null, 'users:create')).toBe(false);
    expect(can(undefined, 'users:update')).toBe(false);
    expect(can(null, 'users:delete')).toBe(false);
  });

  it.each(['user', 'moderator'] as const)('%s создаёт и изменяет, но не удаляет', (role) => {
    expect(can(role, 'users:create')).toBe(true);
    expect(can(role, 'users:update')).toBe(true);
    expect(can(role, 'users:delete')).toBe(false);
  });

  it('администратор может всё', () => {
    expect(can('admin', 'users:delete')).toBe(true);
  });
});
