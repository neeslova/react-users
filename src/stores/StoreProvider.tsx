'use client';

import { createContext, use, useState, type Context, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createUiStore, type UiStore, type UiStoreApi } from './uiStore';
import { createUsersStore, type UsersStore, type UsersStoreApi } from './usersStore';

/*
 * Схема из гайда Zustand для Next.js. Глобальный store на уровне модуля
 * на сервере был бы общим для всех запросов (и пользователей), поэтому
 * экземпляр создаётся в провайдере и передаётся вниз через Context.
 *
 * Context здесь передаёт только ссылку на store (она не меняется), а подписку
 * на изменения даёт сам Zustand: компонент перерисуется, только если изменилась
 * выбранная им часть состояния. Context со значением-состоянием перерисовывал бы
 * всех потребителей при любом изменении.
 */

const UsersStoreContext = createContext<UsersStoreApi | null>(null);
const UiStoreContext = createContext<UiStoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // Ленивая инициализация useState: store создаётся один раз на экземпляр провайдера
  const [usersStore] = useState(createUsersStore);
  const [uiStore] = useState(createUiStore);

  return (
    <UsersStoreContext value={usersStore}>
      <UiStoreContext value={uiStore}>{children}</UiStoreContext>
    </UsersStoreContext>
  );
}

function useStoreApi<T>(context: Context<T | null>, hookName: string): T {
  const store = use(context);
  if (!store) throw new Error(`${hookName} нужно вызывать внутри <StoreProvider>`);
  return store;
}

/** Сам store — для чтения актуального состояния в обработчиках событий (getState) без подписки */
export const useUsersStoreApi = () => useStoreApi(UsersStoreContext, 'useUsersStore');
export const useUiStoreApi = () => useStoreApi(UiStoreContext, 'useUiStore');

/** Подписка на часть состояния: селектор должен возвращать примитив или ссылку из состояния */
export function useUsersStore<T>(selector: (state: UsersStore) => T): T {
  return useStore(useUsersStoreApi(), selector);
}

export function useUiStore<T>(selector: (state: UiStore) => T): T {
  return useStore(useUiStoreApi(), selector);
}

/** Все локальные изменения разом. useShallow: новый объект не вызывает лишних перерисовок */
export const useLocalChanges = () =>
  useUsersStore(useShallow(({ created, updated, deletedIds }) => ({ created, updated, deletedIds })));
