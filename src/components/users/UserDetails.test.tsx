import { act, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { useUsersStoreApi } from '@/stores/StoreProvider';
import { makeUser, viewers } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { UserDetails } from './UserDetails';

type UsersStoreApi = ReturnType<typeof useUsersStoreApi>;

/** Отдаёт тесту store, чтобы смоделировать изменения из другой части приложения */
function CaptureStore({ onStore }: { onStore: (store: UsersStoreApi) => void }) {
  const store = useUsersStoreApi();
  useEffect(() => {
    onStore(store);
  }, [store, onStore]);
  return null;
}

describe('UserDetails (профиль)', () => {
  it('показывает все разделы профиля и действия по роли', async () => {
    await renderWithProviders(
      <UserDetails serverUser={makeUser({ id: 7 })}>
        <p>Посты с сервера</p>
      </UserDetails>,
      { viewer: viewers.admin },
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Ольга Морозова' })).toBeInTheDocument();
    expect(screen.getByText('20 мая 1994')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '+7 900 123-45-67' })).toHaveAttribute('href', 'tel:+79001234567');
    expect(screen.getByText('МГУ')).toBeInTheDocument();
    expect(screen.getByText('Посты с сервера')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Изменить' })).toHaveAttribute('href', '/users/7/edit');
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
  });

  it('подставляет локальную версию записи и показывает, что запись удалена', async () => {
    let storeApi!: UsersStoreApi;
    await renderWithProviders(
      <>
        <CaptureStore onStore={(store) => (storeApi = store)} />
        <UserDetails serverUser={makeUser({ id: 7 })} />
      </>,
    );

    act(() => storeApi.getState().saveUpdated(makeUser({ id: 7, firstName: 'Ольга (изм.)' })));
    expect(screen.getByRole('heading', { level: 1, name: 'Ольга (изм.) Морозова' })).toBeInTheDocument();
    expect(screen.getByText('Изменён')).toBeInTheDocument();

    act(() => storeApi.getState().markDeleted(7));
    expect(screen.getByRole('heading', { name: 'Пользователь удалён' })).toBeInTheDocument();
  });
});
