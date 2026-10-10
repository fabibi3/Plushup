import type { DateKey } from './dates';

export type ActivityProfile = 'seated' | 'standing' | 'active' | 'mixed';
export type Goal = 'light_legs' | 'comfort' | 'silhouette' | 'routine' | 'confidence';
export type LeggingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type WearSlot = 'morning' | 'afternoon' | 'evening' | 'all_day' | 'none';
export type MeasureKind = 'waist' | 'hips' | 'thigh' | 'calf' | 'ankle';
export type ConsentKind = 'terms' | 'wellbeing_data' | 'reminders';

/** Échelle 0 → 4 (0 = mieux). null = pas renseigné. */
export type Scale = 0 | 1 | 2 | 3 | 4;

export type Profile = {
  firstName: string;
  activityProfile: ActivityProfile | null;
  goals: Goal[];
  size: LeggingSize | null;
  /** 'HH:MM' local, null = pas de rappel. */
  reminderTime: string | null;
  onboardedAt: string | null;
};

/** Champs de synchro communs : last-write-wins sur clientUpdatedAt, `dirty` = à pousser. */
type Syncable = { clientUpdatedAt: string; dirty: boolean };

export type DailyLog = Syncable & {
  date: DateKey;
  heaviness: Scale | null;
  swelling: Scale | null;
  comfort: Scale | null;
  wornHours: number | null;
  wearSlot: WearSlot | null;
  water: number;
  note: string;
};

export type Measurement = Syncable & {
  date: DateKey;
  kind: MeasureKind;
  valueCm: number;
};

export type DayCompletion = { completedAt: string; dirty: boolean };

export type ConsentEvent = { kind: ConsentKind; granted: boolean; version: string; at: string };

export const CONSENT_VERSION = '2026-10';
