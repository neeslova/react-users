import { Moon, RotateCcw, Sun, UserPlus, Users } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onAddUser: () => void;
  onResetData: () => void;
}

export function Header({ isDark, onToggleTheme, onAddUser, onResetData }: HeaderProps) {
  return (
    <header className="navbar sticky top-0 z-30 border-b border-base-300 bg-base-100/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-2 sm:px-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="grid size-10 place-items-center rounded-field bg-primary text-primary-content">
            <Users size={22} />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-bold">Пользователи</h1>
            <p className="hidden text-xs opacity-60 sm:block">Управление списком пользователей</p>
          </div>
        </div>

        <div className="tooltip tooltip-bottom" data-tip="Вернуть исходные данные">
          <button type="button" className="btn btn-ghost btn-square" onClick={onResetData} aria-label="Сбросить данные">
            <RotateCcw size={18} />
          </button>
        </div>
        <div className="tooltip tooltip-bottom" data-tip={isDark ? 'Светлая тема' : 'Тёмная тема'}>
          <button type="button" className="btn btn-ghost btn-square" onClick={onToggleTheme} aria-label="Сменить тему">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <button type="button" className="btn btn-primary" onClick={onAddUser}>
          <UserPlus size={18} />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>
    </header>
  );
}
