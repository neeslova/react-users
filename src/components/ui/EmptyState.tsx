import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-box border border-dashed border-base-300 px-6 py-16 text-center">
      <Icon size={44} className="opacity-40" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-sm opacity-70">{description}</p>
      {action}
    </div>
  );
}
