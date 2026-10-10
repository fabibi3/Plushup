// Dates « calendaires » locales au format YYYY-MM-DD.
// On évite toISOString() (UTC) : à Casablanca, un check-in à 00h30 tomberait sur la veille.

export type DateKey = string; // 'YYYY-MM-DD'

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function todayKey(now: Date = new Date()): DateKey {
  return toKey(now);
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

/** Nombre de jours calendaires entre deux clés (b - a). */
export function diffDays(a: DateKey, b: DateKey): number {
  // Midi pour neutraliser les changements d'heure.
  const da = fromKey(a);
  const db = fromKey(b);
  da.setHours(12);
  db.setHours(12);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/** 0 = lundi … 6 = dimanche (semaine marocaine/européenne). */
export function weekdayIndex(key: DateKey): number {
  return (fromKey(key).getDay() + 6) % 7;
}

/** Les 7 clés de la semaine (lundi → dimanche) contenant `key`. */
export function weekKeys(key: DateKey): DateKey[] {
  const monday = addDays(key, -weekdayIndex(key));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Les `n` derniers jours, du plus ancien au plus récent, en terminant par `end`. */
export function lastNDays(end: DateKey, n: number): DateKey[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - n + 1));
}

export function formatLongDate(key: DateKey, dayNames: readonly string[], monthNames: readonly string[]): string {
  const d = fromKey(key);
  return `${dayNames[weekdayIndex(key)] ?? ''} ${d.getDate()} ${monthNames[d.getMonth()] ?? ''}`;
}
