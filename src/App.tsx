import { useCallback, useMemo, useState } from 'react';
import { SearchX, UserPlus, UserRoundX } from 'lucide-react';
import { Header } from './components/layout/Header';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { EmptyState } from './components/ui/EmptyState';
import { Toast } from './components/ui/Toast';
import { DeleteUserDialog } from './components/users/DeleteUserDialog';
import { UserFormModal, type UserFormState } from './components/users/UserFormModal';
import { UserList } from './components/users/UserList';
import { UsersToolbar } from './components/users/UsersToolbar';
import { useDebounce } from './hooks/useDebounce';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { useUsers } from './hooks/useUsers';
import type { User, UserDraft } from './types/user';
import { plural } from './utils/format';
import {
  countByRole,
  DEFAULT_FILTERS,
  filterUsers,
  getFullName,
  hasActiveFilters,
  type UserFilters,
} from './utils/userFilters';

/**
 * Корневой компонент-контейнер: владеет состоянием страницы и передаёт
 * данные вниз через props, а изменения получает наверх через колбэки.
 * Сам почти ничего не рисует — только компонует дочерние компоненты.
 */
export default function App() {
  const { users, addUser, updateUser, deleteUser, resetUsers } = useUsers();
  const { isDark, toggleTheme } = useTheme();
  const { toast, showToast } = useToast();

  const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS);
  const [formState, setFormState] = useState<UserFormState>({ mode: 'closed' });
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Поиск применяется с задержкой, чтобы не фильтровать на каждый символ
  const debouncedQuery = useDebounce(filters.query, 250);
  const { role, sortBy, order } = filters;

  // Производные данные считаем при рендере (а не храним в state), кэшируя через useMemo
  const visibleUsers = useMemo(
    () => filterUsers(users, { query: debouncedQuery, role, sortBy, order }),
    [users, debouncedQuery, role, sortBy, order],
  );
  const roleCounts = useMemo(() => countByRole(users), [users]);
  const takenUsernames = useMemo(() => new Set(users.map((u) => u.username.toLowerCase())), [users]);

  // Стабильные колбэки (useCallback), чтобы memo(UserCard) не перерисовывал карточки зря
  const updateFilters = useCallback(
    (patch: Partial<UserFilters>) => setFilters((prev) => ({ ...prev, ...patch })),
    [],
  );
  const openCreate = useCallback(() => setFormState({ mode: 'create' }), []);
  const openEdit = useCallback((user: User) => setFormState({ mode: 'edit', user }), []);
  const closeForm = useCallback(() => setFormState({ mode: 'closed' }), []);
  const askDelete = useCallback((user: User) => setUserToDelete(user), []);

  const handleSubmit = (draft: UserDraft) => {
    if (formState.mode === 'edit') {
      updateUser(formState.user.id, draft);
      showToast(`Изменения для ${getFullName(draft)} сохранены`);
    } else {
      addUser(draft);
      showToast(`Пользователь ${getFullName(draft)} добавлен`);
    }
    closeForm();
  };

  const handleDelete = (user: User) => {
    deleteUser(user.id);
    setUserToDelete(null);
    showToast(`Пользователь ${getFullName(user)} удалён`, 'info');
  };

  const handleReset = () => {
    resetUsers();
    setFilters(DEFAULT_FILTERS);
    setIsResetOpen(false);
    showToast('Исходные данные восстановлены', 'info');
  };

  const renderContent = () => {
    if (users.length === 0) {
      return (
        <EmptyState
          icon={UserRoundX}
          title="Список пуст"
          description="Все пользователи удалены. Добавьте нового или верните исходные данные."
          action={
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <UserPlus size={18} /> Добавить пользователя
            </button>
          }
        />
      );
    }
    if (visibleUsers.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="Ничего не найдено"
          description="Попробуйте изменить запрос или выбрать другую роль."
          action={
            <button type="button" className="btn btn-outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Сбросить фильтры
            </button>
          }
        />
      );
    }
    return <UserList users={visibleUsers} onEdit={openEdit} onDelete={askDelete} />;
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Header
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onAddUser={openCreate}
        onResetData={() => setIsResetOpen(true)}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
        <UsersToolbar filters={filters} roleCounts={roleCounts} onChange={updateFilters} />

        {hasActiveFilters(filters) && visibleUsers.length > 0 && (
          <p className="text-sm opacity-70">
            {plural(visibleUsers.length, ['Найден', 'Найдено', 'Найдено'])} {visibleUsers.length}{' '}
            {plural(visibleUsers.length, ['пользователь', 'пользователя', 'пользователей'])}
          </p>
        )}

        {renderContent()}
      </main>

      <UserFormModal
        state={formState}
        takenUsernames={takenUsernames}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />
      <DeleteUserDialog user={userToDelete} onConfirm={handleDelete} onCancel={() => setUserToDelete(null)} />
      <ConfirmDialog
        open={isResetOpen}
        title="Вернуть исходные данные?"
        confirmLabel="Сбросить"
        onConfirm={handleReset}
        onCancel={() => setIsResetOpen(false)}
      >
        <p>Все добавленные, изменённые и удалённые записи будут заменены исходным списком пользователей.</p>
      </ConfirmDialog>

      <Toast toast={toast} />
    </div>
  );
}
