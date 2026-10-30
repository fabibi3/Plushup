// Comptes : un compte e-mail est OBLIGATOIRE pour utiliser l'app (hors mode démo).
// - Création : e-mail + mot de passe ; si Supabase exige la confirmation d'adresse, l'utilisatrice confirme puis se connecte.
// - La session est conservée sur l'appareil : une fois connectée, l'app s'ouvre et fonctionne hors ligne.
// - Les données de deux comptes ne sont jamais mélangées sur un même téléphone (voir prepareLocalDataFor).
import type { Session } from '@supabase/auth-js';
import { Platform } from 'react-native';

import { useApp } from '@/store/useApp';

import { mapAuthError, type AuthOutcome } from './authErrors';
import { functionsUrl, supabase } from './supabase';
import { requestSync, syncNow } from './sync';

export type { AuthOutcome } from './authErrors';

function applySession(session: Session | null) {
  const user = session?.user;
  // Seul un compte e-mail donne accès à l'app (une ancienne session anonyme ne suffit plus).
  useApp.getState().setAccount(user && !user.is_anonymous && user.email ? { mode: 'email', email: user.email } : { mode: 'local', email: null });
}

let initialized = false;

/** À appeler une fois au démarrage : aligne le compte persisté sur la session réelle. */
export async function initAuth(): Promise<void> {
  if (!supabase || initialized) return;
  initialized = true;
  supabase.auth.onAuthStateChange((_event, session) => applySession(session));
  const { data } = await supabase.auth.getSession();
  applySession(data.session);
  if (data.session) requestSync(0);
}

/**
 * Avant de connecter un compte sur ce téléphone : si des données locales appartiennent à un AUTRE compte
 * (session expirée sans déconnexion, téléphone partagé…), on les efface au lieu de les fusionner.
 */
function prepareLocalDataFor(email: string, previousEmail: string | null) {
  const { resetAll, markAllDirty } = useApp.getState();
  if (previousEmail && previousEmail.toLowerCase() !== email.toLowerCase()) resetAll();
  else markAllDirty(); // même compte : ce qui n'a pas été envoyé repart vers le serveur
}

/**
 * L'e-mail précédent DOIT être lu avant l'appel réseau : Supabase émet SIGNED_IN (→ setAccount → lastAccountEmail
 * mis à jour) avant que signUp/signIn ne rende la main.
 */
const previousAccountEmail = () => useApp.getState().lastAccountEmail;

const redirectTo = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : undefined);

export async function createAccount(email: string, password: string): Promise<AuthOutcome> {
  if (!supabase) return 'disabled';
  if (password.length < 8) return 'weak';
  const previous = previousAccountEmail();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
  if (error) return mapAuthError(error);
  // Confirmation d'adresse activée : pas de session tant que le lien n'a pas été cliqué.
  if (!data.session) return 'check-email';
  prepareLocalDataFor(email, previous);
  applySession(data.session);
  await syncNow();
  return 'ok';
}

export async function signIn(email: string, password: string): Promise<AuthOutcome> {
  if (!supabase) return 'disabled';
  const previous = previousAccountEmail();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return mapAuthError(error);
  prepareLocalDataFor(email, previous);
  applySession(data.session);
  // Nouveau téléphone : on récupère profil et historique AVANT d'afficher l'app (pas d'onboarding refait pour rien).
  await syncNow();
  return 'ok';
}

/** Renvoie l'e-mail de confirmation (lien expiré ou perdu). */
export async function resendConfirmation(email: string): Promise<AuthOutcome> {
  if (!supabase) return 'disabled';
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo() } });
  return error ? mapAuthError(error) : 'check-email';
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
      // Effacer AVANT la déconnexion : l'écran de connexion qui s'affiche ne doit plus connaître cet e-mail.
      useApp.getState().resetAll();
      await supabase.auth.signOut({ scope: 'local' });
      return 'ok';
    }
  }
  useApp.getState().resetAll();
  return 'ok';
}
