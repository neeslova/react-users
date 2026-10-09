import type { Gender, User, UserDraft, UserRole } from '../types/user';

/**
 * Плоская модель формы: все поля — строки, как их отдают <input>.
 * В модель User они превращаются только при отправке (toUserDraft).
 */
export interface UserFormValues {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  age: string;
  gender: Gender;
  role: UserRole;
  birthDate: string;
  companyName: string;
  companyTitle: string;
  department: string;
  city: string;
  country: string;
}

export type UserFormErrors = Partial<Record<keyof UserFormValues, string>>;

export const EMPTY_FORM: UserFormValues = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phone: '',
  age: '',
  gender: 'female',
  role: 'user',
  birthDate: '',
  companyName: '',
  companyTitle: '',
  department: '',
  city: '',
  country: '',
};

/** dummyjson хранит дату как "1996-5-30", а <input type="date"> ждёт "1996-05-30" */
const toInputDate = (date: string) => {
  const [y, m, d] = date.split('-');
  if (!y || !m || !d) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

export const toFormValues = (user?: User | null): UserFormValues =>
  user
    ? {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        age: String(user.age),
        gender: user.gender,
        role: user.role,
        birthDate: toInputDate(user.birthDate),
        companyName: user.company.name,
        companyTitle: user.company.title,
        department: user.company.department,
        city: user.address.city,
        country: user.address.country,
      }
    : EMPTY_FORM;

/** Собирает объект для «отправки на сервер». Поля, которых нет в форме, берутся из base. */
export const toUserDraft = (values: UserFormValues, base?: User | null): UserDraft => ({
  maidenName: base?.maidenName ?? '',
  university: base?.university ?? '',
  image: base?.image ?? `https://dummyjson.com/icon/${values.username.trim()}/128`,
  firstName: values.firstName.trim(),
  lastName: values.lastName.trim(),
  username: values.username.trim(),
  email: values.email.trim(),
  phone: values.phone.trim(),
  age: Number(values.age),
  gender: values.gender,
  role: values.role,
  birthDate: values.birthDate,
  company: {
    name: values.companyName.trim(),
    title: values.companyTitle.trim(),
    department: values.department.trim(),
  },
  address: {
    city: values.city.trim(),
    state: base?.address.state ?? '',
    country: values.country.trim(),
  },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9._-]{3,20}$/i;

/**
 * @param takenUsernames логины других пользователей — username должен быть уникальным
 */
export function validateUserForm(
  values: UserFormValues,
  takenUsernames: ReadonlySet<string> = new Set(),
): UserFormErrors {
  const errors: UserFormErrors = {};
  const username = values.username.trim().toLowerCase();
  if (!values.firstName.trim()) errors.firstName = 'Введите имя';
  if (!values.lastName.trim()) errors.lastName = 'Введите фамилию';
  if (!USERNAME_RE.test(username))
    errors.username = 'Латиница, цифры, . _ - (от 3 до 20 символов)';
  else if (takenUsernames.has(username)) errors.username = 'Такой логин уже занят';
  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Некорректный email';
  const age = Number(values.age);
  if (!values.age || !Number.isInteger(age) || age < 1 || age > 120)
    errors.age = 'Возраст от 1 до 120';
  return errors;
}
