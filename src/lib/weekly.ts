// Bilan des 7 derniers jours (descriptif, partageable).
import { addDays, lastNDays, type DateKey } from './dates';
import { averageHeaviness, averageWorn, hasCheckin, routineDays, type CompletionMap, type LogMap } from './stats';

export type WeeklySummary = {
  from: DateKey;
  to: DateKey;
  activeDays: number;
  checkins: number;
  routines: number;
  avgHeaviness: number | null;
  prevAvgHeaviness: number | null;
  avgWorn: number | null;
  avgWater: number | null;
  /** Jour avec la sensation la plus légère (en cas d'égalité : le plus récent). */
  lightestDay: DateKey | null;
};

export function weeklySummary(logs: LogMap, completions: CompletionMap, today: DateKey): WeeklySummary {
  const days = lastNDays(today, 7);
  const prev = lastNDays(addDays(today, -7), 7);
  const routines = routineDays(completions);
  const checked = days.filter((d) => hasCheckin(logs[d]));
  const waters = days.map((d) => logs[d]?.water ?? 0).filter((w) => w > 0);

  let lightestDay: DateKey | null = null;
  for (const d of checked) {
    const h = logs[d]!.heaviness!;
    if (lightestDay == null || h <= logs[lightestDay]!.heaviness!) lightestDay = d;
  }

  return {
    from: days[0]!,
    to: today,
    activeDays: days.filter((d) => hasCheckin(logs[d]) || routines.has(d)).length,
    checkins: checked.length,
    routines: days.filter((d) => routines.has(d)).length,
    avgHeaviness: averageHeaviness(logs, days),
    prevAvgHeaviness: averageHeaviness(logs, prev),
    avgWorn: averageWorn(logs, days),
    avgWater: waters.length ? Math.round((waters.reduce((a, b) => a + b, 0) / waters.length) * 10) / 10 : null,
    lightestDay,
  };
}
