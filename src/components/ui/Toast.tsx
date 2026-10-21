'use client';

import { CircleCheck, CircleX, Info, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useUiStore } from '@/stores/StoreProvider';
import type { Toast, ToastTone } from '@/stores/uiStore';

const ALERT_CLASSES: Record<ToastTone, string> = {
  success: 'alert-success',
  info: 'alert-info',
  error: 'alert-error',
};

const ICONS = { success: CircleCheck, info: Info, error: CircleX } as const;

const TIMEOUT_MS: Record<ToastTone, number> = { success: 4000, info: 4000, error: 7000 };

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const Icon = ICONS[toast.tone];

  // Уведомление само скрывается; функция очистки отменяет таймер, если его закрыли раньше
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TIMEOUT_MS[toast.tone]);
    return () => clearTimeout(timer);
  }, [toast.id, toast.tone, onDismiss]);

  return (
    <div className={`alert ${ALERT_CLASSES[toast.tone]} max-w-sm shadow-lg`}>
      <Icon size={20} aria-hidden />
      <span className="text-sm whitespace-normal">{toast.message}</span>
      <div className="flex items-center gap-1">
        {toast.href && (
          <Link href={toast.href} className="btn btn-xs btn-ghost" onClick={() => onDismiss(toast.id)}>
            Открыть
          </Link>
        )}
        <button type="button" className="btn btn-xs btn-circle btn-ghost" onClick={() => onDismiss(toast.id)} aria-label="Закрыть уведомление">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/** Стек уведомлений. Показать уведомление может любой компонент через ui-store */
export function Toaster() {
  const toasts = useUiStore((state) => state.toasts);
  const dismissToast = useUiStore((state) => state.dismissToast);

  return (
    <div className="toast toast-end z-50" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
