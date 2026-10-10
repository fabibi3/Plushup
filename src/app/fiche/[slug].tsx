import { Redirect, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { Card, Header, Screen } from '@/components/ui';
import { getFiche } from '@/content/fiches';
import { fmt, useT } from '@/i18n';
import { useApp } from '@/store/useApp';
import { colors, space } from '@/theme/tokens';

export default function Fiche() {
  const t = useT();
  const locale = useApp((s) => s.locale);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const fiche = getFiche(slug ?? '');
  if (!fiche) return <Redirect href="/programme" />;

  return (
    <Screen>
      <Header />
      <View style={{ gap: space.md }}>
        <Txt style={{ fontSize: 44, lineHeight: 56 }}>{fiche.emoji}</Txt>
        <Txt variant="title">{fiche.title[locale]}</Txt>
        <Txt variant="caption" color={colors.muted}>
          {fmt(t.fiches.minutes, { n: fiche.minutes })}
        </Txt>
      </View>
      <Card style={{ marginTop: space.lg, gap: space.lg }}>
        {fiche.paragraphs.map((p, i) => (
          <Txt key={i}>{p[locale]}</Txt>
        ))}
      </Card>
      <Txt variant="small" color={colors.muted} style={{ marginTop: space.lg }}>
        {t.common.disclaimer}
      </Txt>
    </Screen>
  );
}
