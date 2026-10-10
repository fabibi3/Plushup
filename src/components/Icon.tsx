// Jeu d'icônes maison (trait 2px, grille 24) : ~3 Ko au lieu d'une police d'icônes de ~400 Ko sur le web.
import { memo } from 'react';
import { I18nManager } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useApp } from '@/store/useApp';
import { colors } from '@/theme/tokens';

const paths = {
  today: ['M12 3v2', 'M12 19v2', 'M4.2 4.2l1.4 1.4', 'M18.4 18.4l1.4 1.4', 'M3 12h2', 'M19 12h2', 'M4.2 19.8l1.4-1.4', 'M18.4 5.6l1.4-1.4'],
  program: ['M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0', 'M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0', 'M2 7c2-3 4-3 6 0s4 3 6 0 4-3 6 0'],
  progress: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'],
  me: ['M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1'],
  chevron: ['M9 6l6 6-6 6'],
  back: ['M15 6l-6 6 6 6'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  drop: ['M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z'],
  play: ['M7 4.5v15l12-7.5z'],
  pause: ['M8 5v14', 'M16 5v14'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  bell: ['M18 16V11a6 6 0 0 0-12 0v5l-2 2h16z', 'M10 20a2 2 0 0 0 4 0'],
  globe: ['M3 12h18', 'M12 3a14 14 0 0 1 0 18', 'M12 3a14 14 0 0 0 0 18'],
  shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'],
  box: ['M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z', 'M3 7.5L12 12l9-4.5', 'M12 12v9'],
  cloud: ['M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5z'],
  data: ['M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z', 'M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6', 'M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3'],
  info: ['M12 11v6', 'M12 7.5v.5'],
  ruler: ['M3 17L17 3l4 4L7 21z', 'M7 13l2 2', 'M10 10l2 2', 'M13 7l2 2'],
  book: ['M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z', 'M4 19V5'],
  user: ['M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1'],
  whatsapp: ['M4 20l1.3-4A8 8 0 1 1 8 18.7z'],
} as const;

const circles: Partial<Record<keyof typeof paths, { cx: number; cy: number; r: number }>> = {
  today: { cx: 12, cy: 12, r: 4 },
  me: { cx: 12, cy: 8, r: 4 },
  user: { cx: 12, cy: 8, r: 4 },
  globe: { cx: 12, cy: 12, r: 9 },
  info: { cx: 12, cy: 12, r: 9 },
};

/** Icônes directionnelles : miroir en arabe (RTL). */
const mirrored = new Set<IconName>(['chevron', 'back']);

export type IconName = keyof typeof paths;

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number; fill?: string };

export const Icon = memo(function Icon({ name, size = 24, color = colors.ink, strokeWidth = 2, fill = 'none' }: Props) {
  const rtl = useApp((s) => s.locale === 'ar');
  // Sur natif, I18nManager inverse déjà la mise en page mais pas le dessin SVG.
  const flip = mirrored.has(name) && (rtl || I18nManager.isRTL);
  const c = circles[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
      {paths[name].map((d) => (
        <Path key={d} d={d} stroke={color} strokeWidth={strokeWidth} fill={fill} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {c ? <Circle cx={c.cx} cy={c.cy} r={c.r} stroke={color} strokeWidth={strokeWidth} fill="none" /> : null}
    </Svg>
  );
});
