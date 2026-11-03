import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/*
 * Компонентные и unit-тесты: Vitest + React Testing Library + user-event.
 * Среда по умолчанию — jsdom (DOM в Node.js), серверные модули переключаются
 * на node комментарием // @vitest-environment node в начале файла.
 */
export default defineConfig({
  plugins: [react()],
  // Алиас @/* из tsconfig.json
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Тестовый ключ: env-схема требует AUTH_SECRET, настоящий секрет тестам не нужен
    env: { AUTH_SECRET: 'test-secret-for-vitest-only-0123456789abcdef' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/types/**',
        // Файлы маршрутов Next.js (страницы, layout, route handlers) и конфигурация
        // проверяются сборкой (next build) и в браузере, а не компонентными тестами
        'src/app/**',
        'src/auth.ts',
        'src/proxy.ts',
      ],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
