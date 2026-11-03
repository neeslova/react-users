import 'server-only';
import type { ApiErrorBody, FieldErrors, MutationResult } from '@/types/api';

/**
 * Ожидаемая ошибка слоя данных: HTTP-статус (для Route Handler)
 * и сообщение, которое можно показать пользователю.
 */
export class ServiceError extends Error {
  readonly status: number;
  readonly fieldErrors?: FieldErrors;

  constructor(message: string, status: number, fieldErrors?: FieldErrors, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ServiceError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Любая ошибка → статус и тело ответа. Неожиданные ошибки логируются, детали наружу не отдаются */
export function toErrorBody(error: unknown): { status: number; body: ApiErrorBody } {
  if (error instanceof ServiceError) {
    return { status: error.status, body: { message: error.message, fieldErrors: error.fieldErrors } };
  }
  console.error(error);
  return { status: 500, body: { message: 'Внутренняя ошибка сервера' } };
}

/** Для Server Functions: ошибка → сериализуемый результат { ok: false } */
export function toFailure(error: unknown): Extract<MutationResult<never>, { ok: false }> {
  const { status, body } = toErrorBody(error);
  return { ok: false, status, ...body };
}
