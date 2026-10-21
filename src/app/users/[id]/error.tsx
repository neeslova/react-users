'use client';

import { useEffect } from 'react';
import { ErrorState, getErrorMessage } from '@/components/ui/ErrorState';

/** Ошибка загрузки профиля: ссылка «назад» из layout остаётся на месте */
export default function UserError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState title="Не удалось загрузить профиль" description={getErrorMessage(error)} onRetry={retry} />;
}
