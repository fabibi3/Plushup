import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { Card, Header, Screen, Section } from '@/components/ui';
import { useT } from '@/i18n';
import { colors, space } from '@/theme/tokens';

export default function Securite() {
  const t = useT();
  return (
    <Screen>
      <Header title={t.safety.title} />
      <Txt color={colors.muted}>{t.safety.intro}</Txt>

      <Card style={{ marginTop: space.lg, backgroundColor: colors.alertSoft }}>
        <Txt variant="h2" color={colors.alert}>
          {t.safety.urgentTitle}
        </Txt>
        <Bullets items={t.safety.urgent} color={colors.alert} />
      </Card>

      <Section title={t.safety.adviceTitle}>
        <Card>
          <Bullets items={t.safety.advice} />
        </Card>
      </Section>

      <Section title={t.safety.wearTitle}>
        <Card tone="mint">
          <Bullets items={t.safety.wear} />
        </Card>
      </Section>

      <Txt variant="small" color={colors.muted} style={{ marginTop: space.xl }}>
        {t.common.disclaimer}
      </Txt>
    </Screen>
  );
}

function Bullets({ items, color = colors.ink }: { items: readonly string[]; color?: string }) {
  return (
    <View style={{ gap: space.sm }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: space.sm }}>
          <Txt color={color}>•</Txt>
          <Txt color={color} style={{ flex: 1 }}>
            {item}
          </Txt>
        </View>
      ))}
    </View>
  );
}
