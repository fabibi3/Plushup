import { memo } from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { useApp } from '@/store/useApp';
import { fontFamily, type Weight } from '@/theme/fonts';
import { colors, fontSize } from '@/theme/tokens';

type Variant = 'hero' | 'title' | 'h2' | 'body' | 'small' | 'caption';

const variants: Record<Variant, { size: number; weight: Weight; lh: number }> = {
  hero: { size: fontSize.hero, weight: 'bold', lh: 1.2 },
  title: { size: fontSize.xxl, weight: 'bold', lh: 1.25 },
  h2: { size: fontSize.lg, weight: 'semibold', lh: 1.35 },
  body: { size: fontSize.md, weight: 'regular', lh: 1.5 },
  small: { size: fontSize.sm, weight: 'regular', lh: 1.45 },
  caption: { size: fontSize.xs, weight: 'semibold', lh: 1.4 },
};

type Props = TextProps & {
  variant?: Variant;
  weight?: Weight;
  color?: string;
  center?: boolean;
};

/** Texte de l'app : choisit la police selon la langue, interligne majoré pour l'arabe. */
export const Txt = memo(function Txt({ variant = 'body', weight, color = colors.ink, center, style, ...rest }: Props) {
  const locale = useApp((s) => s.locale);
  const v = variants[variant];
  const lineFactor = locale === 'ar' ? v.lh + 0.2 : v.lh;
  const textStyle: TextStyle = {
    fontFamily: fontFamily(locale, weight ?? v.weight),
    fontSize: v.size,
    lineHeight: Math.round(v.size * lineFactor),
    color,
    textAlign: center ? 'center' : 'auto',
  };
  return <Text {...rest} style={[styles.base, textStyle, style]} />;
});

const styles = StyleSheet.create({
  // writingDirection auto : le texte suit la direction de la langue (RTL en arabe).
  base: { writingDirection: 'auto' },
});
