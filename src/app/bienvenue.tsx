// Porte d'entrée : un compte e-mail est obligatoire pour utiliser PlushUp (seul le profil démo y échappe).
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { LanguageSwitch } from '@/components/LanguageSwitch';
import { Txt } from '@/components/Txt';
import { WaveBand, WaveMark } from '@/components/Wave';
import { Button, Card, Field, Screen } from '@/components/ui';
import { useT } from '@/i18n';
import { authMessage, type AuthMessage } from '@/lib/authMessages';
import { cloudConfigured, createAccount, resendConfirmation, signIn, type AuthOutcome } from '@/lib/cloud';
import { todayKey } from '@/lib/dates';
import { generateDemoData } from '@/lib/demo';
import { useApp } from '@/store/useApp';
import { colors, space } from '@/theme/tokens';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Bienvenue() {
  const t = useT();
  const startDemo = useApp((s) => s.startDemo);
  const lastEmail = useApp((s) => s.lastAccountEmail);
  const [mode, setMode] = useState<'create' | 'login'>(lastEmail ? 'login' : 'create');
  const [email, setEmail] = useState(lastEmail ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<AuthOutcome | null>(null);
  const [message, setMessage] = useState<AuthMessage>(null);

  const cleanEmail = email.trim().toLowerCase();
  const canSubmit = cloudConfigured && EMAIL_RE.test(cleanEmail) && password.length >= (mode === 'create' ? 8 : 1);

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setMessage(null);
    const res = mode === 'create' ? await createAccount(cleanEmail, password) : await signIn(cleanEmail, password);
    setBusy(false);
    setOutcome(res);
    setMessage(authMessage(t, res, cleanEmail));
    // Adresse à confirmer : on prépare la connexion qui suivra le clic sur le lien.
    if (res === 'check-email') {
      setMode('login');
      setPassword('');
    }
    // 'ok' : le garde de navigation (layout racine) bascule seul vers l'onboarding ou l'app.
  };

  const resend = async () => {
    setBusy(true);
    const res = await resendConfirmation(cleanEmail);
    setBusy(false);
    setMessage(res === 'check-email' ? { text: t.auth.resent, error: false } : authMessage(t, res, cleanEmail));
  };

  // Profil exemple (pitch, salons, tests) : 3 semaines d'historique, jamais synchronisé.
  const openDemo = () => {
    startDemo(generateDemoData(todayKey()));
    router.replace('/');
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: space.md, marginTop: space.xl }}>
        <WaveMark size={72} />
        <Txt variant="hero" center>
          plushup
        </Txt>
      </View>

      <Card tone="mint" style={{ marginTop: space.lg, paddingBottom: 0, overflow: 'hidden' }}>
        <Txt variant="h2">{t.onboarding.welcomeTitle}</Txt>
        <Txt variant="small" color={colors.muted}>
          {t.onboarding.welcomeBody}
        </Txt>
        <WaveBand color={colors.mint} height={22} style={{ marginHorizontal: -space.lg }} />
      </Card>

      <View style={{ marginTop: space.lg }}>
        <LanguageSwitch />
      </View>

      <Card style={{ marginTop: space.lg }}>
        <Txt variant="title">{mode === 'create' ? t.auth.createTitle : t.auth.loginTitle}</Txt>
        {cloudConfigured ? (
          <>
            <Txt variant="small" color={colors.muted}>
              {t.auth.intro}
            </Txt>
            <Field
              label={t.account.email}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              maxLength={254}
            />
            <Field
              label={t.account.password}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
              textContentType={mode === 'create' ? 'newPassword' : 'password'}
              onSubmitEditing={() => void submit()}
            />
            {message ? (
              <View accessibilityLiveRegion="polite" style={{ gap: space.sm }}>
                <Txt variant="small" color={message.error ? colors.alert : colors.teal}>
                  {message.text}
                </Txt>
                {outcome === 'check-email' || outcome === 'not-confirmed' ? (
                  <Button label={t.auth.resend} variant="secondary" small onPress={() => void resend()} disabled={busy} />
                ) : null}
              </View>
            ) : null}
            <Button label={mode === 'create' ? t.auth.create : t.auth.login} onPress={() => void submit()} loading={busy} disabled={!canSubmit} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setMode((m) => (m === 'create' ? 'login' : 'create'));
                setMessage(null);
                setOutcome(null);
              }}
              style={{ paddingVertical: space.sm, alignItems: 'center' }}
            >
              <Txt variant="small" weight="semibold" color={colors.teal}>
                {mode === 'create' ? t.auth.toLogin : t.auth.toCreate}
              </Txt>
            </Pressable>
            <Txt variant="caption" color={colors.muted} center>
              {t.auth.privacy}
            </Txt>
          </>
        ) : (
          <Txt variant="small" color={colors.alert}>
            {t.auth.cloudMissing}
          </Txt>
        )}
      </Card>

      <View style={{ marginTop: space.lg, gap: space.xs }}>
        <Button label={t.demo.cta} variant="ghost" small onPress={openDemo} />
        <Link href="/securite" asChild>
          <Pressable accessibilityRole="link" style={{ paddingVertical: space.sm, alignItems: 'center' }}>
            <Txt variant="small" color={colors.teal} style={{ textDecorationLine: 'underline' }}>
              {t.onboarding.safetyLink}
            </Txt>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
