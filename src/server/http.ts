import 'server-only';
import type { ApiErrorBody } from '@/types/api';
import { ServiceError, toErrorBody } from './errors';

/** Помощники для Route Handler'ов */

/**
 * Ошибка, выброшенная внутри функции с 'use cache', не кэшируется, но выходит
 * из кэша сериализованной — уже не экземпляром ServiceError. При чтении данных
 * это всегда сбой источника, поэтому GET-обработчики отвечают 502, а не 500.
 */
export const UPSTREAM_ERROR = { status: 502, message: 'Не удалось получить данные от DummyJSON' } as const;

export function errorResponse(error: unknown, fallback?: { status: number; message: string }) {
  if (fallback && !(error instanceof ServiceError)) {
    console.error(error);
    return Response.json({ message: fallback.message } satisfies ApiErrorBody, { status: fallback.status });
  }
  const { status, body } = toErrorBody(error);
  return Response.json(body, { status });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ServiceError('Тело запроса должно быть корректным JSON', 400);
  }
}
