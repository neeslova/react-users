'use client';

import { useEffect } from 'react';
import { ErrorState, getErrorMessage } from '@/components/ui/ErrorState';

/**
 * Error boundary сегмента /users (Client Component — так требует React).
 * Срабатывает на непредвиденные ошибки рендера; шапка и layout продолжают работать.
 * retry() заново запрашивает данные с сервера и перерисовывает сегмент.
 */
export default function UsersError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState title="Что-то пошло не так" description={getErrorMessage(error)} onRetry={retry} />;
}
