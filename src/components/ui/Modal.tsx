import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

/**
 * Обёртка над нативным <dialog> (стили DaisyUI `modal`).
 * Видимостью управляет родитель через проп open (одностороннее связывание),
 * а императивные методы showModal()/close() вызываются через ref в useEffect.
 * Закрытие по Esc / клику по фону / крестику сообщается родителю через onClose.
 */
export function Modal({ open, title, onClose, children, wide = false }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
      <div className={`modal-box pt-0 ${wide ? 'sm:max-w-2xl' : ''}`}>
        {/* Заголовок «прилипает» к верху, когда длинная форма прокручивается */}
        <div className="sticky top-0 z-10 -mx-6 mb-2 flex items-center justify-between gap-4 bg-base-100 px-6 pb-3 pt-6">
          <h3 className="text-lg font-bold">{title}</h3>
          <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button aria-label="Закрыть">close</button>
      </form>
    </dialog>
  );
}
