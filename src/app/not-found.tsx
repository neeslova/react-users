import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = { title: 'Страница не найдена' };

/** 404 для несуществующих адресов */
export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Страница не найдена"
      description="Такой страницы нет. Проверьте адрес или вернитесь к списку пользователей."
      action={
        <Link href="/users" className="btn btn-primary">
          К списку пользователей
        </Link>
      }
    />
  );
}
