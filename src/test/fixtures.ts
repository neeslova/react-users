import type { Viewer } from '@/schemas/auth';
import type { User } from '@/types/user';

/** Запись со всеми полями; в тесте переопределяются только важные для проверки */
export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 7,
    firstName: 'Ольга',
    lastName: 'Морозова',
    maidenName: '',
    age: 31,
    gender: 'female',
    birthDate: '1994-05-20',
    email: 'olga@example.ru',
    phone: '+7 900 123-45-67',
    username: 'olga.m',
    image: '',
    role: 'user',
    bloodGroup: 'A+',
    height: 168,
    weight: 60,
    eyeColor: 'Green',
    hair: { color: 'Brown', type: 'Straight' },
    university: 'МГУ',
    address: { address: 'ул. Ленина, 1', city: 'Москва', state: '', postalCode: '101000', country: 'Россия' },
    company: { name: 'ООО «Ромашка»', title: 'Аналитик', department: 'Маркетинг' },
    ...overrides,
  };
}

/** Текущие пользователи для проверки прав: по одному на роль */
export const viewers = {
  admin: { id: 1, username: 'emilys', name: 'Emily Johnson', email: 'emily@x.dummyjson.com', image: '', role: 'admin' },
  moderator: { id: 6, username: 'oliviaw', name: 'Olivia Wilson', email: 'olivia@x.dummyjson.com', image: '', role: 'moderator' },
  user: { id: 16, username: 'averyp', name: 'Avery Perez', email: 'avery@x.dummyjson.com', image: '', role: 'user' },
} satisfies Record<string, Viewer>;
