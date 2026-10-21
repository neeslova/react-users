'use client';

import { isServer, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { StoreProvider } from '@/stores/StoreProvider';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Первая страница приходит с сервера: минуту считаем её свежей и не перезапрашиваем
        staleTime: 60_000,
        // Повторная загрузка — по кнопке «Обновить», а не при каждом возврате на вкладку
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** На сервере — новый клиент на каждый рендер (запросы изолированы), в браузере — один на вкладку */
function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <StoreProvider>{children}</StoreProvider>
      {process.env.NODE_ENV === 'development' && (
        // Правее индикатора Next.js (он тоже в левом нижнем углу), чтобы кнопки не перекрывались
        <div className="fixed bottom-4 left-16 z-[9999]">
          <ReactQueryDevtools buttonPosition="relative" />
        </div>
      )}
    </QueryClientProvider>
  );
}
