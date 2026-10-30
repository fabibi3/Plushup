import { router } from 'expo-router';
import { View } from 'react-native';

import { LanguageSwitch } from '@/components/LanguageSwitch';
import { Txt } from '@/components/Txt';
import { WaveMark } from '@/components/Wave';
import { Card, Divider, ListRow, Screen, Section } from '@/components/ui';
import { fmt, useT } from '@/i18n';
import { APP_VERSION } from '@/lib/constants';
import { useApp } from '@/store/useApp';
import { colors, space } from '@/theme/tokens';

export default function Moi() {
  const t = useT();
  const profile = useApp((s) => s.profile);
  const account = useApp((s) => s.account);
  const demo = useApp((s) => s.demo);

  const accountValue = demo ? t.demo.banner : (account.email ?? '');

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.lg }}>
        <WaveMark size={52} />
        <View style={{ flex: 1 }}>
          <Txt variant="title">{profile.firstName || t.me.title}</Txt>
          {profile.size ? (
            <Txt variant="small" color={colors.muted}>
              {t.onboarding.sizeTitle} : {profile.size}
            </Txt>
          ) : null}
        </View>
      </View>

      <Card style={{ marginTop: space.lg, padding: space.xs, gap: 0 }}>
        <ListRow icon="user" label={t.me.profile} onPress={() => router.push('/profil')} />
        <Divider />
        <ListRow icon="bell" label={t.me.reminder} value={profile.reminderTime ?? t.me.reminderOff} onPress={() => router.push('/profil')} />
        <Divider />
        <ListRow icon="box" label={t.me.order} onPress={() => router.push('/commande')} />
      </Card>

      <Section title={t.me.language}>
        <LanguageSwitch />
      </Section>

      <Card style={{ marginTop: space.xl, padding: space.xs, gap: 0 }}>
        <ListRow icon="cloud" label={t.me.account} value={accountValue} onPress={() => router.push('/compte')} />
        <Divider />
        <ListRow icon="data" label={t.me.data} onPress={() => router.push('/donnees')} />
        <Divider />
        <ListRow icon="shield" label={t.me.safety} onPress={() => router.push('/securite')} />
      </Card>

      <Section title={t.about.title}>
        <Txt variant="small" color={colors.muted}>
          {t.about.body}
        </Txt>
        <Txt variant="small" color={colors.muted}>
          {t.about.privacy}
        </Txt>
        <Txt variant="small" color={colors.muted}>
          {t.common.disclaimer}
        </Txt>
        <Txt variant="caption" color={colors.muted}>
          {fmt(t.me.version, { v: APP_VERSION })}
        </Txt>
      </Section>
    </Screen>
  );
}
