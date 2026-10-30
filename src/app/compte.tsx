// Compte : on y arrive forcément connectée (compte e-mail obligatoire) ou en mode démo.
import { useState } from 'react';
import { View } from 'react-native';

import { Txt } from '@/components/Txt';
import { Button, Card, confirm, Header, Screen } from '@/components/ui';
import { fmt, useT } from '@/i18n';
import { signOut, syncNow } from '@/lib/cloud';
import { useApp } from '@/store/useApp';
import { colors, space } from '@/theme/tokens';

export default function Compte() {
  const t = useT();
  const account = useApp((s) => s.account);
  const demo = useApp((s) => s.demo);
  const resetAll = useApp((s) => s.resetAll);
  const lastSyncedAt = useApp((s) => s.lastSyncedAt);
  const syncing = useApp((s) => s.syncing);
  const [message, setMessage] = useState<string | null>(null);

  const onSync = async () => {
    setMessage(null);
    const res = await syncNow();
    if (res === 'offline') setMessage(t.account.errors.network);
    else if (res === 'error') setMessage(t.account.errors.generic);
  };

  const onLogout = async () => {
    if (!(await confirm(t.account.logoutConfirm, t.account.logout, t.common.cancel))) return;
    if (demo) resetAll();
    else await signOut();
  };

  const when = lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : t.account.never;

  return (
    <Screen>
      <Header title={t.account.title} />

      <Card tone="mint">
        <Txt>{demo ? t.demo.banner : fmt(t.account.signedIn, { email: account.email ?? '' })}</Txt>
        {!demo ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Txt variant="small" color={colors.muted} style={{ flex: 1 }}>
              {fmt(t.account.lastSync, { when })}
            </Txt>
            <Button label={syncing ? t.account.syncing : t.account.syncNow} variant="secondary" small loading={syncing} onPress={() => void onSync()} />
          </View>
        ) : null}
        {message ? (
          <Txt variant="small" color={colors.alert}>
            {message}
          </Txt>
        ) : null}
      </Card>

      <View style={{ marginTop: space.lg }}>
        <Button label={demo ? t.demo.exit : t.account.logout} variant="secondary" onPress={() => void onLogout()} />
      </View>
    </Screen>
  );
}
