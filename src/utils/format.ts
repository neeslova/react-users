/** Русское склонение: plural(21, ['год', 'года', 'лет']) → 'год' */
export function plural(n: number, [one, few, many]: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** 5 → '5 пользователей' */
export const pluralize = (n: number, forms: [string, string, string]) => `${n} ${plural(n, forms)}`;

export const formatAge = (age: number) => pluralize(age, ['год', 'года', 'лет']);

export const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

/**
 * '1996-5-30' или '1996-05-30' → '30 мая 1996'.
 * Без new Date() и Intl: результат не зависит от часового пояса и локали,
 * поэтому HTML с сервера совпадает с клиентским рендером (нет ошибки гидратации).
 */
export function formatBirthDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day || month > 12) return date || '—';
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** '1996-5-30' → '1996-05-30' — формат <input type="date"> */
export function toInputDate(date: string) {
  const [y, m, d] = date.split('-');
  if (!y || !m || !d) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** 193.24 → '193 см' */
export const formatMeasure = (value: number | null, unit: string) =>
  value ? `${Math.round(value)} ${unit}` : '—';
