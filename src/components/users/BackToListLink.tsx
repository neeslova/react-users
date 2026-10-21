'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useUiStore } from '@/stores/StoreProvider';

/** Возврат к списку с теми же фильтрами, что были перед переходом в профиль */
export function BackToListLink({ className, children }: { className?: string; children?: ReactNode }) {
  const href = useUiStore((state) => state.listHref);

  return (
    <Link href={href} className={className}>
      {children ?? (
        <>
          <ArrowLeft size={16} aria-hidden /> Все пользователи
        </>
      )}
    </Link>
  );
}
