import { BackToListLink } from '@/components/users/BackToListLink';

/**
 * Layout профиля не читает params, поэтому остаётся статическим: ссылка «назад»
 * видна сразу, пока ниже показывается loading.tsx, и не перерисовывается
 * при переходе между профилями.
 */
export default function UserLayout({ children }: LayoutProps<'/users/[id]'>) {
  return (
    <div className="flex flex-col gap-4">
      <BackToListLink className="btn btn-ghost btn-sm -ml-2 w-fit" />
      {children}
    </div>
  );
}
