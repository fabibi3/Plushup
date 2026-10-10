// « Ma commande » : le cœur business de l'app (réachat, avis, parrainage) + services après-achat.
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { View } from 'react-native';

import { ProductImage } from '@/components/ProductImage';
import { Txt } from '@/components/Txt';
import { Button, Card, Header, Screen, Section } from '@/components/ui';
import { SIZE_GUIDE } from '@/content/sizes';
import { fmt, useT } from '@/i18n';
import { cartUrl, PRODUCT_PRICE_MAD, PRODUCT_URL, referralUrl, WHATSAPP_URL } from '@/lib/constants';
import { diffDays, formatLongDate, todayKey, toKey } from '@/lib/dates';
import { shareOnWhatsApp } from '@/lib/share';
import { useApp } from '@/store/useApp';
import { colors, radius, space } from '@/theme/tokens';

export default function Commande() {
  const t = useT();
  const size = useApp((s) => s.profile.size);
  const order = useApp((s) => s.linkedOrder);
  const referralCode = useApp((s) => s.referralCode);
  const completed = useApp((s) => Object.keys(s.completions).length);

  const deliveredKey = order?.deliveredAt ? toKey(new Date(order.deliveredAt)) : null;
  const daysSince = deliveredKey ? diffDays(deliveredKey, todayKey()) : null;
  // Moment de vérité pour l'avis : ~10 jours après livraison ou 7 routines faites (ressenti positif installé).
  const askReview = (daysSince != null && daysSince >= 10) || completed >= 7;

  return (
    <Screen>
      <Header title={t.order.title} />

      {/* Commande liée */}
      {order ? (
        <Card style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
          <ProductImage size={72} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt weight="semibold">{fmt(t.order.linked, { name: order.orderName })}</Txt>
            <Txt variant="small" color={colors.muted}>
              {order.status === 'delivered' && deliveredKey
                ? fmt(t.order.statusDelivered, { date: formatLongDate(deliveredKey, t.days.long, t.months) })
                : order.status === 'cancelled'
                  ? t.order.statusCancelled
                  : t.order.statusPending}
            </Txt>
            {order.size || size ? (
              <Txt variant="small" color={colors.muted}>
                {fmt(t.order.sizeLabel, { size: order.size ?? size ?? '' })}
              </Txt>
            ) : null}
            {daysSince != null && daysSince > 0 ? (
              <Txt variant="small" weight="semibold" color={colors.teal}>
                {fmt(t.order.sinceDelivery, { n: daysSince })}
              </Txt>
            ) : null}
          </View>
        </Card>
      ) : (
        <Card tone="mint">
          <Txt variant="h2">{t.order.linkCta}</Txt>
          <Txt variant="small" color={colors.muted}>
            {t.order.linkHint}
          </Txt>
          <Button label={t.order.linkCta} icon="box" onPress={() => router.push('/lier-commande')} />
        </Card>
      )}

      {/* Réachat — 2e paire */}
      <Card tone="deep" style={{ marginTop: space.lg }}>
        <Txt variant="h2" color={colors.white}>
          {t.order.reorderTitle}
        </Txt>
        <Txt color={colors.mint}>{t.order.reorderBody}</Txt>
        <Txt weight="semibold" color={colors.white}>
          {fmt(t.order.reorderPrice, { price: PRODUCT_PRICE_MAD })}
        </Txt>
        <Button label={t.order.reorderCta} variant="secondary" icon="box" onPress={() => void Linking.openURL(cartUrl(1, referralCode))} />
      </Card>

      {/* Avis au bon moment */}
      {askReview ? (
        <Card style={{ marginTop: space.lg }}>
          <Txt variant="h2">⭐ {t.order.reviewTitle}</Txt>
          <Txt variant="small" color={colors.muted}>
            {t.order.reviewBody}
          </Txt>
          <Button label={t.order.reviewCta} variant="secondary" onPress={() => void Linking.openURL(`${PRODUCT_URL}#reviews`)} />
        </Card>
      ) : null}

      {/* Parrainage */}
      <Card tone="mint" style={{ marginTop: space.lg }}>
        <Txt variant="h2">🎁 {t.order.referralTitle}</Txt>
        <Txt variant="small" color={colors.muted}>
          {t.order.referralBody}
        </Txt>
        {referralCode ? (
          <Txt variant="caption" color={colors.teal}>
            {fmt(t.order.referralCode, { code: referralCode })}
          </Txt>
        ) : null}
        <Button
          label={t.order.referralCta}
          icon="whatsapp"
          onPress={() => void shareOnWhatsApp(`${t.order.referralText} ${referralUrl(referralCode || 'APP')}`)}
        />
      </Card>

      <Section title={t.order.sizeGuide}>
        <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
          <Row cells={t.order.sizeCols} header />
          {SIZE_GUIDE.map((r) => (
            <Row key={r.size} cells={[r.size, `${r.waist} cm`, `${r.hips} cm`]} highlight={r.size === (order?.size ?? size)} />
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

      <View style={{ marginTop: space.xl }}>
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
