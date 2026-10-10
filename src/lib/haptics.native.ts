import * as Haptics from 'expo-haptics';

export const hapticsSupported = true;

export const tapLight = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
export const pulse = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
export const success = () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
