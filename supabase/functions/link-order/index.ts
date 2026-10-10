// Liaison d'une commande Shopify au compte PlushUp.
// Vérification : numéro de commande (#1042) + téléphone de la commande (paiement à la livraison → le téléphone
// est l'identifiant fiable au Maroc ; on compare les 9 derniers chiffres pour accepter 06…, +2126…, 002126…).
// Secrets requis (Dashboard → Edge Functions → Secrets) :
//   SHOPIFY_SHOP_DOMAIN  ex. dbrwmy-5q.myshopify.com
//   SHOPIFY_ADMIN_TOKEN  jeton d'une app personnalisée Shopify, scopes read_orders + read_customers (lecture seule)
// Sans ces secrets → 503 not_configured (l'app affiche « bientôt disponible »).
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const last9 = (phone: string | null | undefined) => (phone ?? "").replace(/\D/g, "").slice(-9);

const ORDER_QUERY = `query($q: String!) {
  orders(first: 1, query: $q) {
    nodes {
      id name createdAt cancelledAt displayFulfillmentStatus phone
      customer { defaultPhoneNumber { phoneNumber } }
      shippingAddress { phone }
      lineItems(first: 5) { nodes { variantTitle } }
      fulfillments(first: 1) { deliveredAt }
    }
  }
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const shop = Deno.env.get("SHOPIFY_SHOP_DOMAIN");
  const token = Deno.env.get("SHOPIFY_ADMIN_TOKEN");
  if (!shop || !token) return json({ error: "not_configured" }, 503);

  const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "not_authenticated" }, 401);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData.user) return json({ error: "not_authenticated" }, 401);

  let body: { orderName?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const digits = (body.orderName ?? "").replace(/\D/g, "");
  const phone = last9(body.phone);
  if (!digits || digits.length > 10 || phone.length !== 9) return json({ error: "bad_request" }, 400);

  const res = await fetch(`https://${shop}/admin/api/2026-01/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query: ORDER_QUERY, variables: { q: `name:#${digits}` } }),
  });
  if (!res.ok) return json({ error: "shopify_error" }, 502);
  const order = (await res.json())?.data?.orders?.nodes?.[0];

  // Même réponse pour « introuvable » et « mauvais téléphone » : on ne révèle pas l'existence d'une commande.
  const phones = [order?.phone, order?.customer?.defaultPhoneNumber?.phoneNumber, order?.shippingAddress?.phone].map(last9);
  if (!order || !phones.includes(phone)) return json({ error: "not_found" }, 404);

  const { data: existing } = await admin.from("linked_orders").select("user_id").eq("shopify_order_id", order.id).maybeSingle();
  if (existing && existing.user_id !== userData.user.id) return json({ error: "already_linked" }, 409);

  const deliveredAt = order.fulfillments?.[0]?.deliveredAt ?? null;
  const row = {
    user_id: userData.user.id,
    shopify_order_id: order.id,
    order_name: order.name,
    legging_size: order.lineItems?.nodes?.[0]?.variantTitle === "Default Title" ? null : order.lineItems?.nodes?.[0]?.variantTitle ?? null,
    purchased_at: order.createdAt,
    delivered_at: deliveredAt,
    status: order.cancelledAt ? "cancelled" : deliveredAt || order.displayFulfillmentStatus === "FULFILLED" ? "delivered" : "pending",
  };
  const { error } = await admin.from("linked_orders").upsert(row, { onConflict: "shopify_order_id" });
  if (error) return json({ error: "db_error" }, 500);

  return json({
    order: { orderName: row.order_name, purchasedAt: row.purchased_at, deliveredAt: row.delivered_at, size: row.legging_size, status: row.status },
  });
});
