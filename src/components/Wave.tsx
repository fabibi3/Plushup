// Le motif de vague PlushUp, décliné en décor, en logo et en barre de progression.
import { memo } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

/** Vague décorative pleine largeur (bas d'un en-tête). */
export const WaveBand = memo(function WaveBand({
  color = colors.mint,
  height = 28,
  style,
}: {
  color?: string;
  height?: number;
  style?: ViewStyle;
}) {
  return (
    // alignSelf stretch (et non width 100 %) : les marges négatives du parent étirent bien la vague bord à bord.
    <View style={[{ height, alignSelf: 'stretch', pointerEvents: 'none' }, style]}>
      <Svg width="100%" height={height} viewBox="0 0 400 40" preserveAspectRatio="none">
        <Path d="M0 20 C 50 0, 100 0, 150 20 S 250 40, 300 20 S 375 0, 400 15 L400 40 L0 40 Z" fill={color} />
      </Svg>
    </View>
  );
});

/** Logo typographique simplifié + vague (en attendant le fichier vectoriel officiel). */
export const WaveMark = memo(function WaveMark({ size = 56, bg = colors.deep, fg = colors.mint }: { size?: number; bg?: string; fg?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect width="64" height="64" rx="20" fill={bg} />
      <Path d="M10 28c5-6 10-6 15 0s10 6 15 0 10-6 15 0" stroke={fg} strokeWidth="5" fill="none" strokeLinecap="round" />
      <Path d="M10 40c5-6 10-6 15 0s10 6 15 0 10-6 15 0" stroke={colors.white} strokeWidth="5" fill="none" strokeLinecap="round" opacity={0.9} />
    </Svg>
  );
});

/** Barre de progression en forme de vague (0 → 1). La direction suit la langue via flexDirection. */
export const WaveProgress = memo(function WaveProgress({ value, height = 14 }: { value: number; height?: number }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={{ height, borderRadius: height, backgroundColor: colors.mintSoft, overflow: 'hidden', flexDirection: 'row' }}
    >
      <View style={{ width: `${pct * 100}%`, backgroundColor: colors.teal, borderRadius: height }} />
    </View>
  );
});
