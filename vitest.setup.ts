import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Пакет server-only в обычном Node.js бросает ошибку (он рассчитан на сборщик Next.js).
// В тестах серверные модули импортируются напрямую, поэтому заменяем его пустым модулем.
vi.mock('server-only', () => ({}));

// Без globals: true Testing Library не очищает DOM сама — делаем это после каждого теста
afterEach(() => {
  cleanup();
});

// jsdom не реализует модальные окна <dialog>: showModal/close меняют только атрибут open
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}
