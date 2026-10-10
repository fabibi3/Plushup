import { describe, expect, it } from 'vitest';

import { addDays } from '@/lib/dates';
import { generateDemoData } from '@/lib/demo';
import { earnedMilestones, longestStreak, nextCelebration } from '@/lib/milestones';
import { activeDays, heavinessTrend, nextProgramDay, streak, wearInsight } from '@/lib/stats';
import { weeklySummary } from '@/lib/weekly';

const TODAY = '2026-10-21';

describe('longestStreak', () => {
  it('trouve la plus longue série', () => {
    const s = new Set(['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-05', '2026-10-06']);
    expect(longestStreak(s)).toBe(3);
    expect(longestStreak(new Set())).toBe(0);
  });
});

describe('profil de démo (mise en scène du pitch)', () => {
  const demo = generateDemoData(TODAY);
  const active = activeDays(demo.logs, demo.completions);

  it('est déterministe', () => {
    expect(generateDemoData(TODAY)).toEqual(demo);
  });

  it('a une série de 6 jours jusqu’à hier, et jamais 7 avant', () => {
    expect(streak(active, TODAY)).toBe(6);
    expect(longestStreak(active)).toBe(6);
  });

  it('le check-in du jour déclenche la célébration « 7 jours »', () => {
    const logs = { ...demo.logs, [TODAY]: { ...demo.logs[addDays(TODAY, -1)]!, date: TODAY } };
    const earned = earnedMilestones(logs, demo.completions);
    expect(nextCelebration(earned, demo.seenMilestones)).toBe('streak_7');
  });

  it('n’a rien à célébrer au chargement', () => {
    expect(nextCelebration(earnedMilestones(demo.logs, demo.completions), demo.seenMilestones)).toBeNull();
  });

  it('montre des observations et une tendance à la baisse', () => {
    expect(wearInsight(demo.logs)).not.toBeNull();
    expect(heavinessTrend(demo.logs, TODAY)).toBe('down');
  });

  it('est en milieu de programme, routine du jour à faire', () => {
    const next = nextProgramDay(demo.completions, 21);
    expect(next).toBeGreaterThan(7);
    expect(next).toBeLessThan(21);
    expect(demo.logs[TODAY]).toBeUndefined();
  });

  it('produit un bilan de semaine cohérent', () => {
    const w = weeklySummary(demo.logs, demo.completions, TODAY);
    expect(w.activeDays).toBe(6);
    expect(w.avgHeaviness).not.toBeNull();
    expect(w.prevAvgHeaviness!).toBeGreaterThan(w.avgHeaviness!);
    expect(w.lightestDay).not.toBeNull();
  });
});
