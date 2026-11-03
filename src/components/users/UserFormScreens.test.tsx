import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserAction, updateUserAction } from '@/app/users/actions';
import { makeUser, viewers } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { Toaster } from '../ui/Toast';
import { CreateUserScreen, EditUserScreen } from './UserFormScreens';

vi.mock('@/app/users/actions', () => ({
  createUserAction: vi.fn(),
  updateUserAction: vi.fn(),
  deleteUserAction: vi.fn(),
}));
// Навигацию проверяем по вызову router.push: стаб роутера вместо настоящего
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push }),
}));

const field = (label: string) => screen.getByLabelText(new RegExp(`^${label}`));

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(field('Имя'), 'Иван');
  await user.type(field('Фамилия'), 'Петров');
  await user.type(field('Логин'), 'ivan');
  await user.type(field('Email'), 'ivan@example.ru');
  await user.type(field('Возраст'), '30');
}

describe('страницы добавления и изменения', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('добавление: корректная форма → Server Function, уведомление и возврат к списку', async () => {
    vi.mocked(createUserAction).mockResolvedValue({
      ok: true,
      data: makeUser({ id: 209, firstName: 'Иван', lastName: 'Петров' }),
    });
    const user = userEvent.setup();
    await renderWithProviders(
      <>
        <CreateUserScreen />
        <Toaster />
      </>,
      { viewer: viewers.user },
    );

    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(createUserAction).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ username: 'ivan', age: 30 }));
    expect(await screen.findByText('Пользователь Иван Петров добавлен')).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith('/users');
    // Next.js хранит состояние страницы для повторного захода, поэтому форма должна очиститься.
    // Сброс идёт в transition вместе с переходом — дожидаемся, пока React его применит
    await waitFor(() => expect(field('Имя')).toHaveValue(''));
  });

  it('добавление: отказ сервера (401) показывается в форме, перехода нет', async () => {
    vi.mocked(createUserAction).mockResolvedValue({
      ok: false,
      status: 401,
      message: 'Войдите в систему, чтобы выполнить это действие',
    });
    const user = userEvent.setup();
    await renderWithProviders(<CreateUserScreen />, { viewer: viewers.user });

    await fillRequired(user);
    await user.click(screen.getByRole('button', { name: 'Добавить' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Войдите в систему, чтобы выполнить это действие');
    expect(push).not.toHaveBeenCalled();
  });

  it('изменение: форма заполнена, сохранение вызывает updateUserAction(id, данные)', async () => {
    const serverUser = makeUser({ id: 5 });
    vi.mocked(updateUserAction).mockResolvedValue({
      ok: true,
      data: { ...serverUser, company: { ...serverUser.company, title: 'Тимлид' } },
    });
    const user = userEvent.setup();
    await renderWithProviders(<EditUserScreen id={5} serverUser={serverUser} />, { viewer: viewers.user });

    expect(screen.getByRole('heading', { name: 'Изменение: Ольга Морозова' })).toBeInTheDocument();
    await user.clear(field('Должность'));
    await user.type(field('Должность'), 'Тимлид');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(updateUserAction).toHaveBeenCalledExactlyOnceWith(5, expect.objectContaining({ companyTitle: 'Тимлид' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/users/5'));
  });

  it('изменение: записи нет ни на сервере, ни локально — сообщение вместо формы', async () => {
    await renderWithProviders(<EditUserScreen id={999} serverUser={null} />, { viewer: viewers.user });

    expect(screen.getByRole('heading', { name: 'Пользователь не найден' })).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });
});
