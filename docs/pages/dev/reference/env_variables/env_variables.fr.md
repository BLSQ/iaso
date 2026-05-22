# Variables d'environnement

## Connexion à la base de données

L'URL est construite à partir des variables d'environnement suivantes :

* `RDS_USERNAME`
* `RDS_PASSWORD`
* `RDS_HOSTNAME`
* `RDS_DB_NAME`
* `RDS_PORT`

Le tableau de bord SQL utilise un utilisateur et un mot de passe dédiés avec un accès en **lecture seule** aux données :

* `DB_READONLY_USERNAME`
* `DB_READONLY_PASSWORD`

## Liées à AWS

Le stockage des divers fichiers comme les **ressources statiques** (JS/CSS, etc.) et les **formulaires bruts** (xlsform, soumissions XML et médias) se fait sur S3 ou via une API compatible S3 (comme MinIO).

* `AWS_ACCESS_KEY_ID`
* `AWS_SECRET_ACCESS_KEY`
* `AWS_S3_REGION_NAME`
* `AWS_STORAGE_BUCKET_NAME`
* `AWS_S3_ENDPOINT_URL` : (utilisé par exemple pour pointer vers MinIO)

Pour les **tâches asynchrones** :

* `BACKGROUND_TASK_SERVICE` : par défaut `SQS`. Valeurs possibles : `SQS`, `POSTGRES`
* `BEANSTALK_SQS_REGION`
* `BEANSTALK_SQS_URL`

---

## Liées à ClamAV

Si les variables requises ne sont pas définies, **ClamAV ne sera pas configuré** et Iaso ne pourra pas scanner les fichiers téléchargés.

| Nom           | Optionnel | Valeur par défaut  | Description                                                                                             |
| :------------ | :-------- | :----------------- | :------------------------------------------------------------------------------------------------------ |
| `CLAMAV_ACTIVE` | false     | `False`            | Indique si les fichiers téléchargés doivent être scannés avec ClamAV.                                   |
| `CLAMAV_FQDN`   | false     | `www.some-url.com` | Adresse que Iaso peut utiliser pour joindre ClamAV - **FQDN, pas une URL complète** (ex. `clamav.mywebsite.com`). |
| `CLAMAV_PORT`   | true      | `3310`             | Port que Iaso peut utiliser pour joindre ClamAV.                                                        |

---

# Compression

Vous pouvez activer la **compression des réponses** en utilisant le middleware Django `GZipMiddleware`. Pour ce faire, définissez la variable d'environnement `ENABLE_GZIP` à `"true"`.

La valeur par défaut est `"false"`, car il est généralement préférable d'effectuer la compression au niveau du serveur web (par exemple, Nginx ou Apache).

---

# Paramètres de sécurité

## Paramètres Django

Iaso permet de définir certains paramètres de sécurité de Django comme variables d'environnement. Pour activer ces fonctionnalités, définissez la variable d'environnement à `"true"`. La valeur par défaut est `"false"`.

* `CSRF_COOKIE_HTTPONLY`
* `CSRF_COOKIE_SECURE`
* `SESSION_COOKIE_SECURE`

## CORS

Il est possible de configurer un serveur IASO avec **CORS** autorisant l'accès depuis n'importe quel serveur en définissant la variable d'environnement `"ENABLE_CORS"`.

La valeur par défaut est `"true"`.

## Désactivation de la connexion par mot de passe

Définissez la variable d'environnement `DISABLE_PASSWORD_LOGINS` à la valeur `"true"` si vous souhaitez **désactiver la connexion par mot de passe** :

* Sur la page de connexion de base.
* Pour se connecter à l'administration.
* Via `/api/token`, qui est utilisé par défaut par l'application mobile.

## Liées à Sentry

Si vous ne fournissez pas de `SENTRY_URL`, **Sentry ne sera pas configuré**.

| Nom                                 | Optionnel | Valeur par défaut | Description                                                |
| :---------------------------------- | :-------- | :---------------- | :--------------------------------------------------------- |
| `SENTRY_URL`                        | true      | -                 | URL spécifique à votre compte Sentry.                      |
| `SENTRY_ENVIRONMENT`                | true      | `development`     | Environnement (dev, staging, prod, etc.).                  |
| `SENTRY_TRACES_SAMPLE_RATE`         | true      | `0.1`             | Flottant entre 0 et 1 : envoie 10 % des traces.            |
| `SENTRY_ERRORS_SAMPLE_RATE`         | true      | `1.0`             | Flottant entre 0 et 1 : envoie toutes les erreurs.         |
| `SENTRY_ERRORS_HTTPERROR_SAMPLE_RATE` | true      | `0.8`             | Flottant entre 0 et 1 : envoie 80 % des erreurs HTTP.      |

---

## Mode maintenance

`MAINTENANCE_MODE` (la valeur par défaut est `"false"`)

Si vous devez configurer IASO en mode maintenance, ce qui signifie qu'il affichera sur `/` une page indiquant que le serveur est en maintenance, et donnera une réponse 404 à toutes les requêtes (sauf pour `/health` ou `/_health`, que nous encourageons à utiliser pour la surveillance de l'état), vous pouvez définir la variable d'environnement `MAINTENANCE_MODE` à la valeur `"true"`.

## URL "En savoir plus"

La variable d'environnement `LEARN_MORE_URL` est utilisée pour spécifier une URL qui sera affichée sur la page de connexion. Si elle est définie, les utilisateurs peuvent cliquer sur un lien **"En savoir plus"** ou sur le logo pour visiter cette URL. Si `LEARN_MORE_URL` n'est pas définie, le logo ne sera pas cliquable et le lien ne sera pas affiché.

* `LEARN_MORE_URL`

Dans nos environnements, cela sera lié à `https://www.openiaso.com/`. Pour les environnements clients, cela peut être supprimé ou personnalisé selon les besoins.

## Intégration Product Fruits

Pour activer l'intégration Product Fruits, définissez la variable d'environnement suivante :

* `PRODUCT_FRUITS_WORKSPACE_CODE=VOTRE_CODE`

Lorsque cette variable est définie, Product Fruits sera activé et seuls le nom et l'ID du compte seront envoyés au service. Cela permet l'intégration des utilisateurs et la découverte des fonctionnalités.

---

## Configuration Frontend

### Paramètres de développement

| Nom              | Optionnel | Valeur par défaut | Description                                          |
| :--------------- | :-------- | :---------------- | :--------------------------------------------------- |
| `WEBPACK_HOST`   | true      | `localhost`       | Hôte du serveur de développement.                    |
| `WEBPACK_PORT`   | true      | `3000`            | Port du serveur de développement.                    |
| `WEBPACK_PROTOCOL` | true      | `http`            | Protocole du serveur de développement.               |
| `WEBPACK_PATH`   | true      | `./assets/webpack/` | Chemin des fichiers de sortie webpack.               |
| `OLD_BROWSER`    | true      | `false`           | Active le mode de compatibilité pour les navigateurs plus anciens. |
| `LIVE_COMPONENTS` | true      | `false`           | Utilise les composants `bluesquare-components` locaux pour le développement. |

### Paramètres de langue

| Nom                 | Optionnel | Valeur par défaut | Description                                     |
| :------------------ | :-------- | :---------------- | :---------------------------------------------- |
| `AVAILABLE_LANGUAGES` | true      | `en,fr`           | Liste des langues prises en charge, séparées par des virgules. |