'use client';

import { LogIn } from 'lucide-react';
import { useActionState, useState, type FormEvent } from 'react';
import { ROLE_LABELS } from '@/constants/user';
import { loginSchema, type LoginInput } from '@/schemas/auth';
import { toFieldErrors } from '@/schemas/user';
import type { LoginState } from '@/types/auth';
import type { UserRole } from '@/types/user';
import { TextField } from '../ui/FormField';

/** Учётные записи DummyJSON (пароли публичные, из документации API) — по одной на роль */
export const DEMO_ACCOUNTS: { role: UserRole; username: string; password: string }[] = [
  { role: 'admin', username: 'emilys', password: 'emilyspass' },
  { role: 'moderator', username: 'oliviaw', password: 'oliviawpass' },
  { role: 'user', username: 'averyp', password: 'averyppass' },
];

const EMPTY: LoginInput = { username: '', password: '' };

interface LoginFormProps {
  /** Server Function входа; страница передаёт loginAction, тест — заглушку */
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
  /** Куда вернуться после входа (уже проверен на сервере) */
  callbackUrl: string;
}

/**
 * Форма входа на useActionState: отправка идёт в Server Function, а её ответ
 * (неверный пароль, ошибки полей) становится новым state формы.
 * Перед отправкой поля проверяет та же Zod-схема, что и сервер: при ошибке
 * onSubmit отменяет отправку, и запрос даже не уходит.
 */
export function LoginForm({ action, callbackUrl }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [values, setValues] = useState<LoginInput>(EMPTY);
  const [submitted, setSubmitted] = useState(false);

  const parsed = loginSchema.safeParse(values);
  const clientErrors = submitted && !parsed.success ? toFieldErrors(parsed.error) : {};
  const errors = { ...state.fieldErrors, ...clientErrors };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setSubmitted(true);
    if (!parsed.success) {
      event.preventDefault();
      return;
    }
    // FormData уже собрана из полей, поэтому пароль можно стереть сразу: он не останется
    // ни в состоянии формы, ни в скрытой копии страницы, которую Next хранит для «Назад»
    setValues((current) => ({ ...current, password: '' }));
    setSubmitted(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} onSubmit={handleSubmit} noValidate aria-label="Вход">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        {state.message && !isPending && (
          <div role="alert" className="alert alert-error alert-soft mb-3">
            {state.message}
          </div>
        )}

        <fieldset disabled={isPending} className="min-w-0">
          <TextField
            label="Логин"
            name="username"
            required
            value={values.username}
            onChange={(username) => setValues((current) => ({ ...current, username }))}
            error={errors.username}
            autoComplete="username"
            placeholder="emilys"
          />
          <TextField
            label="Пароль"
            name="password"
            type="password"
            required
            value={values.password}
            onChange={(password) => setValues((current) => ({ ...current, password }))}
            error={errors.password}
            autoComplete="current-password"
          />
        </fieldset>

        <button type="submit" className="btn btn-primary mt-4 w-full" disabled={isPending}>
          {isPending ? <span className="loading loading-spinner loading-sm" /> : <LogIn size={18} aria-hidden />}
          {isPending ? 'Вход…' : 'Войти'}
        </button>
      </form>

      <div className="rounded-box border border-dashed border-base-300 p-4">
        <p className="text-sm font-semibold">Тестовые учётные записи DummyJSON</p>
        <p className="mb-3 text-xs opacity-70">
          Нажмите, чтобы подставить логин и пароль. Удалять записи может только администратор.
        </p>
        <ul className="flex flex-col gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.username}>
              <button
                type="button"
                className="btn btn-sm btn-ghost w-full justify-between font-normal"
                onClick={() => setValues({ username: account.username, password: account.password })}
                disabled={isPending}
              >
                <span>{ROLE_LABELS[account.role]}</span>{' '}
                <span className="font-mono opacity-70">
                  {account.username} / {account.password}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
