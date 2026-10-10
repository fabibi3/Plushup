import { describe, expect, it } from 'vitest';

import { addDays } from '@/lib/dates';
import {
  activeDays,
  cellLevel,
  checkinsUntilInsight,
  dayCompletedOn,
  heavinessTrend,
  nextProgramDay,
  routineInsight,
  streak,
  wearInsight,
  type CompletionMap,
  type LogMap,
} from '@/lib/stats';
import type { DailyLog, Scale } from '@/lib/types';

const TODAY = '2026-10-20';

const log = (date: string, heaviness: Scale | null, wornHours: number | null = null): DailyLog => ({
  date,
  heaviness,
  swelling: null,
  comfort: null,
  wornHours,
  wearSlot: null,
  water: 0,
  note: '',
  clientUpdatedAt: '2026-10-01T00:00:00Z',
  dirty: false,
});

const logsOf = (...items: DailyLog[]): LogMap => Object.fromEntries(items.map((l) => [l.date, l]));
const noon = (date: string) => new Date(`${date}T12:00:00`).toISOString();

describe('streak', () => {
  it('compte les jours consécutifs jusqu’à aujourd’hui', () => {
    const active = new Set([TODAY, addDays(TODAY, -1), addDays(TODAY, -2), addDays(TODAY, -4)]);
    expect(streak(active, TODAY)).toBe(3);
  });

  it('ne casse pas la série le matin si aujourd’hui n’est pas encore fait', () => {
    const active = new Set([addDays(TODAY, -1), addDays(TODAY, -2)]);
    expect(streak(active, TODAY)).toBe(2);
  });

  it('vaut 0 sans activité récente', () => {
    expect(streak(new Set([addDays(TODAY, -3)]), TODAY)).toBe(0);
  });

  it('un jour actif = check-in OU routine (pas l’eau seule)', () => {
    const logs = logsOf(log(TODAY, 2), { ...log(addDays(TODAY, -1), null), water: 3 });
    const completions: CompletionMap = { 1: { completedAt: noon(addDays(TODAY, -2)), dirty: false } };
    const active = activeDays(logs, completions);
    expect(active.has(TODAY)).toBe(true);
    expect(active.has(addDays(TODAY, -1))).toBe(false);
    expect(active.has(addDays(TODAY, -2))).toBe(true);
  });
});

describe('observations (descriptives, seuil minimal)', () => {
  it('reste verrouillée tant qu’un groupe a moins de 3 jours', () => {
    const logs = logsOf(log('2026-10-01', 1, 6), log('2026-10-02', 1, 6), log('2026-10-03', 1, 6), log('2026-10-04', 3, 0), log('2026-10-05', 3, 0));
    expect(wearInsight(logs)).toBeNull();
    expect(checkinsUntilInsight(logs)).toBe(1);
  });

  it('compare la lourdeur selon le port ≥ 4 h', () => {
    const logs = logsOf(
      log('2026-10-01', 1, 6), log('2026-10-02', 2, 8), log('2026-10-03', 1, 4),
      log('2026-10-04', 3, 0), log('2026-10-05', 3, 2), log('2026-10-06', 2, 0),
      log('2026-10-07', 4, null), // ignoré : port non renseigné
    );
    expect(wearInsight(logs)).toEqual({ a: 1.3, b: 2.7, n: 6 });
  });

  it('compare selon les jours de routine', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06'];
    const logs = logsOf(...days.map((d, i) => log(d, (i < 3 ? 1 : 3) as Scale)));
    const completions: CompletionMap = {
      1: { completedAt: noon(days[0]!), dirty: false },
      2: { completedAt: noon(days[1]!), dirty: false },
      3: { completedAt: noon(days[2]!), dirty: false },
    };
    expect(routineInsight(logs, completions)).toEqual({ a: 1, b: 3, n: 6 });
  });
});

describe('tendance', () => {
  it('détecte une baisse entre deux semaines', () => {
    const items: DailyLog[] = [];
    for (let i = 0; i < 7; i++) items.push(log(addDays(TODAY, -i), 1));
    for (let i = 7; i < 14; i++) items.push(log(addDays(TODAY, -i), 3));
    expect(heavinessTrend(logsOf(...items), TODAY)).toBe('down');
  });

  it('ne conclut rien avec trop peu de données', () => {
    expect(heavinessTrend(logsOf(log(TODAY, 1)), TODAY)).toBe('none');
  });
});

describe('programme & calendrier', () => {
  it('donne le premier jour non fait', () => {
    expect(nextProgramDay({}, 21)).toBe(1);
    expect(nextProgramDay({ 1: { completedAt: '', dirty: false }, 2: { completedAt: '', dirty: false } }, 21)).toBe(3);
    const all = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [i + 1, { completedAt: '', dirty: false }]));
    expect(nextProgramDay(all, 21)).toBeNull();
  });

  it('retrouve la routine faite aujourd’hui (pour « La refaire »)', () => {
    const completions: CompletionMap = {
      1: { completedAt: noon(addDays(TODAY, -1)), dirty: false },
      2: { completedAt: noon(TODAY), dirty: false },
    };
    expect(dayCompletedOn(completions, TODAY)).toBe(2);
    expect(dayCompletedOn(completions, addDays(TODAY, -2))).toBeNull();
  });

  it('classe les cases du calendrier', () => {
    expect(cellLevel(undefined)).toBe('none');
    expect(cellLevel(log(TODAY, 0))).toBe('light');
    expect(cellLevel(log(TODAY, 2))).toBe('medium');
    expect(cellLevel(log(TODAY, 4))).toBe('heavy');
  });
});
