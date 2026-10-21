'use client';

import { catchError, type ErrorInfo } from 'next/error';
import { ErrorState, getErrorMessage } from './ErrorState';

interface FallbackProps {
  title: string;
  variant?: 'block' | 'compact' | 'inline';
}

function SectionErrorFallback({ title, variant }: FallbackProps, { error, retry }: ErrorInfo) {
  return <ErrorState title={title} description={getErrorMessage(error)} onRetry={retry} variant={variant} />;
}

/**
 * Локальный error boundary (catchError из next/error — аналог error.tsx для любой
 * части дерева). Ошибка в секции ломает только её, остальная страница работает.
 * retry() заново запрашивает данные с сервера и перерисовывает секцию.
 */
export const SectionErrorBoundary = catchError(SectionErrorFallback);
