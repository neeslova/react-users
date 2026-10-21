import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cache Components: директива 'use cache', cacheLife/cacheTag и Partial Prerendering
  cacheComponents: true,
  // Link по умолчанию префетчит только статическую оболочку маршрута (App Shell)
  partialPrefetching: true,
  // Не создавать AGENTS.md с инструкциями для AI-агентов при next dev
  agentRules: false,
  turbopack: {
    // Явный корень проекта: иначе Turbopack может принять за корень папку выше с чужим lock-файлом
    root: import.meta.dirname,
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  images: {
    // Аватары пользователей DummyJSON отдаёт как https://dummyjson.com/icon/<username>/128
    remotePatterns: [new URL('https://dummyjson.com/icon/**')],
  },
  async redirects() {
    return [{ source: '/', destination: '/users', permanent: false }];
  },
};

export default nextConfig;
