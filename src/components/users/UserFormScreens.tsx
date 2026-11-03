'use client';

import { UserRoundX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startTransition, useReducer, type ReactNode } from 'react';
import { useEditableUser, useTakenUsernames } from '@/hooks/useLocalUser';
import { useUserMutations } from '@/hooks/useUserMutations';
import type { UserInput } from '@/schemas/user';
import { useUiStore } from '@/stores/StoreProvider';
import type { User } from '@/types/user';
import { getFullName } from '@/utils/userFilters';
import { EmptyState } from '../ui/EmptyState';
import { BackToListLink } from './BackToListLink';
import { UserForm } from './UserForm';

/*
 * Клиентские части страниц /users/new и /users/[id]/edit: связывают форму
 * с мутациями (Server Functions + store) и навигацией. Права уже проверил
 * сервер при рендере страницы, а Server Function проверит их ещё раз.
 */

/**
 * Next.js хранит состояние посещённых страниц (React <Activity>): без сброса
 * при следующем открытии «Добавить» форма показала бы прошлый ввод.
 * leave() пересоздаёт форму (новый key) и уходит со страницы в одном
 * transition — пустая форма не мелькает до перехода.
 */
function useLeaveForm() {
  const router = useRouter();
  const [formKey, resetForm] = useReducer((key: number) => key + 1, 0);

  const leave = (href: string) =>
    startTransition(() => {
      resetForm();
      router.push(href);
    });

  return { formKey, leave };
}

function FormCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body gap-4">
        <div>
          <h1 className="text-2xl font-bold break-words">{title}</h1>
          <p className="text-sm opacity-70">{subtitle}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

export function CreateUserScreen() {
  const { formKey, leave } = useLeaveForm();
  const { createUser } = useUserMutations();
  const listHref = useUiStore((state) => state.listHref);
  const takenUsernames = useTakenUsernames(null);

  const handleSubmit = async (input: UserInput) => {
    const result = await createUser(input);
    if (result.ok) leave(listHref);
    return result;
  };

  return (
    <FormCard title="Новый пользователь" subtitle="Поля со звёздочкой обязательны. Данные проверяются в браузере и на сервере.">
      <UserForm
        key={formKey}
        initialUser={null}
        takenUsernames={takenUsernames}
        onSubmit={handleSubmit}
        onCancel={() => leave(listHref)}
      />
    </FormCard>
  );
}

interface EditUserScreenProps {
  id: number;
  /** Версия с сервера; null — на сервере записи нет (может быть создана локально) */
  serverUser: User | null;
}

export function EditUserScreen({ id, serverUser }: EditUserScreenProps) {
  const user = useEditableUser(id, serverUser);

  if (!user) {
    return (
      <EmptyState
        icon={UserRoundX}
        title="Пользователь не найден"
        description="Записи с таким id нет или она удалена в этой сессии — изменять нечего."
        action={<BackToListLink className="btn btn-primary" />}
      />
    );
  }

  // key: другая запись → новый экземпляр формы с чистым состоянием
  return <EditUserForm key={user.id} user={user} />;
}

function EditUserForm({ user }: { user: User }) {
  const { formKey, leave } = useLeaveForm();
  const { updateUser } = useUserMutations();
  const takenUsernames = useTakenUsernames(user);
  const profileHref = `/users/${user.id}`;

  const handleSubmit = async (input: UserInput) => {
    const result = await updateUser(user, input);
    if (result.ok) leave(profileHref);
    return result;
  };

  return (
    <FormCard title={`Изменение: ${getFullName(user)}`} subtitle={`@${user.username} · id ${user.id}`}>
      <UserForm
        key={formKey}
        initialUser={user}
        takenUsernames={takenUsernames}
        onSubmit={handleSubmit}
        onCancel={() => leave(profileHref)}
      />
    </FormCard>
  );
}
