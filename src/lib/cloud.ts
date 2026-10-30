// Façade « cloud » chargée à la demande (import dynamique → chunk séparé sur le web).
// Le premier affichage n'attend jamais le code Supabase : une utilisatrice déjà connectée retrouve l'app avant même qu'il soit téléchargé.
import type { AuthOutcome } from './auth';
import type { LinkOutcome } from './orders';
import type { SyncResult } from './sync';

export type { AuthOutcome, LinkOutcome, SyncResult };

export const cloudConfigured = Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_KEY);

const load = () => import('./cloudImpl');

export const initAuth = () => (cloudConfigured ? load().then((m) => m.initAuth()) : Promise.resolve());
export const requestSync = (delayMs?: number) => {
  if (cloudConfigured) void load().then((m) => m.requestSync(delayMs));
};
export const syncNow = (): Promise<SyncResult> => (cloudConfigured ? load().then((m) => m.syncNow()) : Promise.resolve('disabled'));
export const createAccount = (email: string, password: string) => load().then((m) => m.createAccount(email, password));
export const signIn = (email: string, password: string) => load().then((m) => m.signIn(email, password));
export const resendConfirmation = (email: string) => load().then((m) => m.resendConfirmation(email));
export const signOut = () => load().then((m) => m.signOut());
export const deleteAccount = () => load().then((m) => m.deleteAccount());
export const linkOrder = (orderName: string, phone: string): Promise<LinkOutcome> => load().then((m) => m.linkOrder(orderName, phone));
