// Onboarding en 7 écrans très courts (~45 s). Tout est facultatif sauf le consentement (exigence légale, données sensibles).
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { LanguageSwitch } from '@/components/LanguageSwitch';
import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { WaveBand, WaveMark } from '@/components/Wave';
import { Button, Card, Chip, ChipRow, Field, Header, Screen } from '@/components/ui';
import { fmt, useT } from '@/i18n';
import { ensureAnonymousSession } from '@/lib/cloud';
import { REMINDER_TIMES } from '@/lib/constants';
import { todayKey } from '@/lib/dates';
import { generateDemoData } from '@/lib/demo';
import { scheduleDailyReminder } from '@/lib/reminders';
import type { ActivityProfile, Goal, LeggingSize } from '@/lib/types';
import { useApp } from '@/store/useApp';
import { colors, radius, space } from '@/theme/tokens';

const ACTIVITIES: ActivityProfile[] = ['seated', 'standing', 'active', 'mixed'];
const GOALS: Goal[] = ['light_legs', 'comfort', 'silhouette', 'routine', 'confidence'];
const SIZES: LeggingSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const STEPS = 7;

export default function Onboarding() {
  const t = useT();
  const completeOnboarding = useApp((s) => s.completeOnboarding);
  const startDemo = useApp((s) => s.startDemo);
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [activity, setActivity] = useState<ActivityProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [size, setSize] = useState<LeggingSize | null>(null);
  const [reminder, setReminder] = useState<string | null>('21:00');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    if (!consent || busy) return;
    setBusy(true);
    completeOnboarding({ firstName: firstName.trim(), activityProfile: activity, goals, size, reminderTime: reminder });
    // Non bloquants : rappel local (natif) + session anonyme pour la sauvegarde.
    void scheduleDailyReminder(reminder, t.reminders).catch(() => {});
    void ensureAnonymousSession();
    router.replace('/');
  };

  const isLast = step === STEPS - 1;

  // Profil exemple (pitch, salons, tests) : 3 semaines d'historique, jamais synchronisé.
  const openDemo = () => {
    startDemo(generateDemoData(todayKey()));
    router.replace('/');
  };

  const footer = (
    <View style={{ gap: space.sm }}>
      {isLast ? (
        <Button label={t.onboarding.finish} onPress={finish} disabled={!consent} loading={busy} />
      ) : (
        <Button label={step === 0 ? t.common.start : t.common.continue} onPress={next} />
      )}
      {step === 0 ? <Button label={t.demo.cta} variant="ghost" small onPress={openDemo} /> : null}
      {step > 0 ? (
        <Txt variant="caption" color={colors.muted} center>
          {fmt(t.onboarding.step, { n: step, total: STEPS - 1 })}
        </Txt>
      ) : null}
    </View>
  );

  return (
    <Screen footer={footer} edges={['top']}>
      {step > 0 ? <Header onBack={prev} /> : <View style={{ height: space.xl }} />}

      {step === 0 && (
        <View style={{ gap: space.xl }}>
          <View style={{ alignItems: 'center', gap: space.lg, marginTop: space.xl }}>
            <WaveMark size={88} />
            <Txt variant="hero" center>
              plushup
            </Txt>
          </View>
          <Card tone="mint" style={{ paddingBottom: 0, overflow: 'hidden' }}>
            <Txt variant="title">{t.onboarding.welcomeTitle}</Txt>
            <Txt color={colors.muted}>{t.onboarding.welcomeBody}</Txt>
            <WaveBand color={colors.mint} style={{ marginHorizontal: -space.lg, marginTop: space.sm }} />
          </Card>
          <View style={{ gap: space.sm }}>
            <Txt variant="small" weight="semibold">
              {t.onboarding.language}
            </Txt>
            <LanguageSwitch />
          </View>
        </View>
      )}

      {step === 1 && (
        <Question title={t.onboarding.nameTitle}>
          <Field
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t.onboarding.namePlaceholder}
            autoComplete="given-name"
            textContentType="givenName"
            maxLength={40}
            returnKeyType="next"
            onSubmitEditing={next}
          />
        </Question>
      )}

      {step === 2 && (
        <Question title={t.onboarding.dayTitle} hint={t.onboarding.dayHint}>
          <View style={{ gap: space.sm }}>
            {ACTIVITIES.map((a) => (
              <Chip key={a} label={t.onboarding.activity[a]} selected={activity === a} onPress={() => setActivity(a)} />
            ))}
          </View>
        </Question>
      )}

      {step === 3 && (
        <Question title={t.onboarding.goalsTitle} hint={t.onboarding.goalsHint}>
          <View style={{ gap: space.sm }}>
            {GOALS.map((g) => (
              <Chip
                key={g}
                label={t.onboarding.goals[g]}
                selected={goals.includes(g)}
                onPress={() => setGoals((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]))}
              />
            ))}
          </View>
        </Question>
      )}

      {step === 4 && (
        <Question title={t.onboarding.sizeTitle}>
          <ChipRow>
            {SIZES.map((s) => (
              <Chip key={s} label={s} selected={size === s} onPress={() => setSize(s)} />
            ))}
          </ChipRow>
          <Chip label={t.onboarding.sizeUnknown} selected={size === null} onPress={() => setSize(null)} />
        </Question>
      )}

      {step === 5 && (
        <Question title={t.onboarding.reminderTitle} hint={t.onboarding.reminderHint}>
          <ChipRow>
            {REMINDER_TIMES.map((time) => (
              <Chip key={time} label={time} selected={reminder === time} onPress={() => setReminder(time)} />
            ))}
          </ChipRow>
          <Chip label={t.onboarding.reminderNone} selected={reminder === null} onPress={() => setReminder(null)} />
        </Question>
      )}

      {step === 6 && (
        <Question title={t.onboarding.consentTitle}>
          <Card tone="sand">
            <Txt variant="small">{t.common.disclaimer}</Txt>
          </Card>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
            onPress={() => setConsent((c) => !c)}
            style={{
              flexDirection: 'row',
              gap: space.md,
              alignItems: 'flex-start',
              padding: space.lg,
              borderRadius: radius.md,
              borderWidth: 2,
              borderColor: consent ? colors.deep : colors.line,
              backgroundColor: colors.white,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: colors.deep,
                backgroundColor: consent ? colors.deep : colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 2,
              }}
            >
              {consent ? <Icon name="check" size={18} color={colors.white} strokeWidth={3} /> : null}
            </View>
            <Txt variant="small" style={{ flex: 1 }}>
              {t.onboarding.consentData}
            </Txt>
          </Pressable>
          {!consent ? (
            <Txt variant="small" color={colors.muted}>
              {t.onboarding.consentRequired}
            </Txt>
          ) : null}
          <Link href="/securite" asChild>
            <Pressable accessibilityRole="link" style={{ paddingVertical: space.sm }}>
              <Txt weight="semibold" color={colors.teal} style={{ textDecorationLine: 'underline' }}>
                {t.onboarding.safetyLink}
              </Txt>
            </Pressable>
          </Link>
        </Question>
      )}
    </Screen>
  );
}

function Question({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.lg, marginTop: space.md }}>
      <View style={{ gap: space.xs }}>
        <Txt variant="title">{title}</Txt>
        {hint ? <Txt color={colors.muted}>{hint}</Txt> : null}
      </View>
      {children}
    </View>
  );
}
