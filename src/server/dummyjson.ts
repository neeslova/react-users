import 'server-only';
import { ServiceError } from './errors';

/*
 * Низкоуровневый HTTP-клиент DummyJSON. Импорт 'server-only' гарантирует,
 * что модуль не попадёт в клиентский бандл: при импорте из Client Component
 * сборка упадёт с ошибкой. Адрес API и задержка задаются переменными окружения.
 */

const BASE_URL = (process.env.DUMMYJSON_URL ?? 'https://dummyjson.com').replace(/\/$/, '');
const DELAY_MS = Math.min(Math.max(Number(process.env.DUMMYJSON_DELAY_MS) || 0, 0), 5000);
const TIMEOUT_MS = 10_000;

type QueryValue = string | number | undefined;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Сервер DummyJSON отклонил запрос',
  404: 'Запись не найдена на сервере',
};

export async function dummyFetch<T>(path: string, { method = 'GET', query, body }: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  // DummyJSON умеет задерживать ответ: ?delay=1000 — удобно, чтобы показать состояния загрузки
  if (DELAY_MS > 0) url.searchParams.set('delay', String(DELAY_MS));

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
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
    const status = response.status === 400 || response.status === 404 ? response.status : 502;
    throw new ServiceError(STATUS_MESSAGES[status] ?? `DummyJSON ответил ошибкой ${response.status}`, status);
  }
  return (await response.json()) as T;
}
