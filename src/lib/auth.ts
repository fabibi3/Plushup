// Comptes : stratégie « zéro friction ».
// 1. À la fin de l'onboarding → session ANONYME (si activée dans Supabase) : sauvegarde en ligne sans rien demander.
// 2. Plus tard, l'utilisatrice ajoute un e-mail → le compte anonyme est CONVERTI (mêmes données, même user_id).
// 3. Si Supabase n'est pas configuré ou l'anonyme désactivé → mode local, l'app marche quand même.
import type { AuthError, Session } from '@supabase/auth-js';
import { Platform } from 'react-native';

import { useApp } from '@/store/useApp';

import { functionsUrl, supabase } from './supabase';
import { requestSync, syncNow } from './sync';

export type AuthOutcome = 'ok' | 'check-email' | 'invalid' | 'weak' | 'exists' | 'network' | 'error' | 'disabled';

function applySession(session: Session | null) {
  const user = session?.user;
  useApp.getState().setAccount(
    !user
      ? { mode: 'local', email: null }
      : user.is_anonymous
        ? { mode: 'anonymous', email: null }
        : { mode: 'email', email: user.email ?? null },
  );
}

function mapError(error: AuthError | Error): AuthOutcome {
  const code = (error as AuthError).code;
  if (code === 'invalid_credentials' || code === 'email_address_invalid') return 'invalid';
  if (code === 'weak_password') return 'weak';
  if (code === 'user_already_exists' || code === 'email_exists') return 'exists';
  if (code === 'email_not_confirmed') return 'check-email';
  if (error.name === 'AuthRetryableFetchError' || /fetch|network/i.test(error.message)) return 'network';
  return 'error';
}

let initialized = false;

/** À appeler une fois au démarrage. */
export async function initAuth(): Promise<void> {
  if (!supabase || initialized) return;
  initialized = true;
  supabase.auth.onAuthStateChange((_event, session) => applySession(session));
  const { data } = await supabase.auth.getSession();
  applySession(data.session);
  if (data.session) requestSync(0);
  else if (useApp.getState().profile.onboardedAt) await ensureAnonymousSession();
}

/** Crée une session anonyme si aucune session n'existe. Silencieux en cas d'échec (mode local). */
export async function ensureAnonymousSession(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { data: signIn, error } = await supabase.auth.signInAnonymously();
  if (error) {
    if (__DEV__) console.info('[auth] mode local :', error.code ?? error.message);
    return;
  }
  applySession(signIn.session);
  requestSync(0);
}

const redirectTo = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined);

export async function createAccount(email: string, password: string): Promise<AuthOutcome> {
  if (!supabase) return 'disabled';
  if (password.length < 8) return 'weak';
  const { data } = await supabase.auth.getSession();
  if (data.session?.user.is_anonymous) {
    // Conversion anonyme → e-mail : conserve user_id et toutes les données déjà synchronisées.
    const { error } = await supabase.auth.updateUser({ email, password }, { emailRedirectTo: redirectTo() });
    if (error) return mapError(error);
    const { data: fresh } = await supabase.auth.getUser();
    applySession((await supabase.auth.getSession()).data.session);
    return fresh.user?.email === email ? 'ok' : 'check-email';
  }
  const { data: signUp, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
  if (error) return mapError(error);
  if (!signUp.session) return 'check-email';
  useApp.getState().markAllDirty();
  void syncNow();
  return 'ok';
}

export async function signIn(email: string, password: string): Promise<AuthOutcome> {
  if (!supabase) return 'disabled';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return mapError(error);
  // Nouveau compte sur cet appareil : on fusionne le local dans le compte puis on récupère tout.
  useApp.getState().markAllDirty();
  void syncNow();
  return 'ok';
}

/** Déconnexion : on pousse ce qui reste, puis on efface ce téléphone (téléphones partagés). */
export async function signOut(): Promise<void> {
  if (supabase) {
    await syncNow();
    await supabase.auth.signOut();
  }
  useApp.getState().resetAll();
}

/** Suppression définitive : compte serveur (Edge Function → cascade SQL) + données locales. */
export async function deleteAccount(): Promise<'ok' | 'network' | 'error'> {
  if (supabase && functionsUrl) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      try {
        const res = await fetch(`${functionsUrl}/delete-account`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) return 'error';
      } catch {
        return 'network';
      }
      await supabase.auth.signOut({ scope: 'local' });
    }
  }
  useApp.getState().resetAll();
  return 'ok';
}
