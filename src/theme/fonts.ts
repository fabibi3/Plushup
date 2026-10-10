// Poppins n'a PAS de glyphes arabes → on l'associe à Readex Pro (géométrique, même esprit arrondi).
// Optimisation : on ne charge que 3 graisses, et la police arabe seulement si l'arabe est utilisé.
// Imports par graisse (sous-chemins) : seules ces 6 polices entrent dans le build, pas les 24 du paquet.
import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { ReadexPro_400Regular } from '@expo-google-fonts/readex-pro/400Regular';
import { ReadexPro_600SemiBold } from '@expo-google-fonts/readex-pro/600SemiBold';
import { ReadexPro_700Bold } from '@expo-google-fonts/readex-pro/700Bold';

import type { Locale } from '@/i18n';

export type Weight = 'regular' | 'semibold' | 'bold';

export const latinFonts = { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold };
export const arabicFonts = { ReadexPro_400Regular, ReadexPro_600SemiBold, ReadexPro_700Bold };

const families: Record<Locale, Record<Weight, string>> = {
  fr: { regular: 'Poppins_400Regular', semibold: 'Poppins_600SemiBold', bold: 'Poppins_700Bold' },
  ar: { regular: 'ReadexPro_400Regular', semibold: 'ReadexPro_600SemiBold', bold: 'ReadexPro_700Bold' },
};

export const fontFamily = (locale: Locale, weight: Weight) => families[locale][weight];
