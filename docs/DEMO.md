# Démo investisseurs — déroulé en 3 minutes

## Préparation (la veille, 10 min)
1. `npm install && cp .env.example .env`
2. **Ordinateur / projecteur** : `npm run demo` → http://localhost:8080 en plein écran (build de prod, aucun réseau requis).
   Au-delà de 900 px de large, l'app s'affiche **dans un cadre de téléphone** avec le positionnement de marque à côté.
3. **Téléphone** (optionnel, effet « vraie app ») : `npm start` → scanner le QR code avec **Expo Go**.
4. Faire une répétition complète, puis **« Quitter la démo »** pour repartir d'un état propre.
5. Plan B sans réseau : l'app est local-first, **tout le parcours fonctionne hors ligne** (testé).

## Le déroulé

| # | Écran | Geste | Ce que tu dis |
|---|---|---|---|
| 1 | Accueil | — | « Le legging gainant se vend sur Instagram. Le problème : après la livraison, la marque perd la cliente. PlushUp, c'est le legging **+ l'app qui la garde**. » |
| 2 | Accueil | Toucher **« Découvrir avec un profil exemple »** | « Voici Salma, 29 ans, conseillère en centre d'appels à Casablanca, assise 9 h par jour. Elle a reçu son legging il y a 3 semaines. » |
| 3 | Aujourd'hui | Montrer la série de 6 jours | « Elle ouvre l'app tous les soirs. 6 jours d'affilée. » |
| 4 | Check-in | **Faire mon check-in** → 😌 Légères → 6 h → L'après-midi → Enregistrer | « 30 secondes, 3 touches, sans rien taper : utilisable même sans savoir lire. » |
| 5 | Célébration | 🔥 **7 jours d'affilée** apparaît | « C'est ce moment qui crée l'habitude… et le bouton **Partager sur WhatsApp** transforme chaque badge en publicité gratuite. » → *Continuer* |
| 6 | Bilan | Toucher **Ton bilan de la semaine** | « Chaque semaine, un récap qu'on a envie de partager. Sa sensation de lourdeur est passée de 2 à 1,4 sur 4 — **ses propres observations**, on ne fait aucune promesse médicale. » |
| 7 | Ma commande | Retour → **Une 2e paire pour la rotation** | « Et voilà le business : commande liée, **réachat en un geste vers notre vrai panier Shopify**, paiement à la livraison. Demande d'avis au bon moment. Parrainage WhatsApp tracé. » |
| 8 | Progrès | Onglet **Progrès** | « Calendrier, tendance, badges. Les observations n'apparaissent qu'avec assez de données : honnêteté statistique. » |
| 9 | Langue | Moi → **العربية** | « Tout est en arabe, droite à gauche, police arabe dédiée. Le marché, c'est tout le Maroc. » |

**Phrase de clôture** : « Une seule base de code : iOS, Android et la webapp. Construite, testée, prête à accompagner le lancement. »

## Questions probables — réponses courtes
- **« Vous avez des clientes ? »** → La boutique est en pré-lancement : l'app est **prête avant la première vente**, pour fidéliser dès la cliente n°1. Aucun chiffre de traction n'est inventé dans la démo (profil exemple clairement signalé).
- **« Et la réglementation santé ? »** → Positionnement bien-être, aucune allégation médicale (charte `docs/WORDING.md`), consentement explicite, suppression de compte, données hébergées dans l'UE (Paris) ; dossier CNDP à déposer avant lancement.
- **« Pourquoi une app pour un legging ? »** → Le réachat (2e paire, remplacement), les avis et le parrainage sont les leviers qui font baisser le coût d'acquisition. L'app les déclenche **au bon moment**, automatiquement.
- **« Combien ça coûte à faire tourner ? »** → Infra quasi nulle au démarrage (Supabase, offre gratuite puis ~25 $/mois ; rappels locaux sans serveur).
- **« Qu'est-ce qui vient ensuite ? »** → Lien Shopify en production (code prêt, il manque le jeton), connexion par téléphone/WhatsApp, Apple Santé / Health Connect, publication sur les stores.
