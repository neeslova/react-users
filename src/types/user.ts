/**
 * Типы предметной области «Users».
 * Повторяют формат https://dummyjson.com/docs/users (используется часть полей),
 * чтобы в следующих работах можно было подключить реальное API без переделки компонентов.
 */

export type UserRole = 'admin' | 'moderator' | 'user';

export type Gender = 'male' | 'female';

export interface Address {
  city: string;
  state: string;
  country: string;
}

export interface Company {
  name: string;
  title: string;
  department: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  maidenName: string;
  age: number;
  gender: Gender;
  email: string;
  phone: string;
  username: string;
  birthDate: string;
  image: string;
  university: string;
  address: Address;
  company: Company;
  role: UserRole;
}

/** Ответ списка пользователей: GET /users */
export interface UsersResponse {
  users: User[];
  total: number;
  skip: number;
  limit: number;
}

/** Данные нового пользователя (тело запроса POST /users/add) — id выдаёт «сервер». */
export type UserDraft = Omit<User, 'id'>;
