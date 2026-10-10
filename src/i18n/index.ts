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

/** Nombre au format marocain/français : virgule décimale (1,4 et non 1.4). */
export const num = (n: number): string => String(n).replace('.', ',');

/** Interpolation minimale : fmt('Bonjour {name}', { name: 'Salma' }). Les nombres sont formatés avec `num`. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in vars)) return `{${key}}`;
    const v = vars[key]!;
    return typeof v === 'number' ? num(v) : v;
  });
}
