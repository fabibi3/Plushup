// Moteur de synchro local-first.
// 1. PUSH : tout ce qui est `dirty` part en upsert (idempotent). Le serveur arbitre (trigger last-write-wins).
// 2. PULL : on récupère uniquement ce qui a changé depuis `lastPulledAt` (horloge SERVEUR, pas celle du téléphone).
// Jamais bloquant : en cas d'échec réseau, les données restent dirty et repartiront au prochain essai.
import { PROGRAM_SLUG } from '@/content/program';
import { useApp } from '@/store/useApp';

import { logToRow, measurementKey, measurementToRow, profileToRow, rowToLog, rowToMeasurement, rowToProfile } from './mappers';
import { supabase } from './supabase';

export type SyncResult = 'ok' | 'disabled' | 'no-session' | 'offline' | 'error';

let inflight: Promise<SyncResult> | null = null;
let rerun = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Demande une synchro groupée (debounce) : appelée après chaque écriture locale. */
export function requestSync(delayMs = 1500): void {
  if (!supabase) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void syncNow();
  }, delayMs);
}

export function syncNow(): Promise<SyncResult> {
  if (inflight) {
    rerun = true;
    return inflight;
  }
  inflight = run().finally(() => {
    inflight = null;
    if (rerun) {
      rerun = false;
      requestSync(200);
    }
  });
  return inflight;
}

const isNetworkError = (e: unknown) => {
  const msg = e instanceof Error ? e.message : String((e as { message?: unknown })?.message ?? e);
  return /fetch|network|timeout|Failed to fetch|AbortError/i.test(msg);
};

async function run(): Promise<SyncResult> {
  if (!supabase || useApp.getState().demo) return 'disabled'; // la démo ne touche jamais la base
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return 'no-session';

  const store = useApp.getState();
  store.setSyncing(true);
  try {
    // ---------- PUSH ----------
    const s = useApp.getState();
    const dirtyLogs = Object.values(s.logs).filter((l) => l.dirty);
    const dirtyMeasures = Object.values(s.measurements).filter((m) => m.dirty);
    const dirtyDays = Object.entries(s.completions).filter(([, c]) => c.dirty);
    const consents = s.pendingConsents;

    if (s.profileDirty && s.profile.onboardedAt) {
      const { error } = await supabase.from('profiles').upsert(profileToRow(s.profile, userId, s.locale));
      if (error) throw error;
    }
    if (consents.length > 0) {
      const { error } = await supabase.from('consents').insert(
        consents.map((c) => ({ user_id: userId, kind: c.kind, granted: c.granted, policy_version: c.version, created_at: c.at })),
      );
      if (error) throw error;
    }
    if (dirtyLogs.length > 0) {
      const { error } = await supabase
        .from('daily_logs')
        .upsert(dirtyLogs.map((l) => logToRow(l, userId)), { onConflict: 'user_id,log_date' });
      if (error) throw error;
    }
    if (dirtyMeasures.length > 0) {
      const { error } = await supabase
        .from('measurements')
        .upsert(dirtyMeasures.map((m) => measurementToRow(m, userId)), { onConflict: 'user_id,measured_on,kind' });
      if (error) throw error;
    }
    if (dirtyDays.length > 0) {
      const { error } = await supabase.from('program_progress').upsert(
        dirtyDays.map(([day, c]) => ({ user_id: userId, program_slug: PROGRAM_SLUG, day_index: Number(day), completed_at: c.completedAt })),
        { onConflict: 'user_id,program_slug,day_index', ignoreDuplicates: true },
      );
      if (error) throw error;
    }

    useApp.getState().markPushed({
      logs: Object.fromEntries(dirtyLogs.map((l) => [l.date, l.clientUpdatedAt])),
      measurements: Object.fromEntries(dirtyMeasures.map((m) => [measurementKey(m.date, m.kind), m.clientUpdatedAt])),
      days: dirtyDays.map(([day]) => Number(day)),
      profile: s.profileDirty && s.profile.onboardedAt != null,
      consents: consents.length,
    });

    // ---------- PULL ----------
    const since = useApp.getState().lastPulledAt ?? '1970-01-01T00:00:00Z';
    const [logsRes, measuresRes, progressRes, profileRes, orderRes] = await Promise.all([
      supabase.from('daily_logs').select('*').gt('updated_at', since).order('updated_at').limit(1000),
      supabase.from('measurements').select('*').gt('updated_at', since).order('updated_at').limit(1000),
      supabase.from('program_progress').select('day_index, completed_at').eq('program_slug', PROGRAM_SLUG),
      useApp.getState().profile.onboardedAt == null
        ? supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('linked_orders')
        .select('order_name, purchased_at, delivered_at, legging_size, status')
        .order('purchased_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    for (const res of [logsRes, measuresRes, progressRes, profileRes, orderRes]) if (res.error) throw res.error;
    if (orderRes.data) {
      const o = orderRes.data;
      useApp.getState().setLinkedOrder({
        orderName: o.order_name,
        purchasedAt: o.purchased_at ?? new Date().toISOString(),
        deliveredAt: o.delivered_at,
        size: o.legging_size,
        status: o.status as 'pending' | 'delivered' | 'cancelled' | 'refunded',
      });
    }

    const logRows = logsRes.data ?? [];
    const measureRows = measuresRes.data ?? [];
    const maxUpdated = [...logRows, ...measureRows].reduce<string>(
      (max, r) => (Date.parse(r.updated_at) > Date.parse(max) ? r.updated_at : max),
      since,
    );

    useApp.getState().applyRemote({
      logs: logRows.map((r) => [r.log_date, rowToLog(r)]),
      measurements: measureRows.map((r) => {
        const m = rowToMeasurement(r);
        return [measurementKey(m.date, m.kind), m];
      }),
      completions: (progressRes.data ?? []).map((r) => [r.day_index, r.completed_at]),
      profile: profileRes.data ? rowToProfile(profileRes.data) : null,
      pulledAt: maxUpdated,
    });
    return 'ok';
  } catch (e) {
    if (__DEV__) console.warn('[sync]', e);
    return isNetworkError(e) ? 'offline' : 'error';
  } finally {
    useApp.getState().setSyncing(false);
  }
}
