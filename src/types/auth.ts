import type { FieldErrors } from './api';

/** Действия, доступ к которым зависит от роли. Просмотр открыт всем, даже гостям */
export type Permission = 'users:create' | 'users:update' | 'users:delete';

/** Состояние формы входа (useActionState): ошибки после ответа Server Function */
export interface LoginState {
  message?: string;
  fieldErrors?: FieldErrors;
}
