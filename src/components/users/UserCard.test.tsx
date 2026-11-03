import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeUser, viewers } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  it('показывает переданные данные пользователя', async () => {
    const user = makeUser({ id: 42, role: 'moderator' });
    await renderWithProviders(<UserCard user={user} status="server" />);

    const card = screen.getByRole('article');
    expect(within(card).getByRole('link', { name: 'Ольга Морозова' })).toHaveAttribute('href', '/users/42');
    expect(within(card).getByText(/@olga\.m · 31 год/)).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'olga@example.ru' })).toHaveAttribute('href', 'mailto:olga@example.ru');
    expect(within(card).getByText('Аналитик')).toBeInTheDocument();
    expect(within(card).getByText('ООО «Ромашка»')).toBeInTheDocument();
    expect(within(card).getByText('Москва, Россия')).toBeInTheDocument();
    expect(within(card).getByText('Модератор')).toBeInTheDocument();
  });

  it('помечает запись, изменённую локально', async () => {
    await renderWithProviders(<UserCard user={makeUser()} status="updated" />);
    expect(screen.getByText('Изменён')).toBeInTheDocument();
  });

  it('гость не видит действий над записью', async () => {
    await renderWithProviders(<UserCard user={makeUser()} status="server" />);

    expect(screen.queryByRole('link', { name: 'Изменить' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Удалить' })).not.toBeInTheDocument();
  });

  it('обычный пользователь видит «Изменить», но не видит «Удалить»', async () => {
    await renderWithProviders(<UserCard user={makeUser({ id: 7 })} status="server" />, { viewer: viewers.user });

    expect(screen.getByRole('link', { name: 'Изменить' })).toHaveAttribute('href', '/users/7/edit');
    expect(screen.queryByRole('button', { name: 'Удалить' })).not.toBeInTheDocument();
  });

  it('администратор видит и «Изменить», и «Удалить»', async () => {
    await renderWithProviders(<UserCard user={makeUser()} status="server" />, { viewer: viewers.admin });

    expect(screen.getByRole('link', { name: 'Изменить' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
  });
});
