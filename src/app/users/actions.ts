'use server';

import { updateTag } from 'next/cache';
import { toFailure } from '@/server/errors';
import { createUser, deleteUser, updateUser, USERS_TAG, userTag } from '@/server/users';
import type { MutationResult } from '@/types/api';
import type { User } from '@/types/user';

/*
 * Server Functions (Server Actions) — мутации из интерфейса.
 * Клиент импортирует их как обычные async-функции, а сборщик подменяет
 * тело на сетевой вызов (POST к текущей странице). Код выполняется только
 * на сервере, поэтому аргументы — недоверенные данные: их проверяет сервис.
 *
 * Логика общая с Route Handler'ами (src/server/users.ts). Отличается только
 * инвалидация: updateTag (read-your-own-writes) есть только в Server Functions.
 * DummyJSON изменения не сохраняет, поэтому повторное чтение вернёт исходные
 * данные; результат мутации клиент дополнительно сохраняет в store.
 */

export async function createUserAction(input: unknown): Promise<MutationResult<User>> {
  try {
    const user = await createUser(input);
    updateTag(USERS_TAG);
    return { ok: true, data: user };
  } catch (error) {
    return toFailure(error);
  }
}

export async function updateUserAction(id: number, input: unknown): Promise<MutationResult<User>> {
  try {
    const user = await updateUser(id, input);
    updateTag(USERS_TAG);
    updateTag(userTag(user.id));
    return { ok: true, data: user };
  } catch (error) {
    return toFailure(error);
  }
}

export async function deleteUserAction(id: number): Promise<MutationResult<{ id: number }>> {
  try {
    const { id: deletedId } = await deleteUser(id);
    updateTag(USERS_TAG);
    updateTag(userTag(deletedId));
    return { ok: true, data: { id: deletedId } };
  } catch (error) {
    return toFailure(error);
  }
}
