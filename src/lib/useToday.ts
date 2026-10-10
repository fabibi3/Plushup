import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayKey, type DateKey } from './dates';

/** Clé du jour, recalculée au retour au premier plan et à minuit (app laissée ouverte). */
export function useToday(): DateKey {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const refresh = () => setToday((cur) => (cur === todayKey() ? cur : todayKey()));
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const id = setInterval(refresh, 60_000);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, []);
  return today;
}
