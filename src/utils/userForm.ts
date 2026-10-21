import type { UserInput, UserInputField } from '@/schemas/user';
import type { Gender, User, UserRole } from '@/types/user';
import { toInputDate } from './format';

/**
 * Плоская модель формы: все поля — строки, как их отдают <input>.
 * Проверяет и приводит типы (age → number) схема userInputSchema.
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

export type UserFormErrors = Partial<Record<UserInputField, string>>;

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

/** Применяет проверенные данные формы к записи (поля, которых нет в форме, остаются как были) */
export const applyUserInput = (base: User, input: UserInput): User => ({
  ...base,
  firstName: input.firstName,
  lastName: input.lastName,
  username: input.username,
  email: input.email,
  phone: input.phone,
  age: input.age,
  gender: input.gender,
  role: input.role,
  birthDate: input.birthDate,
  company: {
    name: input.companyName,
    title: input.companyTitle,
    department: input.department,
  },
  address: { ...base.address, city: input.city, country: input.country },
});
