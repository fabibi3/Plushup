// Boutique PlushUp (Shopify, vérifié le 10/10/2026) : produit unique « Legging PlushUp », 400 MAD.
export const SHOP_URL = 'https://www.plushup.co';
export const PRODUCT_URL = `${SHOP_URL}/products/legging-plushup`;
export const PRODUCT_PRICE_MAD = 400;
export const PRODUCT_IMAGE = 'https://cdn.shopify.com/s/files/1/0842/5986/4833/files/Plushup3.jpg?v=1791651333';
/** Variante Shopify du legging → lien panier pré-rempli (réachat en un geste). */
export const VARIANT_ID = '50363179565313';
export const cartUrl = (qty = 1, ref?: string) =>
  `${SHOP_URL}/cart/${VARIANT_ID}:${qty}?utm_source=app&utm_medium=reorder${ref ? `&utm_campaign=${encodeURIComponent(ref)}` : ''}`;
/** Lien de parrainage : attribution via UTM (visible dans Shopify Analytics, sans code promo à gérer). */
export const referralUrl = (code: string) => `${PRODUCT_URL}?utm_source=app&utm_medium=referral&utm_campaign=${encodeURIComponent(code)}`;

export const WHATSAPP_URL = 'https://wa.me/'; // TODO : numéro WhatsApp Business PlushUp (format international sans +)
export const whatsappShare = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export const REMINDER_TIMES = ['08:00', '12:30', '18:00', '20:00', '21:00', '22:00'] as const;

export const APP_VERSION = '1.0.0';
