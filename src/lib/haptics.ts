// Web : API Vibration (Android/Chrome uniquement — iOS Safari ne vibre pas, d'où le guidage visuel en priorité).
const vibrate = (pattern: number | number[]) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    // ignoré
  }
};

export const hapticsSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

export const tapLight = () => vibrate(8);
export const pulse = () => vibrate(25);
export const success = () => vibrate([20, 40, 20]);
