// Web : pas de rappel local fiable (Web Push = service worker + serveur, prévu pour le MVP).
// Ce fichier évite d'embarquer expo-notifications dans le bundle web.
export const remindersSupported = false;

export type ReminderResult = 'scheduled' | 'off' | 'denied';

export async function scheduleDailyReminder(_time: string | null, _content: { title: string; body: string }): Promise<ReminderResult> {
  return 'off';
}
