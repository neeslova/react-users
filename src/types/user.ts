/**
 * Типы предметной области «Users».
 * Повторяют формат https://dummyjson.com/docs/users (используется часть полей).
 * Сырые ответы API приводятся к этим типам на сервере (src/server/users.ts),
 * поэтому на клиент уходят только нужные поля.
 */

export type UserRole = 'admin' | 'moderator' | 'user';

export type Gender = 'male' | 'female';

export interface Address {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Company {
  name: string;
  title: string;
  department: string;
}

export interface Hair {
  color: string;
  type: string;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  maidenName: string;
  age: number;
  gender: Gender;
  birthDate: string;
  email: string;
  phone: string;
  username: string;
  image: string;
  role: UserRole;
  bloodGroup: string;
  height: number | null;
  weight: number | null;
  eyeColor: string;
  hair: Hair;
  university: string;
  address: Address;
  company: Company;
}

/** Страница списка в формате GET /users: пагинация через limit и skip */
export interface UsersPage {
  users: User[];
  total: number;
  skip: number;
  limit: number;
}

export type SortField = 'id' | 'name' | 'age';
export type SortOrder = 'asc' | 'desc';

/** Фильтры списка — хранятся в URL (?q=&role=&sort=&order=) */
export interface UserFilters {
  q: string;
  role: UserRole | 'all';
  sort: SortField;
  order: SortOrder;
}

/** Запрос одной страницы списка: фильтры + пагинация */
export interface UsersQuery extends UserFilters {
  skip: number;
  limit: number;
}

export interface UserPost {
  id: number;
  title: string;
  body: string;
  tags: string[];
  likes: number;
  dislikes: number;
  views: number;
}

export interface UserTodo {
  id: number;
  todo: string;
  completed: boolean;
}

export interface UsersStats {
  total: number;
  byRole: Record<UserRole, number>;
}
