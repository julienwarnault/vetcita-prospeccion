# Vetcita · Prospección

## Installer et lancer en local

Prérequis : **Node.js 22.13+** et npm.

```sh
npm ci
npm run dev
```

Créer un premier compte (mot de passe demandé dans le terminal) :

```sh
npm run user:create -- --email moi@example.com --states "Ciudad de México,Guanajuato"
```

Ouvrir **http://127.0.0.1:5173/**. Les migrations SQLite locales sont automatiques, sans connexion à Cloudflare. Conserver `.wrangler/state/` pour garder les données.

## Déployer depuis GitHub via Cloudflare

1. Renseigner `database_name` et `database_id` de la base D1 existante dans `wrangler.jsonc` (binding `DB`), puis pousser le projet sur GitHub.
2. Dans **Workers & Pages**, créer un Worker connecté au dépôt GitHub. Pour un Worker existant : **Settings → Builds → Connect**.
3. Configurer :

| Réglage               | Valeur                                                                |
| --------------------- | --------------------------------------------------------------------- |
| Nom du Worker         | `vetcita-prospeccion` (identique à `name` dans `wrangler.jsonc`)      |
| Branche de production | La branche à déployer                                                 |
| Dossier racine        | Racine du dépôt                                                       |
| Build command         | `npm run build`                                                       |
| Deploy command        | `npx wrangler deploy --config dist/vetcita_prospeccion/wrangler.json` |

Avant le premier déploiement de l’authentification, appliquer les migrations et créer un compte dans D1 :

```sh
npx wrangler d1 migrations apply DB --remote --config wrangler.jsonc
npm run user:create -- --remote --email moi@example.com --states "Ciudad de México,Guanajuato"
```

Les migrations conservent les cliniques et visites existantes, y compris si les tables ont été créées dans la console Cloudflare. Ensuite, chaque push déclenche le build et le déploiement.

En complément de la connexion dans l’app, il est possible d’activer [Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/) pour la production et les prévisualisations, puis définir les utilisateurs autorisés.

## Comptes et États

Dans la table `users`, `email` est en minuscules, `password` est stocké **en clair** et `states` est un texte séparé par des virgules : `Ciudad de México,Guanajuato,Nuevo León`. Une valeur vide ou `NULL` donne accès à tout ; les autres comptes ne voient pas les cliniques sans État renseigné. Les accès sont partagés par État, les visites restent communes aux utilisateurs autorisés.

Pour créer un compte avec tous les accès, omettre `--states`. Modifier `states` directement dans D1 pour changer ses accès ; la modification s’applique dès la prochaine requête. Supprimer les lignes de `sessions` de l’utilisateur pour le déconnecter. Les sessions expirent après 7 jours. Aucun compte par défaut ni inscription publique.

Le répertoire se trouve dans `data/clinics.json` et est servi par l’API après connexion. Les CSV d’import restent dans `data/`, hors des fichiers publics.
