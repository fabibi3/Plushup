// Calculs purs (testés dans stats.test.ts). Aucune dépendance React / RN.
// Principe : statistiques DESCRIPTIVES uniquement, jamais de causalité ni de pourcentage « d'efficacité ».
import { addDays, diffDays, lastNDays, toKey, weekKeys, type DateKey } from './dates';
import type { DailyLog, DayCompletion } from './types';

export type LogMap = Record<DateKey, DailyLog>;
export type CompletionMap = Record<number, DayCompletion>;

export const hasCheckin = (log: DailyLog | undefined): boolean => log != null && log.heaviness != null;

/** Jours où une routine a été terminée (clé locale). */
export function routineDays(completions: CompletionMap): Set<DateKey> {
  const set = new Set<DateKey>();
  for (const c of Object.values(completions)) set.add(toKey(new Date(c.completedAt)));
  return set;
}

/** Jour « actif » = check-in OU routine faite. */
export function activeDays(logs: LogMap, completions: CompletionMap): Set<DateKey> {
  const set = routineDays(completions);
  for (const log of Object.values(logs)) if (hasCheckin(log)) set.add(log.date);
  return set;
}

/**
 * Série de jours actifs consécutifs se terminant aujourd'hui.
 * Si aujourd'hui n'est pas encore actif, la série d'hier reste « en cours » (on ne casse pas la série à 8h du matin).
 */
export function streak(active: Set<DateKey>, today: DateKey): number {
  let cursor = active.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (active.has(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function weekActivity(active: Set<DateKey>, today: DateKey): { key: DateKey; active: boolean; future: boolean }[] {
  return weekKeys(today).map((key) => ({ key, active: active.has(key), future: diffDays(today, key) > 0 }));
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function averageHeaviness(logs: LogMap, days: DateKey[]): number | null {
  const m = mean(days.map((d) => logs[d]?.heaviness).filter((v): v is NonNullable<typeof v> => v != null));
  return m == null ? null : round1(m);
}

export function averageWorn(logs: LogMap, days: DateKey[]): number | null {
  const m = mean(days.map((d) => logs[d]?.wornHours).filter((v): v is number => v != null));
  return m == null ? null : round1(m);
}

export type Trend = 'down' | 'up' | 'flat' | 'none';

/** Compare la lourdeur moyenne des 7 derniers jours aux 7 précédents (≥ 3 check-ins de chaque côté). */
export function heavinessTrend(logs: LogMap, today: DateKey): Trend {
  const recent = lastNDays(today, 7);
  const previous = lastNDays(addDays(today, -7), 7);
  const count = (days: DateKey[]) => days.filter((d) => hasCheckin(logs[d])).length;
  if (count(recent) < 3 || count(previous) < 3) return 'none';
  const a = averageHeaviness(logs, recent)!;
  const b = averageHeaviness(logs, previous)!;
  if (Math.abs(a - b) < 0.3) return 'flat';
  return a < b ? 'down' : 'up';
}

export const MIN_GROUP_DAYS = 3;

export type Comparison = { a: number; b: number; n: number };

/** Lourdeur moyenne quand une condition est vraie vs fausse. null si un des groupes a < MIN_GROUP_DAYS jours. */
function compare(logs: LogMap, predicate: (log: DailyLog) => boolean | null): Comparison | null {
  const yes: number[] = [];
  const no: number[] = [];
  for (const log of Object.values(logs)) {
    if (log.heaviness == null) continue;
    const p = predicate(log);
    if (p == null) continue;
    (p ? yes : no).push(log.heaviness);
  }
  if (yes.length < MIN_GROUP_DAYS || no.length < MIN_GROUP_DAYS) return null;
  return { a: round1(mean(yes)!), b: round1(mean(no)!), n: yes.length + no.length };
}

export function wearInsight(logs: LogMap): Comparison | null {
  return compare(logs, (log) => (log.wornHours == null ? null : log.wornHours >= 4));
}

export function routineInsight(logs: LogMap, completions: CompletionMap): Comparison | null {
  const days = routineDays(completions);
  return compare(logs, (log) => days.has(log.date));
}

/** Nombre de check-ins manquants avant la première observation (2 groupes × MIN_GROUP_DAYS). */
export function checkinsUntilInsight(logs: LogMap): number {
  const n = Object.values(logs).filter(hasCheckin).length;
  return Math.max(0, MIN_GROUP_DAYS * 2 - n);
}

/** Prochain jour du programme à faire (1-based), ou null si tout est terminé. */
export function nextProgramDay(completions: CompletionMap, length: number): number | null {
  for (let d = 1; d <= length; d++) if (!completions[d]) return d;
  return null;
}

/** Jour du programme terminé aujourd'hui (le plus avancé), ou null. */
export function dayCompletedOn(completions: CompletionMap, date: DateKey): number | null {
  let best: number | null = null;
  for (const [day, c] of Object.entries(completions)) {
    if (toKey(new Date(c.completedAt)) === date && (best == null || Number(day) > best)) best = Number(day);
  }
  return best;
}

/** Niveau visuel d'une case du calendrier. */
export type CellLevel = 'none' | 'light' | 'medium' | 'heavy';

export function cellLevel(log: DailyLog | undefined): CellLevel {
  if (!log || log.heaviness == null) return 'none';
  if (log.heaviness <= 1) return 'light';
  if (log.heaviness === 2) return 'medium';
  return 'heavy';
}
