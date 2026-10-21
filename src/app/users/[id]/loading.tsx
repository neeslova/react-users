import { UserProfileSkeleton } from '@/components/users/UsersSkeletons';

/**
 * loading.tsx оборачивает page.tsx этого сегмента в <Suspense> с этим fallback:
 * скелетон показывается сразу при переходе, пока сервер готовит профиль.
 */
export default function UserLoading() {
  return <UserProfileSkeleton />;
}
