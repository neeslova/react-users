'use client';

import { RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import { useLocalChanges, useUiStore } from '@/stores/StoreProvider';
import { countLocalChanges } from '@/utils/localChanges';

/** Отправка мутаций: видно, даже когда интерфейс уже обновлён оптимистично */
export function SyncIndicator() {
  const pending = useUiStore((state) => state.pendingMutations > 0);
  if (!pending) return null;

  return (
    <span className="flex items-center gap-2 px-2 text-sm opacity-70" role="status">
      <span className="loading loading-spinner loading-xs" />
      <span className="hidden md:inline">Сохранение…</span>
    </span>
  );
}

/** Счётчик локальных изменений и их сброс. Тот же store читают список и профиль */
export function LocalChangesButton() {
  const changes = useLocalChanges();
  const count = useMemo(() => countLocalChanges(changes), [changes]);
  const openDialog = useUiStore((state) => state.openDialog);

  if (count === 0) return null;

  return (
    <div
      className="tooltip tooltip-bottom"
      data-tip="DummyJSON не сохраняет изменения: они хранятся в браузере до перезагрузки страницы"
    >
      <button type="button" className="btn btn-ghost gap-2" onClick={() => openDialog({ type: 'reset' })}>
        <RotateCcw size={16} />
        <span className="hidden sm:inline">Изменения</span>
        <span className="badge badge-sm badge-warning">{count}</span>
      </button>
    </div>
  );
}
