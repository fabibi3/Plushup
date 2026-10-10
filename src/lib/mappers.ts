// Conversion local ⇄ base + fusion « dernier qui écrit gagne » (testé dans mappers.test.ts).
import type { Insert, Row } from './database.types';
import type { DailyLog, Measurement, MeasureKind, Profile, Scale, WearSlot } from './types';

const asScale = (v: number | null): Scale | null => (v == null ? null : (Math.max(0, Math.min(4, Math.round(v))) as Scale));

export function logToRow(log: DailyLog, userId: string): Insert<'daily_logs'> {
  return {
    user_id: userId,
    log_date: log.date,
    heaviness: log.heaviness,
    swelling: log.swelling,
    comfort: log.comfort,
    worn_hours: log.wornHours,
    wear_slot: log.wearSlot,
    water_glasses: log.water,
    note: log.note.trim() === '' ? null : log.note.trim().slice(0, 280),
    client_updated_at: log.clientUpdatedAt,
  };
}

export function rowToLog(row: Row<'daily_logs'>): DailyLog {
  return {
    date: row.log_date,
    heaviness: asScale(row.heaviness),
    swelling: asScale(row.swelling),
    comfort: asScale(row.comfort),
    wornHours: row.worn_hours == null ? null : Number(row.worn_hours),
    wearSlot: (row.wear_slot as WearSlot | null) ?? null,
    water: row.water_glasses ?? 0,
    note: row.note ?? '',
    clientUpdatedAt: row.client_updated_at,
    dirty: false,
  };
}

export const measurementKey = (date: string, kind: MeasureKind) => `${date}|${kind}`;

export function measurementToRow(m: Measurement, userId: string): Insert<'measurements'> {
  return {
    user_id: userId,
    measured_on: m.date,
    kind: m.kind,
    value_cm: m.valueCm,
    client_updated_at: m.clientUpdatedAt,
  };
}

export function rowToMeasurement(row: Row<'measurements'>): Measurement {
  return {
    date: row.measured_on,
    kind: row.kind as MeasureKind,
    valueCm: Number(row.value_cm),
    clientUpdatedAt: row.client_updated_at,
    dirty: false,
  };
}

export function profileToRow(p: Profile, userId: string, locale: string): Insert<'profiles'> {
  return {
    id: userId,
    first_name: p.firstName.trim() === '' ? null : p.firstName.trim().slice(0, 40),
    locale,
    activity_profile: p.activityProfile,
    goals: p.goals,
    legging_size: p.size,
    reminder_time: p.reminderTime,
    onboarded_at: p.onboardedAt,
  };
}

export function rowToProfile(row: Row<'profiles'>): Profile {
  return {
    firstName: row.first_name ?? '',
    activityProfile: (row.activity_profile as Profile['activityProfile']) ?? null,
    goals: row.goals as Profile['goals'],
    size: (row.legging_size as Profile['size']) ?? null,
    // Postgres renvoie 'HH:MM:SS'
    reminderTime: row.reminder_time ? row.reminder_time.slice(0, 5) : null,
    onboardedAt: row.onboarded_at,
  };
}

type Versioned = { clientUpdatedAt: string; dirty: boolean };

/**
 * Fusionne des lignes distantes dans un état local, par clé.
 * Une version locale non synchronisée (dirty) plus récente ou égale l'emporte ; sinon la version distante remplace.
 */
export function mergeRemote<T extends Versioned>(local: Record<string, T>, remote: Array<[string, T]>): Record<string, T> {
  if (remote.length === 0) return local;
  const next = { ...local };
  for (const [key, incoming] of remote) {
    const current = next[key];
    if (current?.dirty && Date.parse(current.clientUpdatedAt) >= Date.parse(incoming.clientUpdatedAt)) continue;
    next[key] = incoming;
  }
  return next;
}
