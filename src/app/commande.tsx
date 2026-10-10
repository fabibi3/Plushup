// « Ma commande » : services après-achat (taille, enfilage, entretien, réachat).
// La liaison à la commande Shopify arrive au MVP (table linked_orders déjà prête côté Supabase).
import * as Linking from 'expo-linking';
import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { Button, Card, Header, Screen, Section } from '@/components/ui';
import { SIZE_GUIDE } from '@/content/sizes';
import { useT } from '@/i18n';
import { SHOP_URL, WHATSAPP_URL } from '@/lib/constants';
import { useApp } from '@/store/useApp';
import { colors, radius, space } from '@/theme/tokens';

export default function Commande() {
  const t = useT();
  const size = useApp((s) => s.profile.size);

  return (
    <Screen>
      <Header title={t.order.title} />

      <Card tone="mint">
        <Txt variant="small">{t.order.linkSoon}</Txt>
      </Card>

      <Section title={t.order.sizeGuide}>
        <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
          <Row cells={t.order.sizeCols} header />
          {SIZE_GUIDE.map((r) => (
            <Row key={r.size} cells={[r.size, `${r.waist} cm`, `${r.hips} cm`]} highlight={r.size === size} />
          ))}
        </Card>
        <Txt variant="small" color={colors.muted}>
          {t.order.sizeGuideNote}
        </Txt>
      </Section>

      <Section title={t.order.howToWear}>
        <Steps items={t.order.howToWearSteps} />
      </Section>

      <Section title={t.order.care}>
        <Steps items={t.order.careSteps} />
      </Section>

      <View style={{ gap: space.sm, marginTop: space.xl }}>
        <Button label={t.order.reorder} icon="box" onPress={() => void Linking.openURL(SHOP_URL)} />
        <Txt variant="small" color={colors.muted} center>
          {t.order.reorderHint}
        </Txt>
        <Button label={t.order.whatsapp} variant="secondary" icon="whatsapp" onPress={() => void Linking.openURL(WHATSAPP_URL)} />
      </View>
    </Screen>
  );
}

function Row({ cells, header, highlight }: { cells: readonly string[]; header?: boolean; highlight?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingVertical: space.md,
        paddingHorizontal: space.md,
        backgroundColor: header ? colors.deep : highlight ? colors.mint : colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      {cells.map((c, i) => (
        <Txt key={i} variant="small" weight={header || highlight ? 'semibold' : 'regular'} color={header ? colors.white : colors.ink} style={{ flex: i === 0 ? 0.7 : 1 }}>
          {c}
        </Txt>
      ))}
    </View>
  );
}

function Steps({ items }: { items: readonly string[] }) {
  return (
    <Card style={{ gap: space.md }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
          <View style={{ width: 26, height: 26, borderRadius: radius.pill, backgroundColor: colors.mintSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="caption">{i + 1}</Txt>
          </View>
          <Txt variant="small" style={{ flex: 1 }}>
            {item}
          </Txt>
        </View>
      ))}
    </Card>
  );
}
