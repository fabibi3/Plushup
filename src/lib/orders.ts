// Liaison commande Shopify (chargé dans le chunk cloud). La vérification se fait côté serveur (Edge Function link-order).
import { useApp } from '@/store/useApp';

import type { LinkedOrder } from './demo';
import { functionsUrl, supabase } from './supabase';
import { syncNow } from './sync';

export type LinkOutcome = 'ok' | 'not_found' | 'already_linked' | 'not_configured' | 'invalid' | 'network' | 'error';

export async function linkOrder(orderName: string, phone: string): Promise<LinkOutcome> {
  const digits = orderName.replace(/\D/g, '');
  const phoneDigits = phone.replace(/\D/g, '');
  if (!digits || phoneDigits.length < 9) return 'invalid';

  // Démo : liaison instantanée avec la commande d'exemple.
  if (useApp.getState().demo) return 'ok';
  if (!supabase || !functionsUrl) return 'not_configured';

  // La commande est rattachée au compte e-mail connecté.
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return 'not_configured';

  try {
    const res = await fetch(`${functionsUrl}/link-order`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderName: digits, phone: phoneDigits }),
    });
    const body = (await res.json().catch(() => ({}))) as { order?: LinkedOrder; error?: string };
    if (res.ok && body.order) {
      useApp.getState().setLinkedOrder(body.order);
      if (body.order.size && !useApp.getState().profile.size) useApp.getState().updateProfile({ size: body.order.size as never });
      void syncNow();
      return 'ok';
    }
    if (body.error === 'not_found' || body.error === 'already_linked' || body.error === 'not_configured') return body.error;
    if (res.status === 400) return 'invalid';
    return 'error';
  } catch {
    return 'network';
  }
}
