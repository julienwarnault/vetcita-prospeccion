# Vetcita · Prospección

## Installer et lancer en local

Prérequis : **Node.js 22.13+** et npm.

```sh
npm ci
npm run dev
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

Cloudflare installe les dépendances, compile et déploie à chaque push sur la branche de production. Rien à lancer manuellement en production. Si les tables `visits` et `custom_clinics` existent déjà dans D1, aucune initialisation supplémentaire n'est nécessaire.

Dans **Workers & Pages → ton Worker → Access**, activer [Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/) pour la production et les prévisualisations, puis définir les utilisateurs autorisés.
