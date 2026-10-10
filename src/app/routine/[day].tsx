// Lecteur de routine guidée : minuterie sans dérive, pulsation visuelle (+ vibration douce sur mobile)
// pour donner le rythme sans regarder l'écran, écran maintenu allumé.
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon } from '@/components/Icon';
import { Txt } from '@/components/Txt';
import { WaveMark } from '@/components/Wave';
import { Button, Card, Header, Screen } from '@/components/ui';
import { EXERCISES, getDay, PROGRAM_LENGTH, type Exercise } from '@/content/program';
import { fmt, useT } from '@/i18n';
import { todayKey } from '@/lib/dates';
import { hapticsSupported, pulse, success } from '@/lib/haptics';
import { requestSync } from '@/lib/cloud';
import { useApp } from '@/store/useApp';
import { colors, space } from '@/theme/tokens';

const RING = 220;
const STROKE = 10;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const useNativeDriver = Platform.OS !== 'web';

export default function Routine() {
  const t = useT();
  const locale = useApp((s) => s.locale);
  const completeDay = useApp((s) => s.completeDay);
  const addWater = useApp((s) => s.addWater);
  const params = useLocalSearchParams<{ day: string }>();
  const dayNumber = Math.min(PROGRAM_LENGTH, Math.max(1, Number(params.day) || 1));
  const day = getDay(dayNumber)!;
  const steps = useMemo<readonly Exercise[]>(() => day.steps.map((id) => EXERCISES[id]), [day]);

  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState<number>(steps[0]!.durationSec);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const endAt = useRef<number | null>(null);
  const scale = useRef(new Animated.Value(1)).current;

  const step = steps[index]!;
  const isLast = index === steps.length - 1;

  // Écran allumé pendant la routine.
  useEffect(() => {
    void activateKeepAwakeAsync('routine').catch(() => {});
    return () => void deactivateKeepAwake('routine').catch(() => {});
  }, []);

  const goTo = useCallback(
    (i: number, autoRun: boolean) => {
      const target = steps[i];
      if (!target) return;
      setIndex(i);
      setRemaining(target.durationSec);
      endAt.current = autoRun ? Date.now() + target.durationSec * 1000 : null;
      setRunning(autoRun);
    },
    [steps],
  );

  const finish = useCallback(() => {
    setRunning(false);
    endAt.current = null;
    completeDay(dayNumber);
    success();
    requestSync();
    setFinished(true);
  }, [completeDay, dayNumber]);

  const completeStep = useCallback(() => {
    if (step.kind === 'water') addWater(todayKey(), 1);
    if (isLast) finish();
    else {
      pulse();
      goTo(index + 1, true);
    }
  }, [step.kind, isLast, finish, goTo, index, addWater]);

  // Minuterie basée sur l'heure de fin (pas de dérive si le JS est ralenti).
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (endAt.current == null) return;
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        completeStep();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, completeStep]);

  // Pulsation rythmique : vague qui « respire » + vibration douce.
  useEffect(() => {
    if (!running || !step.pulseMs) {
      scale.setValue(1);
      return;
    }
    const half = Math.min(1200, step.pulseMs / 2);
    const beat = () => {
      pulse();
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: half, easing: Easing.out(Easing.quad), useNativeDriver }),
        Animated.timing(scale, { toValue: 1, duration: half, easing: Easing.in(Easing.quad), useNativeDriver }),
      ]).start();
    };
    beat();
    const id = setInterval(beat, step.pulseMs);
    return () => clearInterval(id);
  }, [running, step.pulseMs, scale]);

  const toggle = () => {
    if (running) {
      setRunning(false);
      endAt.current = null;
    } else {
      endAt.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  };

  if (finished) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingVertical: space.xxl }}>
          <WaveMark size={96} />
          <Txt variant="title" center>
            {t.routine.doneTitle}
          </Txt>
          <Txt color={colors.muted} center>
            {t.routine.doneBody}
          </Txt>
          <View style={{ alignSelf: 'stretch', gap: space.sm, marginTop: space.lg }}>
            <Button label={t.routine.backHome} onPress={() => (router.canDismiss() ? router.dismissTo('/') : router.replace('/'))} />
          </View>
        </View>
      </Screen>
    );
  }

  const progress = 1 - remaining / step.durationSec;
  const reps = step.kind === 'reps' && step.pulseMs ? Math.round((step.durationSec * 1000) / step.pulseMs) : null;
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <Screen
      edges={['top']}
      footer={
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Button label={t.routine.previous} variant="secondary" small disabled={index === 0} onPress={() => goTo(index - 1, false)} />
          </View>
          <View style={{ flex: 1.4 }}>
            <Button label={running ? t.routine.pause : index === 0 && remaining === step.durationSec ? t.common.start : t.routine.resume} icon={running ? 'pause' : 'play'} onPress={toggle} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label={isLast ? t.routine.finish : t.routine.next} variant="secondary" small onPress={completeStep} />
          </View>
        </View>
      }
    >
      <Header title={`${day.title[locale]}`} right={<Txt variant="caption" color={colors.muted}>{fmt(t.routine.stepOf, { n: index + 1, total: steps.length })}</Txt>} />

      {/* Progression des étapes */}
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: space.lg }}>
        {steps.map((s, i) => (
          <View key={`${s.id}-${i}`} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < index ? colors.deep : i === index ? colors.teal : colors.line }} />
        ))}
      </View>

      <View style={{ alignItems: 'center', gap: space.lg }}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={RING} height={RING} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={RING / 2} cy={RING / 2} r={R} stroke={colors.mintSoft} strokeWidth={STROKE} fill={colors.white} />
              <Circle
                cx={RING / 2}
                cy={RING / 2}
                r={R}
                stroke={colors.teal}
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${CIRC} ${CIRC}`}
                strokeDashoffset={CIRC * (1 - progress)}
              />
            </Svg>
            {step.kind === 'water' ? <Icon name="drop" size={40} color={colors.teal} /> : null}
            <Txt variant="hero" accessibilityLiveRegion="polite">
              {mm}:{ss}
            </Txt>
            {reps ? (
              <Txt variant="small" color={colors.muted}>
                {fmt(t.routine.reps, { n: reps })}
              </Txt>
            ) : null}
          </View>
        </Animated.View>

        <View style={{ gap: space.sm, alignSelf: 'stretch' }}>
          <Txt variant="h2" center>
            {step.title[locale]}
          </Txt>
          <Txt color={colors.muted} center>
            {step.instructions[locale]}
          </Txt>
        </View>

        {step.pulseMs ? (
          <Card tone="mint" style={{ alignSelf: 'stretch', paddingVertical: space.md }}>
            <Txt variant="small" weight="semibold" center>
              {t.routine.rhythm}
            </Txt>
            {hapticsSupported ? (
              <Txt variant="small" color={colors.muted} center>
                {t.routine.rhythmHaptic}
              </Txt>
            ) : null}
          </Card>
        ) : null}

        <Txt variant="caption" color={colors.muted} center>
          {t.routine.safety}
        </Txt>
      </View>
    </Screen>
  );
}
