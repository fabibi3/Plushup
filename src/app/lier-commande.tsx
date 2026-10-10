// Liaison de commande : numéro + téléphone (le téléphone est l'identifiant fiable en paiement à la livraison).
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { Button, Card, Field, Header, Screen } from '@/components/ui';
import { useT } from '@/i18n';
import { linkOrder, type LinkOutcome } from '@/lib/cloud';
import { WHATSAPP_URL } from '@/lib/constants';
import { success } from '@/lib/haptics';
import { colors, space } from '@/theme/tokens';

export default function LierCommande() {
  const t = useT();
  const [orderName, setOrderName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<LinkOutcome | null>(null);

  const submit = async () => {
    setBusy(true);
    const res = await linkOrder(orderName, phone);
    setBusy(false);
    setOutcome(res);
    if (res === 'ok') {
      success();
      router.back();
    }
  };

  const error =
    outcome && outcome !== 'ok'
      ? outcome === 'network'
        ? t.account.errors.network
        : outcome === 'error'
          ? t.account.errors.generic
          : t.link.errors[outcome]
      : null;

  return (
    <Screen footer={<Button label={t.link.submit} onPress={() => void submit()} loading={busy} disabled={!orderName.trim() || phone.replace(/\D/g, '').length < 9} />}>
      <Header title={t.link.title} />
      <Txt color={colors.muted}>{t.link.intro}</Txt>
      <Card style={{ marginTop: space.lg }}>
        <Field label={t.link.orderNumber} value={orderName} onChangeText={setOrderName} placeholder={t.link.orderPlaceholder} keyboardType="number-pad" maxLength={12} />
        <Field label={t.link.phone} value={phone} onChangeText={setPhone} placeholder={t.link.phonePlaceholder} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" maxLength={20} />
        {error ? (
          <View style={{ gap: space.sm }}>
            <Txt variant="small" color={colors.alert}>
              {error}
            </Txt>
            {outcome === 'not_configured' || outcome === 'already_linked' ? (
              <Button label={t.order.whatsapp} variant="secondary" small icon="whatsapp" onPress={() => void Linking.openURL(WHATSAPP_URL)} />
            ) : null}
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
