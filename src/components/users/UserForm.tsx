'use client';

import { useEffect, useMemo, useReducer, useRef, useTransition, type FormEvent } from 'react';
import { GENDER_LABELS, GENDERS, ROLE_LABELS, ROLES } from '@/constants/user';
import { useUserMutations } from '@/hooks/useUserMutations';
import { toFieldErrors, userInputSchema, type UserInput } from '@/schemas/user';
import { useUiStore, useUsersStore } from '@/stores/StoreProvider';
import type { User } from '@/types/user';
import { toFormValues, type UserFormErrors, type UserFormValues } from '@/utils/userForm';
import { SelectField, TextField } from '../ui/FormField';
import { Modal } from '../ui/Modal';

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
      const serverErrors = { ...state.serverErrors };
      for (const field of Object.keys(action.patch)) delete serverErrors[field as keyof UserFormErrors];
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

/** Та же схема, что на сервере, + уникальность логина среди локальных записей (о них сервер не знает) */
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

interface UserFormProps {
  /** null — создание нового пользователя, User — редактирование */
  initialUser: User | null;
}

/**
 * Форма в модальном окне. Поля контролируемые; ошибки не хранятся в state,
 * а вычисляются из values при рендере, поэтому не рассинхронизируются.
 * Отправка — Server Function внутри transition: isPending блокирует форму
 * и не даёт закрыть окно, пока идёт запрос.
 */
export function UserForm({ initialUser }: UserFormProps) {
  const [state, dispatch] = useReducer(formReducer, initialUser, initFormState);
  const [isPending, startTransition] = useTransition();
  const { createUser, updateUser } = useUserMutations();
  const closeDialog = useUiStore((store) => store.closeDialog);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Логины локальных записей; свой логин при редактировании не считается занятым
  const created = useUsersStore((store) => store.created);
  const updated = useUsersStore((store) => store.updated);
  const takenUsernames = useMemo(() => {
    const set = new Set([...created, ...Object.values(updated)].map((user) => user.username.toLowerCase()));
    if (initialUser) set.delete(initialUser.username.toLowerCase());
    return set;
  }, [created, updated, initialUser]);

  // Фокус в первое поле после открытия окна
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
      const result = initialUser ? await updateUser(initialUser, input) : await createUser(input);
      if (result.ok) {
        closeDialog();
      } else {
        dispatch({ type: 'serverError', message: result.message, fieldErrors: result.fieldErrors ?? {} });
      }
    });
  };

  return (
    <Modal
      open
      title={initialUser ? 'Редактирование пользователя' : 'Новый пользователь'}
      onClose={closeDialog}
      dismissible={!isPending}
      wide
    >
      <form onSubmit={handleSubmit} noValidate>
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

        <div className="modal-action sticky -bottom-6 -mx-6 -mb-6 border-t border-base-300 bg-base-100 px-6 py-4">
          <button type="button" className="btn btn-ghost" onClick={closeDialog} disabled={isPending}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending && <span className="loading loading-spinner loading-sm" />}
            {isPending ? 'Сохранение…' : initialUser ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
