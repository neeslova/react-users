import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteUserAction } from '@/app/users/actions';
import { makeUser, viewers } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { Toaster } from '../ui/Toast';
import { DeleteUserDialog } from './DeleteUserDialog';
import { UserActions } from './UserActions';

/*
 * Server Functions заменены моками: компонентный тест проверяет интерфейс
 * (что видно, что вызывается), а не сеть и сервер. Настоящую проверку прав
 * на сервере покрывают тесты src/server/*.test.ts.
 */
vi.mock('@/app/users/actions', () => ({
  createUserAction: vi.fn(),
  updateUserAction: vi.fn(),
  deleteUserAction: vi.fn(),
}));

const deleteMock = vi.mocked(deleteUserAction);

/** Кнопки + диалог подтверждения + уведомления — как в приложении */
function DeleteFlow({ id = 7 }: { id?: number }) {
  return (
    <>
      <UserActions user={makeUser({ id })} />
      <DeleteUserDialog />
      <Toaster />
    </>
  );
}

describe('UserActions + DeleteUserDialog', () => {
  beforeEach(() => {
    deleteMock.mockReset();
  });

  it('модератор не видит удаление: это право только администратора', async () => {
    await renderWithProviders(<DeleteFlow />, { viewer: viewers.moderator });

    expect(screen.getByRole('link', { name: 'Изменить' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Удалить' })).not.toBeInTheDocument();
  });

  it('администратор удаляет запись: подтверждение → вызов Server Function', async () => {
    deleteMock.mockResolvedValue({ ok: true, data: { id: 7 } });
    const user = userEvent.setup();
    await renderWithProviders(<DeleteFlow id={7} />, { viewer: viewers.admin });

    await user.click(screen.getByRole('button', { name: 'Удалить' }));
    const dialog = screen.getByRole('dialog', { name: 'Удалить пользователя?' });
    expect(within(dialog).getByText('Ольга Морозова')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Удалить' }));

    expect(deleteMock).toHaveBeenCalledExactlyOnceWith(7);
    expect(await screen.findByText('Пользователь Ольга Морозова удалён')).toBeInTheDocument();
  });

  it('отмена в диалоге ничего не удаляет', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<DeleteFlow />, { viewer: viewers.admin });

    await user.click(screen.getByRole('button', { name: 'Удалить' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Отмена' }));

    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('если сервер запретил удаление (403), показывает понятную причину', async () => {
    deleteMock.mockResolvedValue({ ok: false, status: 403, message: 'Удалять пользователей может только администратор' });
    const user = userEvent.setup();
    await renderWithProviders(<DeleteFlow />, { viewer: viewers.admin });

    await user.click(screen.getByRole('button', { name: 'Удалить' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Удалить' }));

    expect(
      await screen.findByText('Не удалось удалить Ольга Морозова: Удалять пользователей может только администратор'),
    ).toBeInTheDocument();
  });
});
