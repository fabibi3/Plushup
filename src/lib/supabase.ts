import './polyfills';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthClient } from '@supabase/auth-js';
import { PostgrestClient } from '@supabase/postgrest-js';
import { AppState, Platform } from 'react-native';

import type { Database } from './database.types';

// Optimisation : on n'embarque que l'authentification et l'accès base (PostgREST).
// supabase-js tirerait aussi Storage, Realtime, Functions… (~300 Ko de source inutiles pour la V0).

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

function createLeanClient(baseUrl: string, apiKey: string) {
  const ref = new URL(baseUrl).hostname.split('.')[0];
  const auth = new AuthClient({
    url: `${baseUrl}/auth/v1`,
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    storageKey: `sb-${ref}-auth-token`,
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Web : finalise la confirmation d'e-mail quand on revient sur l'app via le lien.
    detectSessionInUrl: Platform.OS === 'web',
  });

  // Même logique que supabase-js : le JWT de la session (sinon la clé publique) part dans chaque requête.
  const fetchWithAuth: typeof fetch = async (input, init) => {
    const { data } = await auth.getSession();
    const headers = new Headers(init?.headers);
    headers.set('apikey', apiKey);
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${data.session?.access_token ?? apiKey}`);
    return fetch(input, { ...init, headers });
  };

  const db = new PostgrestClient<Database>(`${baseUrl}/rest/v1`, { fetch: fetchWithAuth });
  return { auth, from: db.from.bind(db) };
}

/**
 * Client Supabase, ou `null` si non configuré : l'app reste alors 100 % fonctionnelle en local.
 * C'est volontaire — une connexion lente ou absente ne doit jamais bloquer le check-in.
 */
export const supabase = url && key ? createLeanClient(url, key) : null;

// Natif : on ne rafraîchit le jeton que lorsque l'app est au premier plan (batterie + données).
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void supabase.auth.startAutoRefresh();
    else void supabase.auth.stopAutoRefresh();
  });
}

export const functionsUrl = url ? `${url}/functions/v1` : null;
