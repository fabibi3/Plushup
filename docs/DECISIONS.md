# Décisions de la V0 — et comment je les ai challengées

Format : **Décision** · pourquoi · ce que j'ai rejeté · ce qui me ferait changer d'avis.

---

## D1. Expo SDK 57 + Expo Router, une base de code pour web / iOS / Android
- **Pourquoi** : seule option qui donne à la fois une vraie app native (haptique, notifications, Health plus tard, critère Apple 4.2) et une webapp légère en DOM (react-native-web). Routing par fichiers identique sur les 3 cibles.
- **Rejeté** : Flutter (web lourd en canvas, mauvais sur 3G), PWA seule (pas d'App Store), Capacitor (crédible, mais natif moins fluide et plugins Health moins mûrs).
- **Changerait si** : l'équipe est 100 % web et Health passe en V3 → Capacitor redevient compétitif.

## D2. Styles natifs (`StyleSheet` + tokens) plutôt que NativeWind
- **Pourquoi** : zéro étape de build supplémentaire (Babel/PostCSS), zéro risque d'incompatibilité au changement de SDK, styles **logiques** (start/end) pour le RTL, et un design system centralisé dans `src/theme/tokens.ts`. Pour une V0 livrée sans surveillance, la robustesse prime.
- **Rejeté** : NativeWind — bon outil, mais une couche de plus qui casse régulièrement aux montées de version d'Expo/Tailwind.
- **Changerait si** : l'équipe veut absolument la syntaxe Tailwind → NativeWind s'ajoute sans réécrire la logique (seuls les `style={}` changent).

## D3. Local-first (Zustand + AsyncStorage) et synchro « dernier qui écrit gagne »
- **Pourquoi** : connexions lentes / coupées au Maroc → une action ne doit **jamais** attendre le réseau. Le check-in s'enregistre en 0 ms, la synchro suit en tâche de fond.
- **Comment** : chaque élément porte `clientUpdatedAt` + `dirty`. Push = upserts idempotents ; le **serveur arbitre** (trigger SQL `keep_latest_client_write`) ; pull = delta depuis `max(updated_at)` serveur (pas l'horloge du téléphone, souvent fausse).
- **Rejeté** : PowerSync / WatermelonDB / ElectricSQL — excellents, mais surdimensionnés pour ~1 ligne/jour/utilisatrice.
- **Limite assumée** : LWW au niveau de la ligne (pas du champ). Avec 1 check-in/jour et en général 1 téléphone, c'est le bon compromis.

## D4. Compte e-mail obligatoire (révisé)
- **Avant** : session anonyme automatique, e-mail facultatif. **Retour produit** : « n'importe qui peut avoir une version » — pas acceptable.
- **Maintenant** : un compte e-mail est exigé avant tout écran de l'app (gardes `Stack.Protected` dans le layout racine) ; seul le profil démo y échappe.
- **Ordre** : connexion → onboarding (6 écrans) → app. Sur un nouveau téléphone, la connexion récupère profil et historique **avant** d'afficher l'app : pas d'onboarding refait.
- **Hors ligne** : le compte connecté est persisté, la session aussi ; l'app s'ouvre sans réseau une fois connectée.
- **Téléphones partagés** : si un AUTRE e-mail se connecte sur un appareil qui garde des données locales, elles sont effacées au lieu d'être fusionnées (l'e-mail précédent est lu avant l'appel réseau, car Supabase émet SIGNED_IN avant de rendre la main).
- **Erreurs lisibles** : adresse non autorisée (SMTP par défaut), limite d'envoi, adresse non confirmée (avec « Renvoyer l'e-mail ») — par code d'erreur, avec repli sur le message Supabase.
- **Suite (MVP)** : OTP téléphone/WhatsApp, plus naturel au Maroc que l'e-mail.

## D5. Client Supabase « allégé » (auth-js + postgrest-js) chargé à la demande
- **Pourquoi** : `@supabase/supabase-js` embarque Storage, Realtime, Functions… inutiles ici. En important seulement l'auth et PostgREST **et** en isolant tout le code cloud derrière un `import()` dynamique (`src/lib/cloud.ts`), le bundle initial web passe de **428 Ko → 358 Ko gzip (−16 %)** ; le reste (39 Ko) arrive après le premier affichage.
- **Coût** : ~30 lignes de colle (`fetchWithAuth`) qui reproduisent ce que fait supabase-js. Typage DB conservé (vérifié).
- **Changerait si** : on a besoin de Storage (photos) ou Realtime → on repasse à supabase-js, toujours dans le chunk paresseux.

## D6. Contenu dans le code, pas en base
- **Pourquoi** : programme et fiches disponibles **hors ligne**, versionnés avec l'app, zéro requête. La base ne stocke que les données personnelles (minimisation).
- **Changerait si** : l'équipe contenu doit publier sans développeur → CMS (Supabase table + cache local) au MVP.

## D7. Suppression de compte par Edge Function (et pas une fonction SQL)
- **Pourquoi** : l'API admin `auth.admin.deleteUser` est la voie officielle ; la cascade SQL (`on delete cascade`) efface toutes les tables. CORS géré pour le web ; l'authentification est vérifiée dans la fonction à partir du JWT.
- **Note** : une fonction SQL `security definer` aurait marché, mais le garde-fou du MCP Supabase demande une validation humaine pour toute requête `delete from auth.users` — je ne l'ai pas contourné.

## D8. Statistiques descriptives uniquement
- **Pourquoi** : conformité (pas d'allégation santé) **et** honnêteté statistique (n=1, facteurs de confusion). Les « observations » n'apparaissent qu'avec ≥ 3 jours dans chaque groupe et affichent le nombre de jours observés. Jamais de « réduit de 30 % ».

## D9. Accessibilité & Maroc
- Zones tactiles ≥ 48 px, contrastes AA vérifiés (les menthes ne servent jamais de couleur de texte).
- Saisie par **emojis + boutons** (utilisable sans lire), champ texte facultatif.
- Police arabe **Readex Pro** (Poppins n'a pas de glyphes arabes), chargée seulement si besoin.
- Chiffres occidentaux (usage marocain), mois marocains (« ماي، يوليوز، غشت »).
- Notifications au texte neutre (téléphones partagés) : « Ta routine t'attend 🌊 ».
- Polices en 16 px minimum dans les champs (pas de zoom forcé d'iOS Safari).

## D10. Icônes SVG maison
- **Pourquoi** : ~20 icônes en quelques Ko au lieu d'une police d'icônes (~400 Ko sur le web). Les icônes directionnelles se retournent en arabe.

---

## D11. Mode démo déterministe, isolé du cloud
- **Pourquoi** : une démo d'investisseurs ne doit dépendre ni du réseau ni du hasard. Données générées par un PRNG à graine fixe, **testées** (série de 6 jours, aucun badge en attente, célébration « 7 jours » au check-in, tendance à la baisse). Bandeau « Mode démo » toujours visible ; accessible sans compte, la synchro est désactivée.

## D12. Badges calculés, pas stockés
- Les badges sont dérivés des données (impossible de les désynchroniser) ; seule la liste des badges **déjà célébrés** est persistée. Célébration uniquement sur les onglets (jamais par-dessus un écran de saisie).

## D13. Réachat = lien panier Shopify, parrainage = UTM
- Lien `/cart/<variant>:1` vers la **vraie** variante (vérifiée via l'API Shopify) : zéro intégration de paiement, paiement à la livraison géré par la boutique. Parrainage suivi par `utm_campaign=<code>` (visible dans Shopify Analytics) plutôt que des codes promo à gérer : on mesure d'abord, on récompense ensuite.

## D14. Liaison de commande par téléphone, vérifiée côté serveur
- En paiement à la livraison, le téléphone est l'identifiant fiable (pas l'e-mail). Comparaison sur les 9 derniers chiffres (06…, +212…, 00212…). Même message d'erreur pour « introuvable » et « mauvais téléphone » (pas de fuite d'information). Jeton Shopify en lecture seule, uniquement côté serveur.

## Ce que la V0 ne fait volontairement PAS (et pourquoi)

| Pas fait | Pourquoi | Quand |
|---|---|---|
| Score prédictif « indice de lourdeur » | Pas de données pour l'entraîner, risque d'allégation santé | V3, sous forme de conseil |
| Photos avant/après | Données ultra-sensibles, stockage local + chiffrement à concevoir | V2 |
| Apple Santé / Health Connect | Nécessite un development build + déclarations stores | V2 |
| Lien Shopify / QR | Demandé hors V0 ; table `linked_orders` déjà prête | MVP |
| Web Push, WhatsApp | Infra serveur + opt-in | MVP |
| Analytics | À brancher (PostHog UE) sans aucune valeur santé dans les événements | MVP |
