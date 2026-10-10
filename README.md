# PlushUp — app compagnon « jambes légères » (V0)

Une seule base de code **Expo (React Native + react-native-web)** → webapp (`app.plushup.co`) + iOS + Android.
Local-first, bilingue **FR / AR (RTL)**, adossée à **Supabase** (projet `plushup-v0`, région Paris).

---

## 1. Lancer en local (5 minutes)

Prérequis : Node 20+ (testé avec Node 22), npm.

```bash
npm install
cp .env.example .env          # URL + clé publishable Supabase (publiques par conception)
npm run web                   # → http://localhost:8081
```

Sur téléphone : `npm start`, puis scanne le QR code avec **Expo Go** (iOS/Android, même Wi-Fi).

> Sans `.env`, l'app fonctionne quand même à 100 % en **mode local** (pas de sauvegarde en ligne).

### Scripts

| Commande | Rôle |
|---|---|
| `npm run web` | Dev server web (hot reload) |
| `npm start` | Dev server + QR code Expo Go |
| `npm run typecheck` | TypeScript strict |
| `npm test` | Tests unitaires (logique métier, ~0,3 s) |
| `npm run build:web` | Build web de prod dans `dist/` |
| `npm run check` | Les trois ci-dessus d'un coup |
| `npm run e2e` | Parcours complet dans Chromium (voir § 6) |

---

## 2. ⚠️ À faire une fois dans le dashboard Supabase (2 clics)

Projet : https://supabase.com/dashboard/project/fjbrqsofnruqmqdprert

1. **Authentication → Sign In / Providers → « Allow anonymous sign-ins » : ON.**
   C'est ce qui permet la sauvegarde en ligne *sans rien demander* à l'utilisatrice.
   Tant que c'est OFF, l'app reste en mode local (rien ne casse).
2. **Authentication → URL Configuration** : ajoute `http://localhost:8081` aux *Redirect URLs*
   (lien de confirmation d'e-mail en local).
3. *(Optionnel en dev)* Authentication → Providers → Email → décocher « Confirm email »
   pour tester la création de compte sans e-mail. ⚠️ Le SMTP par défaut de Supabase n'envoie
   qu'aux membres de l'organisation : configure un SMTP (Resend, Brevo…) avant d'ouvrir à des testeuses.

Ces réglages ne sont pas modifiables en SQL ni via le MCP, d'où cette étape manuelle.

---

## 3. Ce que fait la V0

| Écran | Contenu |
|---|---|
| **Onboarding** (7 écrans, ~45 s) | Langue, prénom, profil de journée, objectifs, taille, heure de rappel, **consentement explicite** (données de bien-être) + avertissement « pas un dispositif médical » |
| **Aujourd'hui** | Série de jours + semaine, check-in, routine du jour, hydratation en 1 tap, conseil du jour |
| **Check-in 30 s** | Jambes (0-4, emojis), heures de port + moment, confort, sensation de gonflement, verres d'eau, note |
| **Programme 21 jours** | 3 semaines progressives (5 → 10 min), 10 exercices, 6 fiches éducatives |
| **Lecteur de routine** | Minuterie sans dérive, pulsation visuelle + **vibration douce** au rythme du geste, écran maintenu allumé |
| **Progrès** | Calendrier 4 semaines, chiffres clés, tendance, **observations personnelles** (descriptives, jamais causales) |
| **Moi** | Profil, rappel quotidien (notification locale), langue, Ma commande (guide des tailles, enfilage, entretien, réachat), compte, données, sécurité |
| **Mes données** | Export JSON + **suppression du compte** (exigence App Store / Play / loi 09-08 / RGPD) |
| **Sécurité** | Signaux d'alerte (consulter en urgence), précautions, bon usage |

---

## 4. Architecture

```
src/
  app/                 Routes Expo Router (1 fichier = 1 écran)
    (tabs)/            Aujourd'hui · Programme · Progrès · Moi
    onboarding.tsx     Protégé : visible tant que l'onboarding n'est pas fait (Stack.Protected)
    checkin.tsx  routine/[day].tsx  fiche/[slug].tsx  profil.tsx  mesures.tsx
    commande.tsx  compte.tsx  donnees.tsx  securite.tsx
  components/          Txt (police selon langue), ui (Button, Card, Chip, ScaleSelector…), Icon (SVG maison), Wave
  content/             Programme 21 j, fiches, conseils, guide des tailles — FR + AR, dans le code (hors ligne)
  i18n/                fr.ts (source), ar.ts (mêmes clés, vérifié par TypeScript)
  lib/
    stats.ts           Série, tendances, observations (pur, testé)
    mappers.ts         Local ⇄ base + fusion last-write-wins (pur, testé)
    sync.ts            Moteur de synchro (push dirty → pull delta)
    auth.ts            Anonyme → conversion e-mail, déconnexion, suppression
    cloud.ts           Façade chargée À LA DEMANDE (chunk séparé)
    *.native.ts        Variantes natives (haptique, rappels, polyfills)
  store/useApp.ts      Zustand + persistance AsyncStorage/localStorage
supabase/
  migrations/          Schéma SQL (RLS partout)
  functions/delete-account/   Edge Function de suppression de compte
tests/                 Vitest (logique pure)
```

### Flux de données (local-first)

```
Tap utilisatrice ──► store local (instantané, persistant, marqué dirty)
                         │  requestSync() groupé (1,5 s)
                         ▼
              chunk « cloud » chargé à la demande
                         │  PUSH upserts idempotents ──► Postgres (RLS + trigger last-write-wins)
                         │  PULL delta (updated_at > dernier pull, horloge serveur)
                         ▼
                 fusion LWW dans le store
```

- Le réseau n'est **jamais** sur le chemin d'une action : check-in, routine et progrès marchent hors ligne.
- Conflits (2 téléphones) : le serveur arbitre via `client_updated_at` (trigger SQL), le client fusionne pareil.

### Base de données (Supabase, projet `plushup-v0`, eu-west-3 Paris)

| Table | Rôle |
|---|---|
| `profiles` | Profil (1 ligne / utilisatrice) |
| `consents` | Journal **append-only** des consentements (preuve CNDP/RGPD) |
| `daily_logs` | Check-in quotidien, unique (user, date), LWW |
| `measurements` | Mensurations facultatives, unique (user, date, zone), LWW |
| `program_progress` | Jours de programme terminés |
| `linked_orders` | **Prête pour Shopify** : lecture seule côté app, écrite par le serveur |

RLS sur toutes les tables (`user_id = auth.uid()`), testée : une utilisatrice ne voit ni ne modifie rien d'une autre.
Advisors sécurité Supabase : **0 alerte**.

---

## 5. Choix techniques (et pourquoi)

Voir **[docs/DECISIONS.md](docs/DECISIONS.md)** — chaque choix y est challengé (alternatives, coûts, limites).
Charte des formulations santé : **[docs/WORDING.md](docs/WORDING.md)**.

---

## 6. Qualité

- `npm run typecheck` : TypeScript strict + `noUncheckedIndexedAccess`, schéma DB typé (une colonne inexistante = erreur de compilation).
- `npm test` : 24 tests (dates locales/DST, série, observations, fusion de synchro…).
- `npm run e2e` : parcours complet sur la build web en viewport mobile (onboarding → consentement obligatoire →
  check-in → hydratation → routine → série → programme → progrès → persistance après rechargement →
  arabe RTL → suppression des données). Nécessite Chromium : `npx playwright install chromium`
  ou `CHROMIUM_PATH=/chemin/vers/chrome`.
- Bundles natifs iOS/Android vérifiés (`npx expo export --platform ios --platform android`).

### Poids (web, gzip)
| | |
|---|---|
| Bundle initial | ~358 Ko |
| Chunk cloud (chargé après le 1er affichage) | ~39 Ko |
| Polices | Poppins ×3 graisses ; Readex Pro (arabe) chargée **uniquement** si l'arabe est choisi |

---

## 7. Limites connues de la V0 (assumées)

- **Rappels** : notifications locales sur mobile uniquement. Web Push = MVP (service worker + envoi serveur).
- **Expo Go** : suffisant pour tester la V0. Dès qu'on ajoute HealthKit / Health Connect → *development build* (EAS).
- **Arabe** : traduit en arabe standard simple → **relecture native obligatoire** ; darija pour l'audio des routines.
- **Contenu** (exercices, fiches, guide des tailles) : à valider par un·e kiné et à remplacer par le vrai tableau de tailles.
- **Lien Shopify** : table prête, intégration (Edge Function + webhooks) au MVP.
- Numéro WhatsApp du service client à renseigner dans `src/lib/constants.ts`.
