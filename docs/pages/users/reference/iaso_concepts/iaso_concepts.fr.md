# Concepts

## Formulaires de collecte de données XLS

La collecte de données implique des questions, et pour organiser ces questions, des **formulaires de collecte de données**. Ils se composent de questions pour lesquelles on souhaite collecter des réponses, tout en spécifiant des options (obligatoires ou non, saut d'une question en fonction d'une réponse précédente, etc.).\
IASO utilise les [XLS forms](https://xlsform.org/en/) pour ses questionnaires, qui sont donc prédéfinis à l'aide d'un fichier Excel.

Dans IASO, les formulaires de collecte de données sont **versionnés**, ce qui signifie qu'à chaque fois qu'une nouvelle version est créée, l'ancienne version est conservée et reste disponible dans le système. Il est possible d'y revenir aisément.

## Unités d'organisation

IASO utilise la notion d'**Unités Od'organisation (Org unit ou OU)** pour gérer les données géographiques.\
Les **types d'unité d'organisation (OUT)** représentent les niveaux dans la hiérarchie.

### Exemple :

-   Pays
-   Région
-   District
-   Zone
-   Infrastructure/Village/Point d'intérêt

Les unités d'organisation sont classées dans la pyramide selon un parent et un ou plusieurs enfants (sauf les parents au sommet et les enfants au bas de la hiérarchie).

### Exemple ci-dessous :

-   République Démocratique du Congo (Type d'unité d'organisation "Pays") est l'unité d'organisation parente de
-   Kinshasa (Type d'unité d'organisation "Ville"), qui est l'unité d'organisation parente de
-   Bureau Bluesquare (Type d'unité d'organisation "Bureau")

La collecte de données dans IASO est structurée selon la hiérarchie définie, et chaque utilisateur doit explicitement sélectionner une unité d'organisation avant d'ouvrir le questionnaire et de répondre aux questions. Cela garantit que les données collectées sont correctement associées à la géographie pertinente.

## Projets

Dans IASO, un Projet est lié à une instance d'application mobile, avec son propre ID d'application (ou "App ID"). Au sein d'un même compte IASO, vous pouvez avoir un ou plusieurs Projet(s) avec différentes options de fonctionnalités.\
Les utilisateurs peuvent être liés à un ou plusieurs Projet(s).

### À savoir :

-   Un Projet est lié à une source de données
-   Un Projet peut être lié à un ou plusieurs utilisateurs
-   Certains utilisateurs peuvent être limités à un ou plusieurs Projet(s)/ID(s) d'application -- cela peut être défini dans la gestion des utilisateurs
-   Chaque Type d'Unité Organisationnelle doit être lié à un ou plusieurs Projet(s)
-   Chaque Formulaire doit être lié à un ou plusieurs Projet(s)
