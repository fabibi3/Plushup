// Classement des erreurs Supabase Auth en issues lisibles par l'UI (pur, testé dans authErrors.test.ts).
export type AuthOutcome =
  | 'ok'
  | 'check-email'
  | 'not-confirmed'
  | 'invalid'
  | 'weak'
  | 'exists'
  | 'not-authorized'
  | 'rate-limit'
  | 'network'
  | 'error'
  | 'disabled';

type AuthLikeError = { name?: string; message: string; code?: string };

export function mapAuthError(error: AuthLikeError): AuthOutcome {
  const code = error.code;
  if (code === 'invalid_credentials') return 'invalid';
  if (code === 'email_address_invalid' || code === 'validation_failed') return 'invalid';
  if (code === 'weak_password') return 'weak';
  if (code === 'user_already_exists' || code === 'email_exists') return 'exists';
  if (code === 'email_not_confirmed') return 'not-confirmed';
  // SMTP par défaut de Supabase : seuls les membres de l'organisation reçoivent les e-mails.
  if (code === 'email_address_not_authorized') return 'not-authorized';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') return 'rate-limit';
  if (error.name === 'AuthRetryableFetchError' || /fetch|network/i.test(error.message)) return 'network';
  // Repli quand le code n'est pas lisible (anciennes versions d'API, en-têtes masqués par CORS) : messages de Supabase.
  const m = error.message;
  if (/not authorized/i.test(m)) return 'not-authorized';
  if (/rate limit/i.test(m)) return 'rate-limit';
  if (/email not confirmed/i.test(m)) return 'not-confirmed';
  if (/invalid login credentials/i.test(m)) return 'invalid';
  if (/already (been )?registered|already exists/i.test(m)) return 'exists';
  return 'error';
}
