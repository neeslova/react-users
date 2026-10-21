/** Ошибки валидации по полям: { username: 'Такой логин уже занят' } */
export type FieldErrors = Record<string, string>;

/** Тело ответа с ошибкой у Route Handler'ов */
export interface ApiErrorBody {
  message: string;
  fieldErrors?: FieldErrors;
}

/**
 * Результат Server Function. Ожидаемые ошибки (валидация, 404) возвращаются
 * значением, а не исключением: экземпляр Error через границу сервер → клиент
 * не передаётся, а в production его сообщение ещё и скрывается.
 */
export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: FieldErrors };
