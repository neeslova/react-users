'use client';

import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search, X } from 'lucide-react';
import { useState } from 'react';
import { parseUserFilters } from '@/schemas/user';
import { ROLE_PLURAL_LABELS, ROLES, SEARCH_DEBOUNCE_MS, SORT_FIELDS, SORT_LABELS } from '@/constants/user';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { useUserFilters } from '@/hooks/useUserFilters';
import type { SortField, UserRole } from '@/types/user';

const TABS: (UserRole | 'all')[] = ['all', ...ROLES];

/**
 * Поиск, фильтр по роли и сортировка. Состояние — в URL (useUserFilters),
 * локально хранится только текст поля, пока пользователь печатает.
 */
export function UsersToolbar() {
  const { filters, setFilters } = useUserFilters();
  const [query, setQuery] = useState(filters.q);
  const [urlQuery, setUrlQuery] = useState(filters.q);

  // q в URL изменился. Если он не совпадает с полем — его поменяли извне
  // («Сбросить фильтры», ссылка в шапке): подтягиваем значение в поле.
  // Обновление состояния во время рендера по изменившемуся входу — приём из документации React
  // (вместо useEffect, который сначала отрисовал бы устаревшее значение).
  if (filters.q !== urlQuery) {
    setUrlQuery(filters.q);
    if (filters.q !== query.trim()) setQuery(filters.q);
  }

  const [pushQuery, cancelPushQuery] = useDebouncedCallback((value: string, scheduledFor: string) => {
    // Пока ждали, фильтры сбросили — устаревший ввод в URL не пишем
    if (parseUserFilters(new URLSearchParams(window.location.search)).q !== scheduledFor) return;
    setFilters({ q: value.trim() });
  }, SEARCH_DEBOUNCE_MS);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    pushQuery(value, parseUserFilters(new URLSearchParams(window.location.search)).q);
  };

  const clearQuery = () => {
    cancelPushQuery();
    setQuery('');
    setFilters({ q: '' });
  };

  const isTyping = query.trim() !== filters.q;
  const isAsc = filters.order === 'asc';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="input w-full sm:flex-1">
          {isTyping ? (
            <span className="loading loading-spinner loading-xs opacity-50" aria-hidden />
          ) : (
            <Search size={16} className="opacity-50" aria-hidden />
          )}
          <input
            type="text"
            enterKeyHint="search"
            placeholder="Поиск по имени, фамилии, логину или email"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            aria-label="Поиск пользователей"
          />
          {query && (
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-circle"
              onClick={clearQuery}
              aria-label="Очистить поиск"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <div className="join">
          <select
            className="select join-item w-full sm:w-52"
            value={filters.sort}
            onChange={(event) => setFilters({ sort: event.target.value as SortField })}
            aria-label="Сортировка"
          >
            {SORT_FIELDS.map((field) => (
              <option key={field} value={field}>
                {SORT_LABELS[field]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn join-item border-base-300 bg-base-100"
            onClick={() => setFilters({ order: isAsc ? 'desc' : 'asc' })}
            title={isAsc ? 'По возрастанию' : 'По убыванию'}
            aria-label={isAsc ? 'По возрастанию, сменить на убывание' : 'По убыванию, сменить на возрастание'}
          >
            {isAsc ? <ArrowUpNarrowWide size={18} /> : <ArrowDownWideNarrow size={18} />}
          </button>
        </div>
      </div>

      <div role="tablist" aria-label="Роль" className="tabs tabs-box w-fit max-w-full flex-nowrap overflow-x-auto">
        {TABS.map((role) => (
          <button
            key={role}
            type="button"
            role="tab"
            aria-selected={filters.role === role}
            className={`tab shrink-0 whitespace-nowrap ${filters.role === role ? 'tab-active' : ''}`}
            onClick={() => setFilters({ role })}
          >
            {role === 'all' ? 'Все' : ROLE_PLURAL_LABELS[role]}
          </button>
        ))}
      </div>
    </div>
  );
}
