// Rappels locaux (natif) : aucune infra serveur, fonctionnent hors ligne.
// Message volontairement neutre (téléphones partagés) : aucune mention de santé.
// expo-notifications est chargé à la demande : pas de coût au démarrage, et pas d'avertissement
// « push indisponible » d'Expo Go tant que l'utilisatrice ne règle pas de rappel.
import { Platform } from 'react-native';

export const remindersSupported = true;

export type ReminderResult = 'scheduled' | 'off' | 'denied';

let handlerSet = false;

export async function scheduleDailyReminder(time: string | null, content: { title: string; body: string }): Promise<ReminderResult> {
  const Notifications = await import('expo-notifications');
  if (!handlerSet) {
    handlerSet = true;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!time) return 'off';

  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) ({ granted } = await Notifications.requestPermissionsAsync());
  if (!granted) return 'denied';

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Rappels',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const [hour = 21, minute = 0] = time.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    content,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'reminders' },
  });
  return 'scheduled';
}
