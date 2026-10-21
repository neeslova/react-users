import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}

/**
 * Успешный, но пустой результат. Нейтральные цвета и пунктирная рамка —
 * чтобы пустой список не выглядел как ошибка.
 */
export function EmptyState({ icon: Icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-box border border-dashed border-base-300 text-center ${
        compact ? 'px-4 py-8' : 'px-6 py-16'
      }`}
    >
      <Icon size={compact ? 32 : 44} className="opacity-40" aria-hidden />
      <h2 className={compact ? 'font-semibold' : 'text-lg font-semibold'}>{title}</h2>
      <p className="max-w-sm text-sm opacity-70">{description}</p>
      {action}
    </div>
  );
}
