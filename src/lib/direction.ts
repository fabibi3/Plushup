// Sens d'écriture : FR = LTR, AR = RTL.
// Web : attribut `dir` sur <html> → le CSS (flex, margin-inline…) s'inverse tout seul.
// Natif : I18nManager.forceRTL ne s'applique qu'après redémarrage du JS → reloadAppAsync().
import { reloadAppAsync } from 'expo';
import { I18nManager, Platform } from 'react-native';

import type { Locale } from '@/i18n';

/** Applique la direction. Renvoie true si l'app va redémarrer (natif). */
export function applyDirection(locale: Locale): boolean {
  const rtl = locale === 'ar';
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;
    }
    return false;
  }
  if (I18nManager.isRTL === rtl) return false;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  void reloadAppAsync('direction');
  return true;
}
