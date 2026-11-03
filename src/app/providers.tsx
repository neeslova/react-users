'use client';

import { isServer, QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { makeQueryClient } from '@/api/queryClient';
import { ViewerProvider } from '@/components/auth/ViewerProvider';
import type { Viewer } from '@/schemas/auth';
import { StoreProvider } from '@/stores/StoreProvider';

let browserQueryClient: QueryClient | undefined;

/** На сервере — новый клиент на каждый рендер (запросы изолированы), в браузере — один на вкладку */
function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

interface ProvidersProps {
  /** Промис текущего пользователя из корневого layout (не ожидается там, чтобы не блокировать оболочку) */
  viewer: Promise<Viewer | null>;
  children: ReactNode;
}

export function Providers({ viewer, children }: ProvidersProps) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <ViewerProvider viewer={viewer}>
        <StoreProvider>{children}</StoreProvider>
      </ViewerProvider>
      {process.env.NODE_ENV === 'development' && (
        // Правее индикатора Next.js (он тоже в левом нижнем углу), чтобы кнопки не перекрывались
        <div className="fixed bottom-4 left-16 z-[9999]">
          <ReactQueryDevtools buttonPosition="relative" />
        </div>
      )}
    </QueryClientProvider>
  );
}
