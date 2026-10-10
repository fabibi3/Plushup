import { useState } from 'react';
import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { Card, Chip, ChipRow, Field, Header, Screen } from '@/components/ui';
import { useT } from '@/i18n';
import { REMINDER_TIMES } from '@/lib/constants';
import { remindersSupported, scheduleDailyReminder } from '@/lib/reminders';
import { requestSync } from '@/lib/cloud';
import type { ActivityProfile, Goal, LeggingSize } from '@/lib/types';
import { useApp } from '@/store/useApp';
import { colors, space } from '@/theme/tokens';

const ACTIVITIES: ActivityProfile[] = ['seated', 'standing', 'active', 'mixed'];
const GOALS: Goal[] = ['light_legs', 'comfort', 'silhouette', 'routine', 'confidence'];
const SIZES: LeggingSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function Profil() {
  const t = useT();
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const setConsent = useApp((s) => s.setConsent);
  const [reminderState, setReminderState] = useState<'ok' | 'denied'>('ok');

  const update = (patch: Parameters<typeof updateProfile>[0]) => {
    updateProfile(patch);
    requestSync();
  };

  const setReminder = async (time: string | null) => {
    update({ reminderTime: time });
    setConsent('reminders', time != null);
    const res = await scheduleDailyReminder(time, t.reminders).catch(() => 'off' as const);
    setReminderState(res === 'denied' ? 'denied' : 'ok');
  };

  return (
    <Screen>
      <Header title={t.me.profile} />

      <Card>
        <Field
          label={t.onboarding.nameTitle}
          value={profile.firstName}
          // Écriture locale à chaque frappe ; la synchro est groupée (debounce) par requestSync.
          onChangeText={(text) => update({ firstName: text })}
          placeholder={t.onboarding.namePlaceholder}
          maxLength={40}
        />
      </Card>

      <Block title={t.onboarding.dayTitle}>
        <ChipRow>
          {ACTIVITIES.map((a) => (
            <Chip key={a} label={t.onboarding.activity[a]} selected={profile.activityProfile === a} onPress={() => update({ activityProfile: a })} />
          ))}
        </ChipRow>
      </Block>

      <Block title={t.onboarding.goalsTitle}>
        <ChipRow>
          {GOALS.map((g) => (
            <Chip
              key={g}
              label={t.onboarding.goals[g]}
              selected={profile.goals.includes(g)}
              onPress={() => update({ goals: profile.goals.includes(g) ? profile.goals.filter((x) => x !== g) : [...profile.goals, g] })}
            />
          ))}
        </ChipRow>
      </Block>

      <Block title={t.onboarding.sizeTitle}>
        <ChipRow>
          {SIZES.map((s) => (
            <Chip key={s} label={s} selected={profile.size === s} onPress={() => update({ size: s })} />
          ))}
        </ChipRow>
      </Block>

      <Block title={t.me.reminder}>
        {!remindersSupported ? (
          <Txt variant="small" color={colors.muted}>
            {t.me.reminderWeb}
          </Txt>
        ) : null}
        <ChipRow>
          {REMINDER_TIMES.map((time) => (
            <Chip key={time} label={time} selected={profile.reminderTime === time} onPress={() => void setReminder(time)} />
          ))}
          <Chip label={t.onboarding.reminderNone} selected={profile.reminderTime == null} onPress={() => void setReminder(null)} />
        </ChipRow>
        {reminderState === 'denied' ? (
          <Txt variant="small" color={colors.alert}>
            {t.me.reminderDenied}
          </Txt>
        ) : null}
      </Block>
    </Screen>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ marginTop: space.lg }}>
      <Txt variant="h2">{title}</Txt>
      <View style={{ gap: space.sm }}>{children}</View>
    </Card>
  );
}
