// Texte affiché pour chaque issue d'authentification (partagé par l'écran de connexion et l'écran Compte).
import { fmt } from '@/i18n';
import type { Dict } from '@/i18n/fr';

import type { AuthOutcome } from './authErrors';

export type AuthMessage = { text: string; error: boolean } | null;

export function authMessage(t: Dict, outcome: AuthOutcome, email: string): AuthMessage {
  switch (outcome) {
    case 'ok':
      return null;
    case 'check-email':
      return { text: fmt(t.auth.checkEmail, { email }), error: false };
    case 'not-confirmed':
      return { text: t.auth.notConfirmed, error: true };
    case 'invalid':
      return { text: t.account.errors.invalid, error: true };
    case 'weak':
      return { text: t.account.errors.weak, error: true };
    case 'exists':
      return { text: t.account.errors.exists, error: true };
    case 'not-authorized':
      return { text: t.account.errors.notAuthorized, error: true };
    case 'rate-limit':
      return { text: t.account.errors.rateLimit, error: true };
    case 'network':
      return { text: t.account.errors.network, error: true };
    case 'disabled':
      return { text: t.auth.cloudMissing, error: true };
    default:
      return { text: t.account.errors.generic, error: true };
  }
}
