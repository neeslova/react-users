import { ShieldX } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Ответ 403 для страниц: вызывается forbidden() из requirePageAccess, когда
 * пользователь вошёл, но его роли действие не разрешено (experimental.authInterrupts).
 */
export default function Forbidden() {
  return (
    <EmptyState
      icon={ShieldX}
      title="Недостаточно прав"
      description="Вы вошли в систему, но вашей роли это действие недоступно. Обратитесь к администратору."
      action={
        <Link href="/users" className="btn btn-primary">
          К списку пользователей
        </Link>
      }
    />
  );
}
