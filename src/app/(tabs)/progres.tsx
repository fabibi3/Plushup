// Progrès : calendrier 4 semaines + statistiques descriptives + observations personnelles (jamais causales).
import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { Button, Card, Screen, Section } from '@/components/ui';
import { fmt, useT } from '@/i18n';
import { addDays, diffDays, fromKey, lastNDays, weekKeys } from '@/lib/dates';
import {
  averageHeaviness,
  averageWorn,
  cellLevel,
  checkinsUntilInsight,
  hasCheckin,
  heavinessTrend,
  routineDays,
  routineInsight,
  wearInsight,
  type CellLevel,
} from '@/lib/stats';
import { useToday } from '@/lib/useToday';
import { useApp } from '@/store/useApp';
import { colors, radius, space } from '@/theme/tokens';

const CELL_COLORS: Record<CellLevel, string> = {
  none: colors.white,
  light: colors.mint,
  medium: colors.sage,
  heavy: colors.amber,
};

export default function Progres() {
  const t = useT();
  const today = useToday();
  const logs = useApp((s) => s.logs);
  const completions = useApp((s) => s.completions);

  const data = useMemo(() => {
    // 4 semaines complètes, du lundi d'il y a 3 semaines au dimanche de cette semaine.
    const firstMonday = weekKeys(addDays(today, -21))[0]!;
    const grid = Array.from({ length: 28 }, (_, i) => addDays(firstMonday, i));
    const last28 = lastNDays(today, 28);
    const last7 = lastNDays(today, 7);
    const routines = routineDays(completions);
    return {
      grid,
      tracked: last28.filter((d) => hasCheckin(logs[d])).length,
      avgHeavy: averageHeaviness(logs, last7),
      avgWorn: averageWorn(logs, last7),
      routinesDone: Object.keys(completions).length,
      routines,
      trend: heavinessTrend(logs, today),
      wear: wearInsight(logs),
      routine: routineInsight(logs, completions),
      missing: checkinsUntilInsight(logs),
    };
  }, [logs, completions, today]);

  const trendText = { down: t.progress.trendDown, up: t.progress.trendUp, flat: t.progress.trendFlat, none: t.progress.trendNone }[data.trend];

  return (
    <Screen>
      <Txt variant="title" style={{ marginTop: space.lg }}>
        {t.progress.title}
      </Txt>

      {/* Calendrier */}
      <Card style={{ marginTop: space.lg }}>
        <View style={{ flexDirection: 'row', gap: space.xs }}>
          {t.days.short.map((d, i) => (
            <Txt key={i} variant="caption" color={colors.muted} center style={{ flex: 1 }}>
              {d}
            </Txt>
          ))}
        </View>
        {[0, 1, 2, 3].map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap: space.xs }}>
            {data.grid.slice(row * 7, row * 7 + 7).map((key) => {
              const future = diffDays(today, key) > 0;
              const level = cellLevel(logs[key]);
              return (
                <View
                  key={key}
                  accessibilityLabel={`${key} ${level}`}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: radius.sm,
                    backgroundColor: future ? 'transparent' : CELL_COLORS[level],
                    borderWidth: key === today ? 2 : 1,
                    borderColor: key === today ? colors.deep : colors.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: future ? 0.4 : 1,
                  }}
                >
                  <Txt variant="caption" color={level === 'heavy' ? colors.amberInk : colors.ink}>
                    {fromKey(key).getDate()}
                  </Txt>
                  {data.routines.has(key) ? <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.deep, marginTop: 1 }} /> : null}
                </View>
              );
            })}
          </View>
        ))}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
          <Legend color={CELL_COLORS.light} label={t.progress.legendLight} />
          <Legend color={CELL_COLORS.medium} label={t.progress.legendMedium} />
          <Legend color={CELL_COLORS.heavy} label={t.progress.legendHeavy} />
          <Legend color={CELL_COLORS.none} label={t.progress.legendNone} />
        </View>
      </Card>

      {/* Chiffres clés */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg }}>
        <Stat label={t.progress.daysTracked} value={`${data.tracked}/28`} />
        <Stat label={t.progress.routines} value={String(data.routinesDone)} />
        <Stat label={t.progress.avgHeaviness} value={data.avgHeavy == null ? '–' : `${data.avgHeavy}/4`} />
        <Stat label={t.progress.avgWorn} value={data.avgWorn == null ? '–' : fmt(t.checkin.hours, { n: data.avgWorn })} />
      </View>
      <Txt variant="small" color={colors.muted} style={{ marginTop: space.sm }}>
        {trendText}
      </Txt>

      {/* Observations */}
      <Section title={t.progress.insightTitle}>
        <Card tone="mint">
          {data.wear || data.routine ? (
            <>
              {data.wear ? <Txt>{fmt(t.progress.insightWear, { a: data.wear.a, b: data.wear.b, n: data.wear.n })}</Txt> : null}
              {data.routine ? <Txt>{fmt(t.progress.insightRoutine, { a: data.routine.a, b: data.routine.b, n: data.routine.n })}</Txt> : null}
            </>
          ) : (
            <Txt>{fmt(t.progress.insightLocked, { n: Math.max(1, data.missing) })}</Txt>
          )}
          <Txt variant="small" color={colors.muted}>
            {t.progress.insightNote}
          </Txt>
        </Card>
      </Section>

      <Section title={t.progress.measuresTitle}>
        <Button label={t.progress.measuresCta} variant="secondary" icon="ruler" onPress={() => router.push('/mesures')} />
      </Section>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flexBasis: '47%', flexGrow: 1, gap: space.xs, padding: space.md }}>
      <Txt variant="title">{value}</Txt>
      <Txt variant="small" color={colors.muted}>
        {label}
      </Txt>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
      <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: color, borderWidth: 1, borderColor: colors.line }} />
      <Txt variant="caption" color={colors.muted}>
        {label}
      </Txt>
    </View>
  );
}
