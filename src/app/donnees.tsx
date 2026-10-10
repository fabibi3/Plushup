// Mes données : export (portabilité) et suppression (App Store 5.1.1(v), Play, loi 09-08, RGPD).
import { useState } from 'react';
import { Platform, Share, View } from 'react-native';

import { Txt } from '@/components/Txt';
import { Button, Card, confirm, Header, notify, Screen } from '@/components/ui';
import { fmt, useT } from '@/i18n';
import { deleteAccount } from '@/lib/cloud';
import { useApp } from '@/store/useApp';
import { colors, space } from '@/theme/tokens';

export default function Donnees() {
  const t = useT();
  const consent = useApp((s) => s.wellbeingConsent);
  const [busy, setBusy] = useState(false);

  const exportData = async () => {
    const s = useApp.getState();
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        profile: s.profile,
        locale: s.locale,
        dailyLogs: Object.values(s.logs).map(({ dirty: _d, ...l }) => l),
        measurements: Object.values(s.measurements).map(({ dirty: _d, ...m }) => m),
        programProgress: Object.entries(s.completions).map(([day, c]) => ({ day: Number(day), completedAt: c.completedAt })),
      },
      null,
      2,
    );
    if (Platform.OS === 'web') {
      const blob = new Blob([payload], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `plushup-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } else {
      await Share.share({ message: payload, title: 'PlushUp' });
    }
  };

  const onDelete = async () => {
    if (!(await confirm(t.data.deleteConfirm, t.data.delete, t.common.cancel))) return;
    setBusy(true);
    const res = await deleteAccount();
    setBusy(false);
    if (res === 'ok') notify(t.data.deleted);
    else notify(res === 'network' ? t.account.errors.network : t.account.errors.generic);
  };

  return (
    <Screen>
      <Header title={t.data.title} />
      <Txt color={colors.muted}>{t.data.intro}</Txt>

      <Card style={{ marginTop: space.lg }}>
        <Txt variant="small">{fmt(t.data.consentStatus, { status: consent ? t.data.granted : t.data.revoked })}</Txt>
        <Button label={t.data.export} variant="secondary" icon="data" onPress={() => void exportData()} />
      </Card>

      <View style={{ marginTop: space.xl }}>
        <Button label={t.data.delete} variant="danger" onPress={() => void onDelete()} loading={busy} />
      </View>
    </Screen>
  );
}
