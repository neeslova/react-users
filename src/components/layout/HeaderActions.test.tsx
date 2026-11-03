import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StoreProvider, useUiStoreApi, useUsersStoreApi } from '@/stores/StoreProvider';
import { makeUser } from '@/test/fixtures';
import { ResetChangesDialog } from '../users/DeleteUserDialog';
import { LocalChangesButton, SyncIndicator } from './HeaderActions';
import { ThemeToggle } from './ThemeToggle';

vi.mock('@/app/users/actions', () => ({ deleteUserAction: vi.fn() }));

type Stores = { users: ReturnType<typeof useUsersStoreApi>; ui: ReturnType<typeof useUiStoreApi> };

/** Отдаёт тесту store'ы, чтобы смоделировать изменения из других частей приложения */
function CaptureStores({ onStores }: { onStores: (stores: Stores) => void }) {
  const users = useUsersStoreApi();
  const ui = useUiStoreApi();
  useEffect(() => {
    onStores({ users, ui });
  }, [users, ui, onStores]);
  return null;
}

function renderHeaderActions() {
  let stores!: Stores;
  render(
    <StoreProvider>
      <CaptureStores onStores={(value) => (stores = value)} />
      <SyncIndicator />
      <LocalChangesButton />
      <ResetChangesDialog />
    </StoreProvider>,
  );
  return stores;
}

describe('кнопки шапки', () => {
  it('счётчик локальных изменений появляется после правок и сбрасывает их', async () => {
    const user = userEvent.setup();
    const stores = renderHeaderActions();
    expect(screen.queryByRole('button', { name: /Изменения/ })).not.toBeInTheDocument();

    act(() => {
      stores.users.getState().addCreated(makeUser({ id: 209 }));
      stores.users.getState().markDeleted(5);
    });
    await user.click(screen.getByRole('button', { name: /Изменения\s*2/ }));
    await user.click(within(screen.getByRole('dialog', { name: 'Сбросить локальные изменения?' })).getByRole('button', { name: 'Сбросить' }));

    expect(stores.users.getState()).toMatchObject({ created: [], deletedIds: [] });
    expect(screen.queryByRole('button', { name: /Изменения/ })).not.toBeInTheDocument();
  });

  it('индикатор «Сохранение…» виден, пока идёт отправка мутации', () => {
    const stores = renderHeaderActions();
    expect(screen.queryByText('Сохранение…')).not.toBeInTheDocument();

    act(() => stores.ui.getState().mutationStarted());
    expect(screen.getByRole('status')).toHaveTextContent('Сохранение…');

    act(() => stores.ui.getState().mutationFinished());
    expect(screen.queryByText('Сохранение…')).not.toBeInTheDocument();
  });
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom не умеет медиа-запросы: стаб — системная тема светлая
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('переключает тему и запоминает выбор', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('corporate');

    await user.click(screen.getByRole('button', { name: 'Сменить тему' }));
    expect(document.documentElement.dataset.theme).toBe('business');
    expect(localStorage.getItem('users-lab:theme')).toBe('business');

    await user.click(screen.getByRole('button', { name: 'Сменить тему' }));
    expect(document.documentElement.dataset.theme).toBe('corporate');
  });

  it('восстанавливает сохранённую тему', () => {
    localStorage.setItem('users-lab:theme', 'business');
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('business');
  });
});
