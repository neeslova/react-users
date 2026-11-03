'use client';

import { DeleteUserDialog, ResetChangesDialog } from './DeleteUserDialog';

/** Диалоги подтверждения. Отрисованы один раз в корневом layout, управляются ui-store */
export function UserDialogs() {
  return (
    <>
      <DeleteUserDialog />
      <ResetChangesDialog />
    </>
  );
}
