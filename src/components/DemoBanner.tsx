import { Pressable, View } from 'react-native';

import { useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { colors, radius, space } from '@/theme/tokens';

import { Txt } from './Txt';
import { confirm } from './ui';

/** Bandeau visible en mode démo : impossible de confondre données d'exemple et vraies données. */
export function DemoBanner() {
  const t = useT();
  const demo = useApp((s) => s.demo);
  const resetAll = useApp((s) => s.resetAll);
  if (!demo) return null;
  const exit = async () => {
    if (await confirm(t.demo.exitConfirm, t.demo.exit, t.common.cancel)) resetAll();
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'flex-start', marginTop: space.md }}>
      <View style={{ backgroundColor: colors.sandWarm, borderWidth: 1, borderColor: colors.amber, paddingHorizontal: space.md, paddingVertical: 4, borderRadius: radius.pill }}>
        <Txt variant="caption" color={colors.amberInk}>
          {t.demo.banner}
        </Txt>
      </View>
      <Pressable accessibilityRole="button" onPress={() => void exit()} hitSlop={8}>
        <Txt variant="caption" color={colors.teal} style={{ textDecorationLine: 'underline' }}>
          {t.demo.exit}
        </Txt>
      </Pressable>
    </View>
  );
}
