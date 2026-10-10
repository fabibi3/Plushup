import { describe, expect, it } from 'vitest';

import { addDays, diffDays, lastNDays, todayKey, weekdayIndex, weekKeys } from '@/lib/dates';

describe('dates', () => {
  it('utilise la date LOCALE (pas UTC)', () => {
    // 00h30 locale : doit rester le même jour calendaire local.
    const d = new Date(2026, 9, 10, 0, 30);
    expect(todayKey(d)).toBe('2026-10-10');
  });

  it('additionne les jours à travers les mois et années', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('compte les jours sans être piégé par les changements d’heure', () => {
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2);
    expect(diffDays('2026-10-24', '2026-10-26')).toBe(2);
  });

  it('commence la semaine le lundi', () => {
    expect(weekdayIndex('2026-10-12')).toBe(0); // lundi
    expect(weekdayIndex('2026-10-11')).toBe(6); // dimanche
    expect(weekKeys('2026-10-15')).toEqual([
      '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18',
    ]);
  });

  it('liste les n derniers jours dans l’ordre', () => {
    expect(lastNDays('2026-10-10', 3)).toEqual(['2026-10-08', '2026-10-09', '2026-10-10']);
  });
});
