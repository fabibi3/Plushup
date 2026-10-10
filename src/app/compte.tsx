import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Txt } from '@/components/Txt';
import { Button, Card, confirm, Field, Header, Screen } from '@/components/ui';
import { fmt, useT } from '@/i18n';
import { cloudConfigured, createAccount, signIn, signOut, syncNow, type AuthOutcome } from '@/lib/cloud';
import { useApp } from '@/store/useApp';
import { colors, space } from '@/theme/tokens';

export default function Compte() {
  const t = useT();
  const account = useApp((s) => s.account);
  const lastSyncedAt = useApp((s) => s.lastSyncedAt);
  const syncing = useApp((s) => s.syncing);
  const [mode, setMode] = useState<'create' | 'login'>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const messages: Record<AuthOutcome, { text: string; error: boolean } | null> = {
    ok: null,
    'check-email': { text: t.account.checkEmail, error: false },
    invalid: { text: t.account.errors.invalid, error: true },
    weak: { text: t.account.errors.weak, error: true },
    exists: { text: t.account.errors.exists, error: true },
    network: { text: t.account.errors.network, error: true },
    error: { text: t.account.errors.generic, error: true },
    disabled: { text: t.account.cloudOff, error: true },
  };

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    const outcome = mode === 'create' ? await createAccount(email.trim(), password) : await signIn(email.trim(), password);
    setBusy(false);
    setMessage(messages[outcome]);
    if (outcome === 'ok') setPassword('');
  };

  const onSync = async () => {
    const res = await syncNow();
    if (res === 'offline') setMessage({ text: t.account.errors.network, error: true });
    else if (res === 'error') setMessage({ text: t.account.errors.generic, error: true });
  };

  const onLogout = async () => {
    if (await confirm(t.account.logoutConfirm, t.account.logout, t.common.cancel)) await signOut();
  };

  const status = !cloudConfigured
    ? t.account.cloudOff
    : account.mode === 'email'
      ? fmt(t.account.signedIn, { email: account.email ?? '' })
      : account.mode === 'anonymous'
        ? t.account.anonymous
        : t.account.localOnly;

  const when = lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : t.account.never;

  return (
    <Screen>
      <Header title={t.account.title} />

      <Card tone="mint">
        <Txt>{status}</Txt>
        {account.mode !== 'local' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Txt variant="small" color={colors.muted} style={{ flex: 1 }}>
              {fmt(t.account.lastSync, { when })}
            </Txt>
            <Button label={syncing ? t.account.syncing : t.account.syncNow} variant="secondary" small loading={syncing} onPress={() => void onSync()} />
          </View>
        ) : null}
      </Card>

      {cloudConfigured && account.mode !== 'email' ? (
        <Card style={{ marginTop: space.lg }}>
          <Field label={t.account.email} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
          <Field
            label={t.account.password}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
            textContentType={mode === 'create' ? 'newPassword' : 'password'}
          />
          {message ? (
            <Txt variant="small" color={message.error ? colors.alert : colors.teal}>
              {message.text}
            </Txt>
          ) : null}
          <Button
            label={mode === 'create' ? t.account.create : t.account.login}
            onPress={() => void submit()}
            loading={busy}
            disabled={email.trim() === '' || password === ''}
          />
          <Pressable accessibilityRole="button" onPress={() => setMode((m) => (m === 'create' ? 'login' : 'create'))} style={{ paddingVertical: space.sm, alignItems: 'center' }}>
            <Txt variant="small" weight="semibold" color={colors.teal}>
              {mode === 'create' ? t.account.switchToLogin : t.account.switchToCreate}
            </Txt>
          </Pressable>
        </Card>
      ) : null}

      {account.mode === 'email' ? (
        <View style={{ marginTop: space.lg, gap: space.sm }}>
          {message ? (
            <Txt variant="small" color={message.error ? colors.alert : colors.teal}>
              {message.text}
            </Txt>
          ) : null}
          <Button label={t.account.logout} variant="secondary" onPress={() => void onLogout()} />
        </View>
      ) : null}
    </Screen>
  );
}
