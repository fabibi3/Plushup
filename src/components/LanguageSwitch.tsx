import { View } from 'react-native';

import { useApp } from '@/store/useApp';
import { space } from '@/theme/tokens';

import { Chip } from './ui';

/** Bascule FR / AR. Sur natif, passer en arabe redémarre l'app (RTL) — géré par le layout racine. */
export function LanguageSwitch() {
  const locale = useApp((s) => s.locale);
  const setLocale = useApp((s) => s.setLocale);
  return (
    <View style={{ flexDirection: 'row', gap: space.sm }}>
      <Chip label="Français" selected={locale === 'fr'} onPress={() => setLocale('fr')} grow />
      <Chip label="العربية" selected={locale === 'ar'} onPress={() => setLocale('ar')} grow />
    </View>
  );
}
