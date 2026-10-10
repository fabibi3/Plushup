import { useApp } from '@/store/useApp';
import { ar } from './ar';
import { fr, type Dict } from './fr';

export type Locale = 'fr' | 'ar';

const dicts: Record<Locale, Dict> = { fr, ar };

export const isRTL = (locale: Locale) => locale === 'ar';

export function getDict(locale: Locale): Dict {
  return dicts[locale];
}

/** Dictionnaire typé de la langue courante : `const t = useT(); t.today.hello` (autocomplétion + erreurs de compilation). */
export function useT(): Dict {
  const locale = useApp((s) => s.locale);
  return dicts[locale];
}

/** Interpolation minimale : fmt('Bonjour {name}', { name: 'Salma' }). */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => (key in vars ? String(vars[key]) : `{${key}}`));
}
