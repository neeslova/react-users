import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/Toast';
import { UserDialogs } from '@/components/users/UserDialogs';
import { THEME_STORAGE_KEY } from '@/constants/user';
import { getViewer } from '@/server/session';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'Пользователи', template: '%s — Пользователи' },
  description: 'ЛР3: пользователи DummyJSON на Next.js — валидация Zod, вход через Auth.js и права по ролям',
  icons: { icon: '/favicon.svg' },
};

/**
 * Выполняется браузером синхронно, до первой отрисовки: выставляет сохранённую
 * тему, чтобы не было вспышки светлой темы. На сервере тема неизвестна,
 * поэтому у <html> стоит suppressHydrationWarning.
 */
const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=='corporate'&&t!=='business')t=matchMedia('(prefers-color-scheme: dark)').matches?'business':'corporate';document.documentElement.dataset.theme=t}catch(e){}})()`;

/**
 * Корневой layout — Server Component. Провайдеры (Client Components) оборачивают
 * дерево, но children при этом остаются серверными: клиентский компонент получает
 * их уже отрендеренными.
 *
 * Сессия здесь не ожидается (нет await): layout передаёт промис, и статическая
 * оболочка страниц не зависит от cookie. Пользователя читают только компоненты
 * внутри <Suspense> (меню в шапке, кнопки действий).
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-base-200 antialiased">
        <Providers viewer={getViewer()}>
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
          <UserDialogs />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
