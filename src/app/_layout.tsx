import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WebFrame } from '@/components/WebFrame';
import { initAuth, requestSync } from '@/lib/cloud';
import { applyDirection } from '@/lib/direction';
import { useApp } from '@/store/useApp';
import { arabicFonts, latinFonts } from '@/theme/fonts';
import { colors } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync().catch(() => {});

/** Charge les polices nécessaires à la langue (l'arabe uniquement si besoin). Ne bloque jamais plus de 2,5 s. */
function useFontsFor(locale: 'fr' | 'ar', enabled: boolean) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = Font.loadAsync(locale === 'ar' ? { ...latinFonts, ...arabicFonts } : latinFonts).catch(() => {});
    const timeout = new Promise((r) => setTimeout(r, 2500));
    void Promise.race([load, timeout]).then(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [locale, enabled]);
  return ready;
}

export default function RootLayout() {
  const hydrated = useApp((s) => s.hydrated);
  const locale = useApp((s) => s.locale);
  const onboarded = useApp((s) => s.profile.onboardedAt != null);
  const fontsReady = useFontsFor(locale, hydrated);
  const [directionOk, setDirectionOk] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    // Si le natif doit redémarrer pour passer en RTL, on garde le splash affiché.
    if (!applyDirection(locale)) setDirectionOk(true);
  }, [hydrated, locale]);

  useEffect(() => {
    if (!hydrated) return;
    void initAuth();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && requestSync(0));
    return () => sub.remove();
  }, [hydrated]);

  const ready = hydrated && fontsReady && directionOk;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <WebFrame>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream }, animation: 'slide_from_right' }}>
          <Stack.Protected guard={!onboarded}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
          <Stack.Protected guard={onboarded}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="checkin" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="routine/[day]" options={{ gestureEnabled: false }} />
            <Stack.Screen name="fiche/[slug]" />
            <Stack.Screen name="profil" />
            <Stack.Screen name="mesures" />
            <Stack.Screen name="commande" />
            <Stack.Screen name="lier-commande" />
            <Stack.Screen name="bilan" />
            <Stack.Screen name="compte" />
            <Stack.Screen name="donnees" />
          </Stack.Protected>
          {/* Toujours accessible (lien depuis l'onboarding). */}
          <Stack.Screen name="securite" />
        </Stack>
      </WebFrame>
    </SafeAreaProvider>
  );
}
