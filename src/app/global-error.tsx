'use client';

import { useEffect } from 'react';
import { ErrorState, getErrorMessage } from '@/components/ui/ErrorState';
import './globals.css';

/**
 * Ошибка в корневом layout. Заменяет весь документ, поэтому
 * сама задаёт <html> и <body> и подключает стили.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ru">
      <body className="grid min-h-screen place-items-center bg-base-200 p-4">
        <title>Ошибка — Пользователи</title>
        <ErrorState title="Приложение не смогло загрузиться" description={getErrorMessage(error)} onRetry={retry} />
      </body>
    </html>
  );
}
