'use client';

import { useEffect, useMemo, useReducer, useRef, useTransition, type FormEvent } from 'react';
import { GENDER_LABELS, GENDERS, ROLE_LABELS, ROLES } from '@/constants/user';
import { toFieldErrors, userInputSchema, type UserInput } from '@/schemas/user';
import type { MutationResult } from '@/types/api';
import type { User } from '@/types/user';
import { toFormValues, type UserFormErrors, type UserFormValues } from '@/utils/userForm';
import { SelectField, TextField } from '../ui/FormField';

// ---------- Состояние формы: useReducer ----------

interface FormState {
  values: UserFormValues;
  /** После первой попытки отправки ошибки показываются сразу при вводе */
  submitted: boolean;
  /** Ошибки, которые вернул сервер (например, «логин занят») */
  serverErrors: UserFormErrors;
  serverMessage: string | null;
}

type FormAction =
  | { type: 'change'; patch: Partial<UserFormValues> }
  | { type: 'submit' }
  | { type: 'serverError'; message: string; fieldErrors: UserFormErrors };

/**
 * Reducer — чистая функция (state, action) → новый state: без мутаций,
 * запросов и других побочных эффектов. Все переходы состояния формы описаны
 * в одном месте; например, правка поля одновременно меняет значение
 * и убирает устаревшую серверную ошибку этого поля.
 */
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'change': {
      // Ошибка сервера по полю устаревает, как только поле поправили
      const serverErrors = Object.fromEntries(
        Object.entries(state.serverErrors).filter(([field]) => !(field in action.patch)),
      );
      return { ...state, values: { ...state.values, ...action.patch }, serverErrors, serverMessage: null };
    }
    case 'submit':
      return { ...state, submitted: true, serverMessage: null };
    case 'serverError':
      return { ...state, serverErrors: action.fieldErrors, serverMessage: action.message };
  }
}

const initFormState = (user: User | null): FormState => ({
  values: toFormValues(user),
  submitted: false,
  serverErrors: {},
  serverMessage: null,
});

/**
 * Та же схема, что на сервере (поля + правило «администратор — от 18 лет»),
 * + уникальность логина среди локальных записей (о них сервер не знает)
 */
function validate(values: UserFormValues, takenUsernames: ReadonlySet<string>) {
  const result = userInputSchema.safeParse(values);
  const errors: UserFormErrors = result.success ? {} : toFieldErrors(result.error);
  if (!errors.username && takenUsernames.has(values.username.trim().toLowerCase())) {
    errors.username = 'Такой логин уже занят';
  }
  const input: UserInput | null = result.success && Object.keys(errors).length === 0 ? result.data : null;
  return { errors, input };
}

// ---------- Компонент ----------

const NO_TAKEN_USERNAMES: ReadonlySet<string> = new Set();

interface UserFormProps {
  /** null — создание нового пользователя, User — редактирование */
  initialUser: User | null;
  /**
   * Отправка проверенных данных. Вызывается, только если схема пропустила ввод.
   * Ошибки из результата (по полям и общая) показываются в форме.
   */
  onSubmit: (input: UserInput) => Promise<MutationResult<unknown>>;
  onCancel: () => void;
  /** Логины, занятые локальными записями (в нижнем регистре) */
  takenUsernames?: ReadonlySet<string>;
}

/**
 * Форма пользователя. Поля контролируемые; ошибки не хранятся в state,
 * а вычисляются из values при рендере, поэтому не рассинхронизируются.
 * Ошибки Zod показываются рядом с полями после первой попытки отправки.
 * Отправка — внутри transition: isPending блокирует поля и кнопки, пока идёт запрос.
 *
 * Компонент не знает, куда уходят данные (Server Function, тест), — это решает
 * родитель через onSubmit. Поэтому форму легко проверить компонентным тестом.
 */
export function UserForm({ initialUser, onSubmit, onCancel, takenUsernames = NO_TAKEN_USERNAMES }: UserFormProps) {
  const [state, dispatch] = useReducer(formReducer, initialUser, initFormState);
  const [isPending, startTransition] = useTransition();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Фокус в первое поле при открытии страницы формы
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  const clientErrors = useMemo(() => validate(state.values, takenUsernames).errors, [state.values, takenUsernames]);
  const errors: UserFormErrors = state.submitted ? { ...clientErrors, ...state.serverErrors } : state.serverErrors;

  const setField = <K extends keyof UserFormValues>(field: K, value: UserFormValues[K]) =>
    dispatch({ type: 'change', patch: { [field]: value } });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: 'submit' });
    const { input } = validate(state.values, takenUsernames);
    if (!input) return;

    startTransition(async () => {
      const result = await onSubmit(input);
      if (!result.ok) {
        dispatch({ type: 'serverError', message: result.message, fieldErrors: result.fieldErrors ?? {} });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label={initialUser ? 'Изменение пользователя' : 'Новый пользователь'}>
      {state.serverMessage && (
        <div role="alert" className="alert alert-error alert-soft mb-3">
          {state.serverMessage}
        </div>
      )}

      <fieldset disabled={isPending} className="min-w-0">
        <h4 className="text-sm font-semibold tracking-wide uppercase opacity-60">Основное</h4>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextField
            ref={firstFieldRef}
            label="Имя"
            required
            value={state.values.firstName}
            onChange={(value) => setField('firstName', value)}
            error={errors.firstName}
            autoComplete="given-name"
          />
          <TextField
            label="Фамилия"
            required
            value={state.values.lastName}
            onChange={(value) => setField('lastName', value)}
            error={errors.lastName}
            autoComplete="family-name"
          />
          <TextField
            label="Логин"
            required
            value={state.values.username}
            onChange={(value) => setField('username', value)}
            error={errors.username}
            placeholder="ivanov"
            autoComplete="off"
          />
          <TextField
            label="Возраст"
            required
            type="number"
            value={state.values.age}
            onChange={(value) => setField('age', value)}
            error={errors.age}
          />
          <SelectField
            label="Пол"
            value={state.values.gender}
            options={GENDERS}
            getLabel={(gender) => GENDER_LABELS[gender]}
            onChange={(value) => setField('gender', value)}
          />
          <SelectField
            label="Роль"
            value={state.values.role}
            options={ROLES}
            getLabel={(role) => ROLE_LABELS[role]}
            onChange={(value) => setField('role', value)}
          />
          <TextField
            label="Дата рождения"
            type="date"
            value={state.values.birthDate}
            onChange={(value) => setField('birthDate', value)}
            error={errors.birthDate}
          />
        </div>

        <h4 className="mt-4 text-sm font-semibold tracking-wide uppercase opacity-60">Контакты</h4>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextField
            label="Email"
            required
            type="email"
            value={state.values.email}
            onChange={(value) => setField('email', value)}
            error={errors.email}
            placeholder="name@example.ru"
            autoComplete="email"
          />
          <TextField
            label="Телефон"
            type="tel"
            value={state.values.phone}
            onChange={(value) => setField('phone', value)}
            error={errors.phone}
            placeholder="+7 900 000-00-00"
            autoComplete="tel"
          />
          <TextField
            label="Город"
            value={state.values.city}
            onChange={(value) => setField('city', value)}
            error={errors.city}
          />
          <TextField
            label="Страна"
            value={state.values.country}
            onChange={(value) => setField('country', value)}
            error={errors.country}
          />
        </div>

        <h4 className="mt-4 text-sm font-semibold tracking-wide uppercase opacity-60">Работа</h4>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextField
            label="Компания"
            value={state.values.companyName}
            onChange={(value) => setField('companyName', value)}
            error={errors.companyName}
          />
          <TextField
            label="Должность"
            value={state.values.companyTitle}
            onChange={(value) => setField('companyTitle', value)}
            error={errors.companyTitle}
          />
          <TextField
            label="Отдел"
            value={state.values.department}
            onChange={(value) => setField('department', value)}
            error={errors.department}
          />
        </div>
      </fieldset>

      <div className="mt-6 flex justify-end gap-2 border-t border-base-300 pt-4">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isPending}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending && <span className="loading loading-spinner loading-sm" />}
          {isPending ? 'Сохранение…' : initialUser ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </form>
  );
}
