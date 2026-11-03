import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import type { User } from '@/types/user';

/*
 * Store интерфейса: открытый диалог, уведомления, счётчик выполняющихся мутаций.
 * Кнопка «Удалить» есть в карточках и на странице профиля, «Изменения» — в шапке,
 * а сами диалоги подтверждения отрисованы один раз в корневом layout.
 * Добавление и изменение — отдельные страницы (/users/new, /users/[id]/edit):
 * у них есть адрес, и сервер может закрыть их от гостя.
 */

/** Размеченное объединение: user есть только у тех диалогов, которым он нужен */
export type UserDialog = { type: 'closed' } | { type: 'delete'; user: User } | { type: 'reset' };

export type ToastTone = 'success' | 'info' | 'error';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  /** Ссылка «Открыть» в уведомлении */
  href?: string;
}

interface UiState {
  dialog: UserDialog;
  toasts: Toast[];
  /** > 0 — идёт отправка мутации на сервер */
  pendingMutations: number;
  /** Последний адрес списка с фильтрами — для ссылки «Назад» со страницы профиля */
  listHref: string;
}

interface UiActions {
  openDialog: (dialog: Exclude<UserDialog, { type: 'closed' }>) => void;
  closeDialog: () => void;
  showToast: (message: string, tone?: ToastTone, href?: string) => void;
  dismissToast: (id: number) => void;
  mutationStarted: () => void;
  mutationFinished: () => void;
  setListHref: (href: string) => void;
}

export type UiStore = UiState & UiActions;
export type UiStoreApi = ReturnType<typeof createUiStore>;

const MAX_TOASTS = 3;

export const createUiStore = () => {
  let nextToastId = 1;

  return createStore<UiStore>()(
    devtools(
      (set) => ({
        dialog: { type: 'closed' },
        toasts: [],
        pendingMutations: 0,
        listHref: '/users',

        openDialog: (dialog) => set({ dialog }, false, `ui/open:${dialog.type}`),
        closeDialog: () => set({ dialog: { type: 'closed' } }, false, 'ui/close'),

        showToast: (message, tone = 'success', href) =>
          set(
            (state) => ({ toasts: [...state.toasts, { id: nextToastId++, tone, message, href }].slice(-MAX_TOASTS) }),
            false,
            'ui/toast',
          ),
        dismissToast: (id) =>
          set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }), false, 'ui/dismissToast'),

        mutationStarted: () => set((state) => ({ pendingMutations: state.pendingMutations + 1 }), false, 'ui/mutationStarted'),
        mutationFinished: () =>
          set((state) => ({ pendingMutations: Math.max(0, state.pendingMutations - 1) }), false, 'ui/mutationFinished'),

        setListHref: (listHref) => set({ listHref }, false, 'ui/listHref'),
      }),
      { name: 'ui-store', enabled: process.env.NODE_ENV !== 'production' },
    ),
  );
};
