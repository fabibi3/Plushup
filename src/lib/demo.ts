// Profil de démonstration (pitch, salons, tests utilisateurs) : 3 semaines d'historique réaliste, DÉTERMINISTE.
// Mise en scène : 6 jours actifs d'affilée jusqu'à hier → faire le check-in du jour en direct déclenche
// la célébration « 7 jours d'affilée ». Les données de démo ne sont JAMAIS synchronisées (voir sync.ts).
import { addDays, fromKey, type DateKey } from './dates';
import { earnedMilestones, type MilestoneId } from './milestones';
import { measurementKey } from './mappers';
import type { CompletionMap, LogMap } from './stats';
import type { DailyLog, Measurement, Profile, Scale, WearSlot } from './types';

export type LinkedOrder = {
  orderName: string;
  purchasedAt: string;
  deliveredAt: string | null;
  size: string | null;
  status: 'pending' | 'delivered' | 'cancelled' | 'refunded';
};

export type DemoData = {
  profile: Profile;
  logs: LogMap;
  completions: CompletionMap;
  measurements: Record<string, Measurement>;
  linkedOrder: LinkedOrder;
  seenMilestones: MilestoneId[];
};

/** PRNG déterministe (mulberry32) : la démo est identique à chaque fois. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const at = (date: DateKey, hour: number) => {
  const d = fromKey(date);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

// Jours relatifs (0 = aujourd'hui) sans activité : casse les séries pour que la plus longue reste < 7.
const SKIPPED = new Set([-19, -16, -13, -9, -7]);

export function generateDemoData(today: DateKey): DemoData {
  const rand = rng(212);
  const logs: LogMap = {};
  const completions: CompletionMap = {};
  let programDay = 1;

  for (let offset = -20; offset <= -1; offset++) {
    if (SKIPPED.has(offset)) continue;
    const date = addDays(today, offset);
    const progress = (offset + 20) / 19; // 0 → 1 sur la période
    const worn = rand() < 0.75;
    const wornHours = worn ? [4, 6, 6, 8][Math.floor(rand() * 4)]! : 0;
    const slot: WearSlot = !worn ? 'none' : rand() < 0.7 ? 'afternoon' : 'morning';
    // Sensation qui s'allège au fil des semaines, un peu plus légère les jours de port ≥ 4 h.
    const base = 3.2 - progress * 1.6 - (wornHours >= 4 ? 0.5 : 0) + (rand() - 0.5) * 0.8;
    const heaviness = Math.max(0, Math.min(4, Math.round(base))) as Scale;
    const log: DailyLog = {
      date,
      heaviness,
      swelling: Math.max(0, Math.min(4, heaviness - (rand() < 0.5 ? 1 : 0))) as Scale,
      comfort: worn ? ((rand() < 0.7 ? 3 : 4) as Scale) : null,
      wornHours,
      wearSlot: slot,
      water: offset === -4 ? 8 : 3 + Math.floor(rand() * 4),
      note: offset === -11 ? 'Longue journée au bureau, il faisait chaud.' : '',
      clientUpdatedAt: at(date, 21),
      dirty: false,
    };
    logs[date] = log;
    // Routine faite ~2 jours sur 3 (toujours sur la série finale).
    if (programDay <= 21 && (offset >= -6 || rand() < 0.65)) {
      completions[programDay] = { completedAt: at(date, 19), dirty: false };
      programDay += 1;
    }
  }

  const measurements: Record<string, Measurement> = {};
  const addMeasure = (offset: number, kind: Measurement['kind'], valueCm: number) => {
    const date = addDays(today, offset);
    measurements[measurementKey(date, kind)] = { date, kind, valueCm, clientUpdatedAt: at(date, 8), dirty: false };
  };
  addMeasure(-20, 'waist', 78);
  addMeasure(-20, 'hips', 102);
  addMeasure(-20, 'calf', 37.5);
  addMeasure(-6, 'waist', 77.5);
  addMeasure(-6, 'hips', 101.5);
  addMeasure(-6, 'calf', 37);

  const seenMilestones = [...earnedMilestones(logs, completions)];

  return {
    profile: {
      firstName: 'Salma',
      activityProfile: 'seated',
      goals: ['light_legs', 'comfort'],
      size: 'M',
      reminderTime: '21:00',
      onboardedAt: at(addDays(today, -20), 20),
    },
    logs,
    completions,
    measurements,
    linkedOrder: {
      orderName: '#1042',
      purchasedAt: at(addDays(today, -24), 14),
      deliveredAt: at(addDays(today, -21), 11),
      size: 'M',
      status: 'delivered',
    },
    seenMilestones,
  };
}
