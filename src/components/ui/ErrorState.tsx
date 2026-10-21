import { RefreshCw, TriangleAlert } from 'lucide-react';

type ErrorStateVariant = 'block' | 'compact' | 'inline';

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  variant?: ErrorStateVariant;
}

/** Ошибка загрузки: заметное оформление и кнопка повтора (в отличие от EmptyState) */
export function ErrorState({ title, description, onRetry, variant = 'block' }: ErrorStateProps) {
  if (variant === 'inline') {
    return (
      <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-error">
        <TriangleAlert size={15} aria-hidden /> {title}
        {onRetry && (
          <button type="button" className="link" onClick={onRetry}>
            Повторить
          </button>
        )}
      </p>
    );
  }

  const compact = variant === 'compact';
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-box border border-error/30 bg-error/5 text-center ${
        compact ? 'px-4 py-8' : 'px-6 py-16'
      }`}
    >
      <TriangleAlert size={compact ? 32 : 44} className="text-error" aria-hidden />
      <h2 className={compact ? 'font-semibold' : 'text-lg font-semibold'}>{title}</h2>
      <p className="max-w-md text-sm opacity-70">{description}</p>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline btn-error" onClick={onRetry}>
          <RefreshCw size={15} /> Повторить
        </button>
      )}
    </div>
  );
}

/**
 * Текст ошибки для пользователя. Ошибки Server Components в production
 * приходят без исходного сообщения (только digest), поэтому для них — общий текст.
 */
export function getErrorMessage(error: unknown) {
  if (error instanceof Error && !('digest' in error) && error.message) return error.message;
  return 'Сервер не смог получить данные. Возможно, DummyJSON временно недоступен.';
}
