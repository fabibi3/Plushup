// Badges (« étapes ») : calculés à partir des données, jamais stockés → impossible de les désynchroniser.
// Seule la liste des badges DÉJÀ CÉLÉBRÉS est persistée (pour ne fêter qu'une fois).
import { addDays, type DateKey } from './dates';
import { activeDays, hasCheckin, type CompletionMap, type LogMap } from './stats';

export type MilestoneId =
  | 'first_checkin'
  | 'first_routine'
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'program_7'
  | 'program_14'
  | 'program_21'
  | 'hydration_8'
  | 'checkins_10';

/** Ordre d'affichage (du plus simple au plus engageant). */
export const MILESTONES: readonly MilestoneId[] = [
  'first_checkin',
  'first_routine',
  'streak_3',
  'hydration_8',
  'streak_7',
  'program_7',
  'checkins_10',
  'streak_14',
  'program_14',
  'program_21',
];

export const MILESTONE_EMOJI: Record<MilestoneId, string> = {
  first_checkin: '🌱',
  first_routine: '🤲',
  streak_3: '🌊',
  streak_7: '🔥',
  streak_14: '💫',
  program_7: '🥉',
  program_14: '🥈',
  program_21: '🏆',
  hydration_8: '💧',
  checkins_10: '📓',
};

/** Plus longue série de jours actifs consécutifs (toutes périodes confondues). */
export function longestStreak(active: Set<DateKey>): number {
  let best = 0;
  for (const day of active) {
    if (active.has(addDays(day, -1))) continue; // pas un début de série
    let len = 1;
    while (active.has(addDays(day, len))) len += 1;
    best = Math.max(best, len);
  }
  return best;
}

export function earnedMilestones(logs: LogMap, completions: CompletionMap): Set<MilestoneId> {
  const earned = new Set<MilestoneId>();
  const checkins = Object.values(logs).filter(hasCheckin).length;
  const routines = Object.keys(completions).length;
  const best = longestStreak(activeDays(logs, completions));

  if (checkins >= 1) earned.add('first_checkin');
  if (checkins >= 10) earned.add('checkins_10');
  if (routines >= 1) earned.add('first_routine');
  if (routines >= 7) earned.add('program_7');
  if (routines >= 14) earned.add('program_14');
  if (routines >= 21) earned.add('program_21');
  if (best >= 3) earned.add('streak_3');
  if (best >= 7) earned.add('streak_7');
  if (best >= 14) earned.add('streak_14');
  if (Object.values(logs).some((l) => l.water >= 8)) earned.add('hydration_8');
  return earned;
}

/** Badge gagné mais pas encore célébré (le plus « gros » d'abord). */
export function nextCelebration(earned: Set<MilestoneId>, seen: readonly MilestoneId[]): MilestoneId | null {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    const id = MILESTONES[i]!;
    if (earned.has(id) && !seen.includes(id)) return id;
  }
  return null;
}
