import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { GENDER_LABELS, GENDERS, ROLE_LABELS, ROLES } from '../../constants/user';
import type { User, UserDraft } from '../../types/user';
import {
  toFormValues,
  toUserDraft,
  validateUserForm,
  type UserFormValues,
} from '../../utils/userForm';
import { SelectField, TextField } from '../ui/FormField';

interface UserFormProps {
  /** null — создание нового пользователя, User — редактирование */
  initialUser: User | null;
  /** Логины всех пользователей (в нижнем регистре) для проверки уникальности */
  takenUsernames: ReadonlySet<string>;
  onSubmit: (draft: UserDraft) => void;
  onCancel: () => void;
}

/**
 * Форма создания/редактирования. Все поля контролируемые: значение
 * хранится в state, input только отображает его и сообщает об изменениях.
 *
 * Ошибки не хранятся отдельно в state — они вычисляются из values при
 * каждом рендере (производные данные), поэтому не могут рассинхронизироваться.
 */
export function UserForm({ initialUser, takenUsernames, onSubmit, onCancel }: UserFormProps) {
  // Ленивая инициализация: toFormValues вызовется только при монтировании
  const [values, setValues] = useState<UserFormValues>(() => toFormValues(initialUser));
  const [submitted, setSubmitted] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // useRef + useEffect: поставить фокус в первое поле после монтирования
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  // Свой логин при редактировании не считается занятым
  const otherUsernames = useMemo(() => {
    const set = new Set(takenUsernames);
    if (initialUser) set.delete(initialUser.username.toLowerCase());
    return set;
  }, [takenUsernames, initialUser]);

  const errors = submitted ? validateUserForm(values, otherUsernames) : {};

  /** Универсальный сеттер поля: тип value зависит от выбранного ключа */
  const setField = <K extends keyof UserFormValues>(field: K, value: UserFormValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    const currentErrors = validateUserForm(values, otherUsernames);
    if (Object.keys(currentErrors).length > 0) return;
    onSubmit(toUserDraft(values, initialUser));
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h4 className="text-sm font-semibold uppercase tracking-wide opacity-60">Основное</h4>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <TextField
          ref={firstFieldRef}
          label="Имя"
          required
          value={values.firstName}
          onChange={(v) => setField('firstName', v)}
          error={errors.firstName}
          autoComplete="given-name"
        />
        <TextField
          label="Фамилия"
          required
          value={values.lastName}
          onChange={(v) => setField('lastName', v)}
          error={errors.lastName}
          autoComplete="family-name"
        />
        <TextField
          label="Логин"
          required
          value={values.username}
          onChange={(v) => setField('username', v)}
          error={errors.username}
          placeholder="ivanov"
          autoComplete="off"
        />
        <TextField
          label="Возраст"
          required
          type="number"
          value={values.age}
          onChange={(v) => setField('age', v)}
          error={errors.age}
        />
        <SelectField
          label="Пол"
          value={values.gender}
          options={GENDERS}
          getLabel={(g) => GENDER_LABELS[g]}
          onChange={(v) => setField('gender', v)}
        />
        <SelectField
          label="Роль"
          value={values.role}
          options={ROLES}
          getLabel={(r) => ROLE_LABELS[r]}
          onChange={(v) => setField('role', v)}
        />
        <TextField
          label="Дата рождения"
          type="date"
          value={values.birthDate}
          onChange={(v) => setField('birthDate', v)}
        />
      </div>

      <h4 className="mt-4 text-sm font-semibold uppercase tracking-wide opacity-60">Контакты</h4>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <TextField
          label="Email"
          required
          type="email"
          value={values.email}
          onChange={(v) => setField('email', v)}
          error={errors.email}
          placeholder="name@example.ru"
          autoComplete="email"
        />
        <TextField
          label="Телефон"
          type="tel"
          value={values.phone}
          onChange={(v) => setField('phone', v)}
          placeholder="+7 900 000-00-00"
          autoComplete="tel"
        />
        <TextField label="Город" value={values.city} onChange={(v) => setField('city', v)} />
        <TextField label="Страна" value={values.country} onChange={(v) => setField('country', v)} />
      </div>

      <h4 className="mt-4 text-sm font-semibold uppercase tracking-wide opacity-60">Работа</h4>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <TextField label="Компания" value={values.companyName} onChange={(v) => setField('companyName', v)} />
        <TextField label="Должность" value={values.companyTitle} onChange={(v) => setField('companyTitle', v)} />
        <TextField label="Отдел" value={values.department} onChange={(v) => setField('department', v)} />
      </div>

      <div className="modal-action sticky -bottom-6 -mx-6 -mb-6 border-t border-base-300 bg-base-100 px-6 py-4">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary">
          {initialUser ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </form>
  );
}
