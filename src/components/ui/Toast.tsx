import { CircleCheck, CircleX, Info } from 'lucide-react';
import type { ToastMessage, ToastType } from '../../hooks/useToast';

const ALERT_CLASSES: Record<ToastType, string> = {
  success: 'alert-success',
  info: 'alert-info',
  error: 'alert-error',
};

const ICONS = { success: CircleCheck, info: Info, error: CircleX } as const;

interface ToastProps {
  toast: ToastMessage | null;
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null;

  const Icon = ICONS[toast.type];
  return (
    <div className="toast toast-end z-50" role="status">
      <div key={toast.id} className={`alert ${ALERT_CLASSES[toast.type]} shadow-lg`}>
        <Icon size={20} />
        <span>{toast.text}</span>
      </div>
    </div>
  );
}
