// Mensurations facultatives : repères personnels, jamais d'objectif chiffré ni de comparaison à une « norme ».
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { Button, Card, Field, Header, Screen, Section } from '@/components/ui';
import { useT } from '@/i18n';
import { formatLongDate } from '@/lib/dates';
import { success } from '@/lib/haptics';
import { requestSync } from '@/lib/cloud';
import type { MeasureKind } from '@/lib/types';
import { useToday } from '@/lib/useToday';
import { useApp } from '@/store/useApp';
import { colors, space } from '@/theme/tokens';

const KINDS: MeasureKind[] = ['waist', 'hips', 'thigh', 'calf', 'ankle'];

const parseCm = (raw: string): number | null => {
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) && n >= 10 && n <= 250 ? Math.round(n * 10) / 10 : null;
};

export default function Mesures() {
  const t = useT();
  const today = useToday();
  const measurements = useApp((s) => s.measurements);
  const saveMeasurement = useApp((s) => s.saveMeasurement);
  const [values, setValues] = useState<Partial<Record<MeasureKind, string>>>(() =>
    Object.fromEntries(KINDS.map((k) => [k, measurements[`${today}|${k}`]?.valueCm.toString() ?? ''])),
  );
  const [error, setError] = useState(false);

  const history = useMemo(() => {
    const byDate = new Map<string, Partial<Record<MeasureKind, number>>>();
    for (const m of Object.values(measurements)) byDate.set(m.date, { ...byDate.get(m.date), [m.kind]: m.valueCm });
    return [...byDate.entries()].sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 12);
  }, [measurements]);

  const save = () => {
    const entries = KINDS.map((k) => [k, values[k]?.trim() ?? ''] as const).filter(([, v]) => v !== '');
    const parsed = entries.map(([k, v]) => [k, parseCm(v)] as const);
    if (parsed.some(([, v]) => v == null)) {
      setError(true);
      return;
    }
    setError(false);
    for (const [k, v] of parsed) saveMeasurement(today, k, v!);
    success();
    requestSync();
  };

  return (
    <Screen>
      <Header title={t.measures.title} />
      <Txt color={colors.muted}>{t.measures.intro}</Txt>

      <Card style={{ marginTop: space.lg }}>
        {KINDS.map((k) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Txt style={{ flex: 1 }}>{t.measures.kinds[k]}</Txt>
            <View style={{ width: 120 }}>
              <Field
                value={values[k] ?? ''}
                onChangeText={(v) => setValues((cur) => ({ ...cur, [k]: v }))}
                keyboardType="decimal-pad"
                placeholder={t.measures.unit}
                maxLength={5}
                accessibilityLabel={t.measures.kinds[k]}
              />
            </View>
          </View>
        ))}
        {error ? (
          <Txt variant="small" color={colors.alert}>
            {t.measures.invalid}
          </Txt>
        ) : null}
        <Button label={t.common.save} onPress={save} />
      </Card>

      <Section title={t.measures.history}>
        {history.length === 0 ? (
          <Txt color={colors.muted}>{t.measures.empty}</Txt>
        ) : (
          history.map(([date, vals]) => (
            <Card key={date} style={{ gap: space.xs, padding: space.md }}>
              <Txt variant="caption" color={colors.muted}>
                {formatLongDate(date, t.days.long, t.months)}
              </Txt>
              <Txt variant="small">
                {KINDS.filter((k) => vals[k] != null)
                  .map((k) => `${t.measures.kinds[k]} ${vals[k]} ${t.measures.unit}`)
                  .join(' · ')}
              </Txt>
            </Card>
          ))
        )}
      </Section>
    </Screen>
  );
}
