import { UserFormSkeleton } from '@/components/users/UsersSkeletons';

/** Скелетон формы, а не профиля (loading.tsx сегмента [id]), пока открывается страница изменения */
export default function EditUserLoading() {
  return <UserFormSkeleton />;
}
