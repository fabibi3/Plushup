// Check-in en 30 s : 3 taps minimum (jambes, port, valider). Tout le reste est facultatif.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/Txt';
import { Button, Card, Chip, ChipRow, Field, Header, ScaleSelector, Screen, Stepper } from '@/components/ui';
import { fmt, useT } from '@/i18n';
import { success } from '@/lib/haptics';
import { requestSync } from '@/lib/cloud';
import type { Scale, WearSlot } from '@/lib/types';
import { useToday } from '@/lib/useToday';
import { useApp } from '@/store/useApp';
import { colors, space } from '@/theme/tokens';

const HOURS = [0, 2, 4, 6, 8, 10, 12] as const;
const SLOTS: Exclude<WearSlot, 'none'>[] = ['morning', 'afternoon', 'evening', 'all_day'];

export default function Checkin() {
  const t = useT();
  const today = useToday();
  const existing = useApp((s) => s.logs[today]);
  const saveLog = useApp((s) => s.saveLog);

  const [heaviness, setHeaviness] = useState<Scale | null>(existing?.heaviness ?? null);
  const [swelling, setSwelling] = useState<Scale | null>(existing?.swelling ?? null);
  const [comfort, setComfort] = useState<Scale | null>(existing?.comfort ?? null);
  const [hours, setHours] = useState<number | null>(existing?.wornHours ?? null);
  const [slot, setSlot] = useState<WearSlot | null>(existing?.wearSlot ?? null);
  const [water, setWater] = useState(existing?.water ?? 0);
  const [note, setNote] = useState(existing?.note ?? '');
  const [showNote, setShowNote] = useState((existing?.note ?? '') !== '');

  const worn = hours != null && hours > 0;
  const isMorning = new Date().getHours() < 12;

  const save = () => {
    saveLog(today, {
      heaviness,
      swelling,
      comfort: worn ? comfort : null,
      wornHours: hours,
      wearSlot: worn ? slot : hours === 0 ? 'none' : null,
      water,
      note: note.trim(),
    });
    success();
    requestSync();
    router.back();
  };

  return (
    <Screen
      edges={['top']}
      footer={<Button label={t.common.save} onPress={save} disabled={heaviness == null} />}
    >
      <Header title={t.checkin.title} />
      <Txt color={colors.muted} center>
        {t.checkin.subtitle}
      </Txt>
      {isMorning && !existing ? (
        <Txt variant="small" color={colors.muted} center style={{ marginTop: space.xs }}>
          {t.checkin.tooEarly}
        </Txt>
      ) : null}

      <Block title={t.checkin.heaviness}>
        <ScaleSelector value={heaviness} onChange={setHeaviness} labels={t.checkin.heavinessLabels} />
      </Block>

      <Block title={t.checkin.worn}>
        <ChipRow>
          {HOURS.map((h) => (
            <Chip key={h} label={h === 0 ? t.checkin.notWorn : fmt(t.checkin.hours, { n: h === 12 ? '12+' : h })} selected={hours === h} onPress={() => setHours(h)} />
          ))}
        </ChipRow>
        {worn ? (
          <View style={{ gap: space.sm, marginTop: space.sm }}>
            <Txt variant="small" weight="semibold">
              {t.checkin.slot}
            </Txt>
            <ChipRow>
              {SLOTS.map((s) => (
                <Chip key={s} label={t.checkin.slots[s]} selected={slot === s} onPress={() => setSlot(s)} />
              ))}
            </ChipRow>
          </View>
        ) : null}
      </Block>

      {worn ? (
        <Block title={t.checkin.comfort}>
          <ScaleSelector value={comfort} onChange={setComfort} labels={t.checkin.comfortLabels} inverted />
        </Block>
      ) : null}

      <Block title={t.checkin.swelling}>
        <ScaleSelector value={swelling} onChange={setSwelling} labels={t.checkin.swellingLabels} />
      </Block>

      <Block title={t.checkin.water}>
        <Stepper value={water} onChange={setWater} max={20} label={t.checkin.water} />
      </Block>

      {showNote ? (
        <Block title={t.checkin.note}>
          <Field value={note} onChangeText={setNote} placeholder={t.checkin.notePlaceholder} maxLength={280} multiline style={{ minHeight: 88, textAlignVertical: 'top' }} />
        </Block>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setShowNote(true)} style={{ paddingVertical: space.lg, alignItems: 'center' }}>
          <Txt weight="semibold" color={colors.teal}>
            + {t.checkin.note}
          </Txt>
        </Pressable>
      )}
    </Screen>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ marginTop: space.lg }}>
      <Txt variant="h2">{title}</Txt>
      {children}
    </Card>
  );
}
