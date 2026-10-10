import { Tabs } from 'expo-router/tabs';
import type { ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { fontFamily } from '@/theme/fonts';
import { colors } from '@/theme/tokens';

const icon =
  (name: IconName) =>
  ({ color }: { color: ColorValue }) => <Icon name={name} color={color as string} size={24} />;

export default function TabsLayout() {
  const t = useT();
  const locale = useApp((s) => s.locale);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.deep,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, minHeight: 60 },
        tabBarLabelStyle: { fontFamily: fontFamily(locale, 'semibold'), fontSize: 11 },
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabs.today, tabBarIcon: icon('today') }} />
      <Tabs.Screen name="programme" options={{ title: t.tabs.program, tabBarIcon: icon('program') }} />
      <Tabs.Screen name="progres" options={{ title: t.tabs.progress, tabBarIcon: icon('progress') }} />
      <Tabs.Screen name="moi" options={{ title: t.tabs.me, tabBarIcon: icon('me') }} />
    </Tabs>
  );
}
