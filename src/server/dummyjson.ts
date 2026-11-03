import 'server-only';
import type { z } from 'zod';
import { env } from './env';
import { ServiceError } from './errors';

/*
 * Низкоуровневый HTTP-клиент DummyJSON. Импорт 'server-only' гарантирует,
 * что модуль не попадёт в клиентский бандл: при импорте из Client Component
 * сборка упадёт с ошибкой. Адрес API и задержка берутся из проверенного env.
 *
 * Каждый вызов передаёт Zod-схему ожидаемого ответа: JSON от внешнего сервиса —
 * недоверенные данные, и вместо утверждения `as T` ответ проверяется во время выполнения.
 */

const TIMEOUT_MS = 10_000;

type QueryValue = string | number | undefined;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  headers?: Record<string, string>;
}

/** Аватар-заглушка DummyJSON по логину (для новых записей и записей без картинки) */
export const avatarUrl = (username: string) =>
  `https://dummyjson.com/icon/${encodeURIComponent(username || 'user')}/128`;

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Сервер DummyJSON отклонил запрос',
  401: 'DummyJSON не принял учётные данные',
  404: 'Запись не найдена на сервере',
};

export async function dummyFetch<S extends z.ZodType>(
  path: string,
  schema: S,
  { method = 'GET', query, body, headers }: RequestOptions = {},
): Promise<z.output<S>> {
  const url = new URL(`${env.DUMMYJSON_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  // DummyJSON умеет задерживать ответ: ?delay=1000 — удобно, чтобы показать состояния загрузки
  if (env.DUMMYJSON_DELAY_MS > 0) url.searchParams.set('delay', String(env.DUMMYJSON_DELAY_MS));

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (cause) {
    const timedOut = cause instanceof DOMException && cause.name === 'TimeoutError';
    throw timedOut
      ? new ServiceError('DummyJSON не ответил вовремя, попробуйте ещё раз', 504, undefined, { cause })
      : new ServiceError('Не удалось связаться с DummyJSON. Проверьте подключение к интернету', 502, undefined, { cause });
  }

  if (!response.ok) {
    const status = [400, 401, 404].includes(response.status) ? response.status : 502;
    throw new ServiceError(STATUS_MESSAGES[status] ?? `DummyJSON ответил ошибкой ${response.status}`, status);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (cause) {
    throw new ServiceError('DummyJSON вернул ответ не в формате JSON', 502, undefined, { cause });
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    // Подробности — в лог сервера, пользователю — понятное сообщение без внутренностей
    console.error(`Неожиданный ответ DummyJSON ${method} ${path}:`, result.error.issues);
    throw new ServiceError('DummyJSON вернул данные в неожиданном формате', 502, undefined, { cause: result.error });
  }
  return result.data;
}
