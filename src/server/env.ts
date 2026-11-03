import 'server-only';
import { z } from 'zod';

/*
 * Переменные окружения — внешняя граница: строки из .env или из окружения сервера.
 * Схема проверяет их один раз при загрузке модуля и приводит к нужным типам,
 * поэтому дальше в коде нет ни Number(process.env…), ни process.env.X!.
 * Модуль серверный: секреты не попадут в клиентский бандл (без префикса NEXT_PUBLIC_
 * Next.js их туда и не передаёт, а server-only не даст импортировать модуль на клиенте).
 */

/** Пустая строка в .env (`DUMMYJSON_DELAY_MS=`) — то же, что отсутствие переменной */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema);

const envSchema = z.object({
  DUMMYJSON_URL: optional(
    z.url({ protocol: /^https?$/, error: 'DUMMYJSON_URL: нужен адрес http(s)://…' }).default('https://dummyjson.com'),
  ).transform((url) => url.replace(/\/$/, '')),
  DUMMYJSON_DELAY_MS: optional(
    z.coerce
      .number({ error: 'DUMMYJSON_DELAY_MS: нужно число' })
      .int('DUMMYJSON_DELAY_MS: нужно целое число')
      .min(0, 'DUMMYJSON_DELAY_MS: от 0 до 5000')
      .max(5000, 'DUMMYJSON_DELAY_MS: от 0 до 5000')
      .default(0),
  ),
  // Ключ шифрования cookie сессии. Сгенерировать: npx auth secret (или openssl rand -base64 33)
  AUTH_SECRET: z
    .string({ error: 'AUTH_SECRET не задан: скопируйте .env.example в .env.local и укажите секрет (npx auth secret)' })
    .min(32, 'AUTH_SECRET слишком короткий: нужно не меньше 32 символов'),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues.map((issue) => `  - ${issue.message}`).join('\n');
    throw new Error(`Некорректные переменные окружения:\n${details}`);
  }
  return result.data;
}

export const env = parseEnv();
