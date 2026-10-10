// Web grand écran (pitch sur ordinateur / projecteur) : l'app s'affiche dans un cadre de téléphone,
// avec le positionnement de marque à côté. Sur mobile et en natif : rendu normal, plein écran.
import type { ReactNode } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';

import { useT } from '@/i18n';
import { colors, space } from '@/theme/tokens';

import { Txt } from './Txt';
import { WaveMark } from './Wave';

const MIN_WIDTH = 900;

export function WebFrame({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const t = useT();
  if (Platform.OS !== 'web' || width < MIN_WIDTH) return <>{children}</>;

  const phoneHeight = Math.min(880, height - 48);
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 72, backgroundColor: colors.deep, padding: space.xl }}>
      <View style={{ maxWidth: 380, gap: space.lg }}>
        <WaveMark size={72} bg={colors.teal} />
        <Txt variant="hero" color={colors.white}>
          plushup
        </Txt>
        <Txt variant="title" color={colors.mint}>
          {t.onboarding.welcomeTitle}
        </Txt>
        <Txt color={colors.sage}>{t.onboarding.welcomeBody}</Txt>
        <Txt variant="caption" color={colors.sage}>
          iOS · Android · app.plushup.co
        </Txt>
      </View>
      <View
        style={{
          width: 400,
          height: phoneHeight,
          borderRadius: 48,
          borderWidth: 12,
          borderColor: '#0A2E2F',
          overflow: 'hidden',
          backgroundColor: colors.cream,
          boxShadow: '0px 40px 80px rgba(0, 0, 0, 0.35)',
        }}
      >
        {children}
      </View>
    </View>
  );
}
