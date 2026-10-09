import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search, X } from 'lucide-react';
import { ROLE_PLURAL_LABELS, ROLES } from '../../constants/user';
import type { UserRole } from '../../types/user';
import type { SortField, UserFilters } from '../../utils/userFilters';

const SORT_LABELS: Record<SortField, string> = {
  id: 'По дате добавления',
  name: 'По имени',
  age: 'По возрасту',
};

interface UsersToolbarProps {
  filters: UserFilters;
  roleCounts: Record<UserRole | 'all', number>;
  onChange: (patch: Partial<UserFilters>) => void;
}

/**
 * Панель поиска, фильтра по роли и сортировки.
 * Состояние фильтров хранится в App (подъём состояния), здесь — только
 * отображение и колбэк onChange с изменёнными полями.
 */
export function UsersToolbar({ filters, roleCounts, onChange }: UsersToolbarProps) {
  const tabs: (UserRole | 'all')[] = ['all', ...ROLES];
  const isAsc = filters.order === 'asc';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="input w-full sm:flex-1">
          <Search size={16} className="opacity-50" />
          <input
            type="search"
            placeholder="Поиск по имени, логину, email или компании"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
          />
          {filters.query && (
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-circle"
              onClick={() => onChange({ query: '' })}
              aria-label="Очистить поиск"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <div className="join">
          <select
            className="select join-item w-full sm:w-52"
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value as SortField })}
            aria-label="Сортировка"
          >
            {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
              <option key={field} value={field}>
                {SORT_LABELS[field]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn join-item"
            onClick={() => onChange({ order: isAsc ? 'desc' : 'asc' })}
            title={isAsc ? 'По возрастанию' : 'По убыванию'}
            aria-label="Сменить направление сортировки"
          >
            {isAsc ? <ArrowUpNarrowWide size={18} /> : <ArrowDownWideNarrow size={18} />}
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-box w-fit max-w-full flex-nowrap overflow-x-auto">
        {tabs.map((role) => (
          <button
            key={role}
            type="button"
            role="tab"
            aria-selected={filters.role === role}
            className={`tab shrink-0 flex-nowrap gap-2 whitespace-nowrap ${filters.role === role ? 'tab-active' : ''}`}
            onClick={() => onChange({ role })}
          >
            {role === 'all' ? 'Все' : ROLE_PLURAL_LABELS[role]}
            <span className="badge badge-ghost badge-sm">{roleCounts[role]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
