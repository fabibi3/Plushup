import { describe, expect, it } from 'vitest';

import { mapAuthError } from '@/lib/authErrors';

describe('mapAuthError', () => {
  it.each([
    ['invalid_credentials', 'invalid'],
    ['email_address_invalid', 'invalid'],
    ['weak_password', 'weak'],
    ['user_already_exists', 'exists'],
    ['email_exists', 'exists'],
    ['email_not_confirmed', 'not-confirmed'],
    ['email_address_not_authorized', 'not-authorized'],
    ['over_email_send_rate_limit', 'rate-limit'],
    ['over_request_rate_limit', 'rate-limit'],
  ])('%s → %s', (code, outcome) => {
    expect(mapAuthError({ code, message: 'x', name: 'AuthApiError' })).toBe(outcome);
  });

  it('reconnaît une coupure réseau', () => {
    expect(mapAuthError({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' })).toBe('network');
    expect(mapAuthError({ message: 'TypeError: Failed to fetch' })).toBe('network');
  });

  it('reconnaît les messages Supabase quand le code est absent', () => {
    expect(mapAuthError({ message: 'Email address "a@b.co" cannot be used as it is not authorized' })).toBe('not-authorized');
    expect(mapAuthError({ message: 'email rate limit exceeded' })).toBe('rate-limit');
    expect(mapAuthError({ message: 'Email not confirmed' })).toBe('not-confirmed');
    expect(mapAuthError({ message: 'Invalid login credentials' })).toBe('invalid');
    expect(mapAuthError({ message: 'User already registered' })).toBe('exists');
  });

  it('retombe sur une erreur générique sinon', () => {
    expect(mapAuthError({ code: 'unexpected_failure', message: 'boom' })).toBe('error');
  });
});
