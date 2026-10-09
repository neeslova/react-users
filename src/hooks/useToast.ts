import { useCallback, useEffect, useState } from 'react';

export type ToastType = 'success' | 'info' | 'error';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

/** Всплывающее уведомление, которое само скрывается через timeout мс. */
export function useToast(timeout = 2500) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, type: ToastType = 'success') => {
    setToast({ id: Date.now(), text, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), timeout);
    return () => clearTimeout(timer);
  }, [toast, timeout]);

  return { toast, showToast };
}
