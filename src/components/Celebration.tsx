// Célébration d'un badge : moment « wow » (et partage WhatsApp). Affiché une seule fois par badge.
import { usePathname } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Modal, Platform, View } from 'react-native';

import { useT, fmt } from '@/i18n';
import { referralUrl } from '@/lib/constants';
import { success } from '@/lib/haptics';
import { earnedMilestones, MILESTONE_EMOJI, nextCelebration } from '@/lib/milestones';
import { shareOnWhatsApp } from '@/lib/share';
import { useApp } from '@/store/useApp';
import { colors, radius, space } from '@/theme/tokens';

import { Txt } from './Txt';
import { WaveBand } from './Wave';
import { Button } from './ui';

const useNativeDriver = Platform.OS !== 'web';
const TAB_PATHS = new Set(['/', '/programme', '/progres', '/moi']);

export function Celebration() {
  const t = useT();
  const logs = useApp((s) => s.logs);
  const completions = useApp((s) => s.completions);
  const seen = useApp((s) => s.seenMilestones);
  const referralCode = useApp((s) => s.referralCode);
  const markSeen = useApp((s) => s.markMilestoneSeen);

  // Uniquement sur les onglets : jamais par-dessus le check-in ou l'écran « routine terminée ».
  const pathname = usePathname();
  const onTab = TAB_PATHS.has(pathname);
  const pending = useMemo(() => nextCelebration(earnedMilestones(logs, completions), seen), [logs, completions, seen]);
  const current = onTab ? pending : null;
  const scale = useRef(new Animated.Value(0.6)).current;
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!current) return;
    success();
    scale.setValue(0.6);
    wave.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 80, useNativeDriver }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver }),
          Animated.timing(wave, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver }),
        ]),
      ),
    ]).start();
  }, [current, scale, wave]);

  if (!current) return null;
  const name = t.milestones.names[current];
  const close = () => markSeen(current);
  const share = () => {
    void shareOnWhatsApp(`${fmt(t.milestones.shareText, { badge: name })} ${referralUrl(referralCode || 'APP')}`);
    close();
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,70,72,0.55)', alignItems: 'center', justifyContent: 'center', padding: space.lg }}>
        <View
          accessibilityViewIsModal
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: colors.cream,
            borderRadius: radius.lg,
            overflow: 'hidden',
            boxShadow: '0px 24px 48px rgba(15, 70, 72, 0.35)',
          }}
        >
          <View style={{ backgroundColor: colors.deep, alignItems: 'center', paddingTop: space.xxl }}>
            <Animated.View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: colors.mint,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale }, { translateY: wave.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
              }}
            >
              <Txt style={{ fontSize: 56, lineHeight: 72 }}>{MILESTONE_EMOJI[current]}</Txt>
            </Animated.View>
            <WaveBand color={colors.cream} height={36} style={{ marginTop: space.lg }} />
          </View>
          <View style={{ padding: space.xl, gap: space.md }}>
            <Txt variant="caption" color={colors.teal} center>
              {t.milestones.congrats}
            </Txt>
            <Txt variant="title" center>
              {name}
            </Txt>
            <Txt color={colors.muted} center>
              {t.milestones.bodies[current]}
            </Txt>
            <View style={{ gap: space.sm, marginTop: space.md }}>
              <Button label={t.milestones.share} icon="whatsapp" onPress={share} />
              <Button label={t.milestones.continue} variant="ghost" onPress={close} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
