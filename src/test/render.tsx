import { QueryClientProvider } from '@tanstack/react-query';
import { act, render } from '@testing-library/react';
import { Suspense, type ReactNode } from 'react';
import { makeQueryClient } from '@/api/queryClient';
import { ViewerProvider } from '@/components/auth/ViewerProvider';
import type { Viewer } from '@/schemas/auth';
import { StoreProvider } from '@/stores/StoreProvider';

/**
 * Рендер с провайдерами приложения: кэш TanStack Query, store и текущий пользователь.
 * Пользователь, как и в приложении, приходит промисом и читается через use(),
 * поэтому рендер асинхронный: act дожидается, пока Suspense покажет содержимое.
 */
export async function renderWithProviders(ui: ReactNode, { viewer = null }: { viewer?: Viewer | null } = {}) {
  // Свой кэш на каждый тест, настройки как в приложении; без повторов — ошибка запроса видна сразу
  const queryClient = makeQueryClient({ retry: false });
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <QueryClientProvider client={queryClient}>
        <ViewerProvider viewer={Promise.resolve(viewer)}>
          <StoreProvider>
            <Suspense fallback={<p>Загрузка…</p>}>{ui}</Suspense>
          </StoreProvider>
        </ViewerProvider>
      </QueryClientProvider>,
    );
  });
  return result;
}
