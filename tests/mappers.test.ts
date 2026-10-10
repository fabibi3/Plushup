import { describe, expect, it } from 'vitest';

import { logToRow, mergeRemote, rowToLog, rowToProfile } from '@/lib/mappers';
import type { DailyLog } from '@/lib/types';

const base: DailyLog = {
  date: '2026-10-10',
  heaviness: 2,
  swelling: 1,
  comfort: 3,
  wornHours: 6,
  wearSlot: 'afternoon',
  water: 4,
  note: '  longue journée  ',
  clientUpdatedAt: '2026-10-10T20:00:00.000Z',
  dirty: true,
};

describe('mappers', () => {
  it('aller-retour local → ligne → local', () => {
    const row = logToRow(base, 'user-1');
    expect(row).toMatchObject({ user_id: 'user-1', log_date: '2026-10-10', worn_hours: 6, note: 'longue journée' });
    const back = rowToLog({
      ...(row as Required<typeof row>),
      id: 'x',
      created_at: '',
      updated_at: '',
      worn_hours: 6,
    } as never);
    expect(back).toMatchObject({ ...base, note: 'longue journée', dirty: false });
  });

  it('note vide → null en base', () => {
    expect(logToRow({ ...base, note: '   ' }, 'u').note).toBeNull();
  });

  it('heure de rappel Postgres HH:MM:SS → HH:MM', () => {
    const p = rowToProfile({
      id: 'u', first_name: null, locale: 'fr', activity_profile: 'seated', goals: ['comfort'], legging_size: 'M',
      reminder_time: '21:00:00', timezone: 'Africa/Casablanca', onboarded_at: null, created_at: '', updated_at: '',
    });
    expect(p.reminderTime).toBe('21:00');
    expect(p.firstName).toBe('');
  });
});

describe('mergeRemote (dernier qui écrit gagne)', () => {
  const older: DailyLog = { ...base, clientUpdatedAt: '2026-10-10T18:00:00.000Z', dirty: false };
  const newer: DailyLog = { ...base, heaviness: 0, clientUpdatedAt: '2026-10-10T22:00:00.000Z', dirty: false };

  it('la version distante remplace une version locale propre', () => {
    const merged = mergeRemote({ a: { ...base, dirty: false } }, [['a', newer]]);
    expect(merged.a!.heaviness).toBe(0);
  });

  it('une modif locale non synchronisée plus récente est conservée', () => {
    const merged = mergeRemote({ a: base }, [['a', older]]);
    expect(merged.a).toBe(base);
  });

  it('une modif locale plus ancienne cède à la version distante', () => {
    const merged = mergeRemote({ a: base }, [['a', newer]]);
    expect(merged.a!.heaviness).toBe(0);
  });

  it('ajoute les nouvelles clés et renvoie le même objet si rien ne change', () => {
    const local = { a: base };
    expect(mergeRemote(local, [])).toBe(local);
    expect(Object.keys(mergeRemote(local, [['b', newer]]))).toEqual(['a', 'b']);
  });
});
