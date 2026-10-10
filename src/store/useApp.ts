// État global local-first (zustand + AsyncStorage ; localStorage sur le web).
// Toute écriture est d'abord locale et instantanée, puis marquée `dirty` pour la synchro (src/lib/sync.ts).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DateKey } from '@/lib/dates';
import { mergeRemote, measurementKey } from '@/lib/mappers';
import type { CompletionMap, LogMap } from '@/lib/stats';
import {
  CONSENT_VERSION,
  type ConsentEvent,
  type ConsentKind,
  type DailyLog,
  type Measurement,
  type MeasureKind,
  type Profile,
} from '@/lib/types';

export type Locale = 'fr' | 'ar';
export type AccountMode = 'local' | 'anonymous' | 'email';

const emptyProfile: Profile = {
  firstName: '',
  activityProfile: null,
  goals: [],
  size: null,
  reminderTime: '21:00',
  onboardedAt: null,
};

export const emptyLog = (date: DateKey): DailyLog => ({
  date,
  heaviness: null,
  swelling: null,
  comfort: null,
  wornHours: null,
  wearSlot: null,
  water: 0,
  note: '',
  clientUpdatedAt: new Date(0).toISOString(),
  dirty: false,
});

type PersistedState = {
  locale: Locale;
  profile: Profile;
  profileDirty: boolean;
  wellbeingConsent: boolean;
  pendingConsents: ConsentEvent[];
  logs: LogMap;
  measurements: Record<string, Measurement>;
  completions: CompletionMap;
  lastPulledAt: string | null;
  lastSyncedAt: string | null;
};

type RuntimeState = {
  hydrated: boolean;
  account: { mode: AccountMode; email: string | null };
  syncing: boolean;
};

type Actions = {
  setLocale: (locale: Locale) => void;
  completeOnboarding: (profile: Omit<Profile, 'onboardedAt'>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  saveLog: (date: DateKey, patch: Partial<Omit<DailyLog, 'date' | 'clientUpdatedAt' | 'dirty'>>) => void;
  addWater: (date: DateKey, delta: number) => void;
  completeDay: (day: number) => void;
  saveMeasurement: (date: DateKey, kind: MeasureKind, valueCm: number) => void;
  setConsent: (kind: ConsentKind, granted: boolean) => void;
  // --- synchro ---
  setAccount: (account: RuntimeState['account']) => void;
  setSyncing: (syncing: boolean) => void;
  markPushed: (snapshot: {
    logs: Record<string, string>;
    measurements: Record<string, string>;
    days: number[];
    profile: boolean;
    consents: number;
  }) => void;
  applyRemote: (data: {
    logs: Array<[string, DailyLog]>;
    measurements: Array<[string, Measurement]>;
    completions: Array<[number, string]>;
    profile: Profile | null;
    pulledAt: string;
  }) => void;
  /** Changement de compte : tout le local repart vers le nouveau compte (fusion). */
  markAllDirty: () => void;
  resetAll: () => void;
};

export type AppState = PersistedState & RuntimeState & Actions;

const initialPersisted: PersistedState = {
  locale: 'fr',
  profile: emptyProfile,
  profileDirty: false,
  wellbeingConsent: false,
  pendingConsents: [],
  logs: {},
  measurements: {},
  completions: {},
  lastPulledAt: null,
  lastSyncedAt: null,
};

const now = () => new Date().toISOString();

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      ...initialPersisted,
      hydrated: false,
      account: { mode: 'local', email: null },
      syncing: false,

      setLocale: (locale) => set((s) => ({ locale, profileDirty: s.profile.onboardedAt != null || s.profileDirty })),

      completeOnboarding: (profile) =>
        set((s) => {
          const at = now();
          return {
            profile: { ...profile, onboardedAt: at },
            profileDirty: true,
            wellbeingConsent: true,
            pendingConsents: [
              ...s.pendingConsents,
              { kind: 'terms', granted: true, version: CONSENT_VERSION, at },
              { kind: 'wellbeing_data', granted: true, version: CONSENT_VERSION, at },
              { kind: 'reminders', granted: profile.reminderTime != null, version: CONSENT_VERSION, at },
            ],
          };
        }),

      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch }, profileDirty: true })),

      saveLog: (date, patch) =>
        set((s) => ({
          logs: {
            ...s.logs,
            [date]: { ...(s.logs[date] ?? emptyLog(date)), ...patch, date, clientUpdatedAt: now(), dirty: true },
          },
        })),

      addWater: (date, delta) =>
        set((s) => {
          const current = s.logs[date] ?? emptyLog(date);
          const water = Math.max(0, Math.min(30, current.water + delta));
          if (water === current.water) return {};
          return { logs: { ...s.logs, [date]: { ...current, water, clientUpdatedAt: now(), dirty: true } } };
        }),

      completeDay: (day) =>
        set((s) => {
          // Une routine refaite le même jour ne crée pas de doublon ; refaite un autre jour, on garde la 1re date.
          if (s.completions[day]) return {};
          return { completions: { ...s.completions, [day]: { completedAt: now(), dirty: true } } };
        }),

      saveMeasurement: (date, kind, valueCm) =>
        set((s) => ({
          measurements: {
            ...s.measurements,
            [measurementKey(date, kind)]: { date, kind, valueCm, clientUpdatedAt: now(), dirty: true },
          },
        })),

      setConsent: (kind, granted) =>
        set((s) => ({
          wellbeingConsent: kind === 'wellbeing_data' ? granted : s.wellbeingConsent,
          pendingConsents: [...s.pendingConsents, { kind, granted, version: CONSENT_VERSION, at: now() }],
        })),

      setAccount: (account) => set({ account }),
      setSyncing: (syncing) => set({ syncing }),

      // On ne « nettoie » que les éléments inchangés depuis l'envoi (une modif pendant la synchro reste dirty).
      markPushed: (snap) =>
        set((s) => {
          const logs = { ...s.logs };
          for (const [date, version] of Object.entries(snap.logs)) {
            const log = logs[date];
            if (log && log.clientUpdatedAt === version) logs[date] = { ...log, dirty: false };
          }
          const measurements = { ...s.measurements };
          for (const [key, version] of Object.entries(snap.measurements)) {
            const m = measurements[key];
            if (m && m.clientUpdatedAt === version) measurements[key] = { ...m, dirty: false };
          }
          const completions = { ...s.completions };
          for (const day of snap.days) {
            const c = completions[day];
            if (c) completions[day] = { ...c, dirty: false };
          }
          return {
            logs,
            measurements,
            completions,
            profileDirty: snap.profile ? false : s.profileDirty,
            pendingConsents: s.pendingConsents.slice(snap.consents),
            lastSyncedAt: now(),
          };
        }),

      applyRemote: ({ logs, measurements, completions, profile, pulledAt }) =>
        set((s) => {
          const nextCompletions = { ...s.completions };
          for (const [day, completedAt] of completions) {
            if (!nextCompletions[day]) nextCompletions[day] = { completedAt, dirty: false };
          }
          // Profil distant pris seulement si l'appareil n'a pas encore fait l'onboarding (connexion sur un nouveau téléphone).
          const adoptProfile = profile != null && s.profile.onboardedAt == null && profile.onboardedAt != null;
          return {
            logs: mergeRemote(s.logs, logs),
            measurements: mergeRemote(s.measurements, measurements),
            completions: nextCompletions,
            profile: adoptProfile ? profile : s.profile,
            wellbeingConsent: adoptProfile ? true : s.wellbeingConsent,
            lastPulledAt: pulledAt,
          };
        }),

      markAllDirty: () =>
        set((s) => ({
          logs: Object.fromEntries(Object.entries(s.logs).map(([k, l]) => [k, { ...l, dirty: true }])),
          measurements: Object.fromEntries(Object.entries(s.measurements).map(([k, m]) => [k, { ...m, dirty: true }])),
          completions: Object.fromEntries(Object.entries(s.completions).map(([k, c]) => [k, { ...c, dirty: true }])),
          profileDirty: s.profile.onboardedAt != null,
          lastPulledAt: null,
        })),

      resetAll: () => set((s) => ({ ...initialPersisted, locale: s.locale, account: { mode: 'local', email: null } })),
    }),
    {
      name: 'plushup-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): PersistedState => ({
        locale: s.locale,
        profile: s.profile,
        profileDirty: s.profileDirty,
        wellbeingConsent: s.wellbeingConsent,
        pendingConsents: s.pendingConsents,
        logs: s.logs,
        measurements: s.measurements,
        completions: s.completions,
        lastPulledAt: s.lastPulledAt,
        lastSyncedAt: s.lastSyncedAt,
      }),
      onRehydrateStorage: () => () => {
        useApp.setState({ hydrated: true });
      },
    },
  ),
);

export const hasDirtyData = (s: PersistedState) =>
  s.profileDirty ||
  s.pendingConsents.length > 0 ||
  Object.values(s.logs).some((l) => l.dirty) ||
  Object.values(s.measurements).some((m) => m.dirty) ||
  Object.values(s.completions).some((c) => c.dirty);
