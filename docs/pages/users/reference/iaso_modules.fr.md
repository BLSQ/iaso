# Modules

IASO est organisé en Modules, qui sont des groupes de fonctionnalités pouvant être activés en fonction du cas d'usage à couvrir. Voici les Modules disponibles dans IASO :

## Collecte de données - Formulaires

Créez et téléversez des formulaires de collecte de données en utilisant le format XLS form largement répandu. Les formulaires sont versionnés : chaque nouvelle version créée conserve la précédente, disponible dans le système. Les soumissions envoyées depuis l'application mobile peuvent être validées depuis le web, et la complétude de la collecte de données peut être suivie par unité d'organisation, avec la possibilité d'explorer les données pour identifier où se situent les problèmes.

## Demandes de modification

Une fonctionnalité centrale du Géoregistre qui permet de maintenir les données géographiques à jour. Depuis l'application mobile, les utilisateurs peuvent soumettre des demandes de modification pour une unité d'organisation - y compris la création d'une toute nouvelle unité. Une fois soumise, la demande apparaît sur le web pour être examinée par un responsable, affichée côte à côte avec la version précédente afin de repérer facilement ce qui a changé.

Les champs d'unité d'organisation ouverts aux demandes de modification (Nom, Type d'unité d'organisation, Parent, Groupe, coordonnées GPS, dates d'ouverture et de fermeture, ou la possibilité pour les utilisateurs de créer de nouvelles unités d'organisation) sont configurables au préalable depuis la plateforme web IASO.

Les demandes de modification prennent également en charge les **formulaires de référence** : un formulaire XLS spécifique peut être désigné comme formulaire de référence pour un type d'unité d'organisation, permettant d'y attacher des "attributs de données" entièrement personnalisés - typiquement utilisés pour des données comme la population ou l'inventaire d'équipements.

## Complétude par période

Utilisé pour les dispositifs de Financement Basé sur la Performance (FBP), qu'IASO prend également en charge comme outil de collecte de données.

## Workflow de validation

Permet la "validation en cascade" des formulaires soumis. Les gestionnaires de données définissent quels rôles utilisateur sont responsables de l'approbation des données à chaque niveau de la hiérarchie - par exemple, le rôle "gestionnaire de district" approuve en premier, puis "gestionnaire de région", puis "gestionnaire de pays". Le nombre de niveaux et qui approuve à chaque niveau sont entièrement configurables pour s'adapter à la hiérarchie nécessaire.

## Entités

Les entités sont des éléments pouvant se déplacer d'une géographie à une autre - une personne, une palette de marchandises, ou tout autre élément qu'il est utile de suivre dans le temps. Elles peuvent être créées depuis l'application mobile, puis gérées depuis le web.

- Trouver les doublons d'entités probables depuis l'interface web et décider de les fusionner ou non
- Attribuer des **workflows** à des types d'entités, afin que des formulaires de collecte de données spécifiques s'ouvrent automatiquement en fonction des réponses déjà données

## Stockage externe

Permet à IASO de fonctionner avec des cartes NFC comme support de stockage, permettant de lire et d'écrire les données d'une entité sur une carte physique sur le terrain.

## Planification

Grâce à une interface dynamique basée sur une carte, les gestionnaires de données assignent des lieux spécifiques à des utilisateurs spécifiques, avec un calendrier défini et un ou plusieurs formulaires de collecte de données. Les utilisateurs sur le terrain voient alors leurs "missions" assignées sur l'application mobile et peuvent se rendre directement aux points où ils doivent collecter des données.

## Gestion des stocks

Suit les quantités d'articles disponibles au niveau de l'unité d'organisation, sur la base de questions liées aux stocks intégrées dans les formulaires de collecte de données. Chaque mouvement "plus" ou "moins" d'un article à une unité d'organisation est enregistré, et l'application mobile affiche en temps réel le nombre d'articles restants à un lieu donné.

## Paiements

Lié aux demandes de modification. Sur la base des demandes de modification approuvées par un responsable, les utilisateurs peuvent générer des lots de paiement et télécharger un fichier Excel résumant, par utilisateur, le nombre de demandes de modification approuvées qui leur sont dues en paiement.

## Form AI

Permet aux utilisateurs de créer ou modifier des formulaires de collecte de données avec l'IA comme assistant, plutôt que de construire le formulaire XLS manuellement.

## Correspondances DHIS2

Activé lorsque IASO est utilisé conjointement avec DHIS2, le système d'information de gestion de la santé open source le plus utilisé au monde. L'intégration d'IASO avec DHIS2 est bidirectionnelle : les données géographiques peuvent être importées depuis DHIS2, puis les outils géospatiaux avancés d'IASO prennent le relais pour la collecte de données sur le terrain, et les données mises à jour sont renvoyées vers DHIS2.

## Liens intégrés

Permet aux utilisateurs d'intégrer des liens externes - comme des tableaux de bord - directement dans leur compte IASO, chacun avec sa propre URL personnalisée et dédiée. La gestion des utilisateurs d'IASO (par utilisateur ou par rôle utilisateur) contrôle l'accès à ces liens intégrés, qui prennent en charge le HTML brut, le texte simple, les iframes et les tableaux de bord Superset.
