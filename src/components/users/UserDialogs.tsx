'use client';

import { DeleteUserDialog, ResetChangesDialog } from './DeleteUserDialog';
import { UserFormModal } from './UserFormModal';

/** Все диалоги приложения. Отрисованы один раз в корневом layout, управляются ui-store */
export function UserDialogs() {
  return (
    <>
      <UserFormModal />
      <DeleteUserDialog />
      <ResetChangesDialog />
    </>
  );
}
