// Partage WhatsApp : canal n°1 au Maroc (boucle virale : badges, bilans, parrainage).
import * as Linking from 'expo-linking';
import { Platform, Share } from 'react-native';

import { whatsappShare } from './constants';

export async function shareOnWhatsApp(text: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.open(whatsappShare(text), '_blank', 'noopener');
    return;
  }
  const native = `whatsapp://send?text=${encodeURIComponent(text)}`;
  try {
    if (await Linking.canOpenURL(native)) return void (await Linking.openURL(native));
  } catch {
    // WhatsApp absent → feuille de partage du système.
  }
  await Share.share({ message: text });
}
