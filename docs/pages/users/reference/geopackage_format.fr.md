# Format GeoPackage pour les données géographiques

*Comment préparer un fichier GeoPackage pour importer vos unités d'organisation (pays, régions, districts, formations sanitaires, villages…) dans IASO.*

Un **GeoPackage** (`.gpkg`) est un format standard de fichier cartographique, que des outils
comme QGIS savent ouvrir et créer. IASO peut importer depuis un GeoPackage des unités
d'organisation, leurs types et leurs groupes, à condition que le fichier respecte la
structure décrite sur cette page.

Vous pouvez l'utiliser pour :

- créer votre pyramide dans un nouveau compte ;
- ajouter ou mettre à jour des unités d'organisation dans une pyramide existante (le fichier
  peut ne contenir que les unités à créer ou à modifier) ;
- déplacer une pyramide d'un compte IASO à un autre (l'exporter en GeoPackage, puis
  l'importer).

!!! tip "Confiez la mise en forme à un assistant IA"
    Préparer ce fichier est un travail technique. Vous pouvez donner vos fichiers
    (shapefiles, GeoJSON, listes Excel…) à un assistant IA avec l'adresse de cette page et lui
    demander de produire le GeoPackage. Voir [le message ci-dessous](#preparer-le-fichier-avec-un-assistant-ia).

## Structure du fichier

Le fichier contient :

- **une couche par type d'unité d'organisation** (une pour les régions, une pour les
  districts, une pour les formations sanitaires…) ;
- **une table `groups`**, qui peut être vide.

### Nom des couches

Chaque couche s'appelle `level-{profondeur}-{nom du type}` :

- `profondeur` est le numéro du niveau, en commençant à 1 en haut de la pyramide ;
- `nom du type` est le nom du type d'unité d'organisation.

Par exemple :

| Couche | Contient |
|---|---|
| `level-1-Pays` | le pays |
| `level-2-Région` | les régions |
| `level-3-District` | les districts |
| `level-4-Formation sanitaire` | les formations sanitaires |

Si aucun type d'unité d'organisation ne porte ce nom, IASO le crée. Les noms de types
tiennent compte des majuscules : pour ajouter des unités à un type existant, utilisez
exactement la même orthographe, les mêmes majuscules et les mêmes accents. Les types d'unités
d'organisation sont partagés par tous les projets d'un compte.

### Colonnes de chaque couche

| Colonne | Obligatoire | Contenu |
|---|---|---|
| `ref` | oui | Un identifiant unique de l'unité, par exemple son id DHIS2 ou son code. IASO l'utilise pour relier les unités à leur parent et pour mettre l'unité à jour lors du prochain import. |
| `name` | oui | Le nom de l'unité. |
| `parent_ref` | non | La `ref` de l'unité parente, au niveau supérieur. Pour rattacher une unité à une unité déjà présente dans IASO, écrivez `iaso:` suivi de son id IASO, par exemple `iaso:1234`. N'incluez pas cette colonne pour le niveau le plus haut. |
| `group_refs` | non | Les groupes de l'unité : des `ref` de la table `groups`, séparées par des virgules, par exemple `urbain,public`. |
| `opening_date` | non | Date d'ouverture de l'unité, au format `AAAA-MM-JJ`. |
| `closed_date` | non | Date de fermeture de l'unité, au format `AAAA-MM-JJ`. |
| géométrie | non | Les limites (polygone) ou la position (point) de l'unité. Une unité peut ne pas avoir de géométrie. |

`ref` et `name` ne peuvent jamais être vides. Si vous incluez `parent_ref`, elle ne peut pas
être vide non plus : chaque unité de la couche doit avoir un parent.

Exemple de la couche `level-3-District` :

| ref | name | parent_ref | géométrie |
|---|---|---|---|
| `DIS_A` | District A | `REG_NORD` | (polygone) |
| `DIS_B` | District B | `REG_NORD` | (polygone) |
| `DIS_C` | District C | `REG_SUD` | (polygone) |

### La table `groups`

Les groupes permettent de classer les unités (par exemple *urbain* / *rural*, ou
*public* / *privé*). La table `groups` n'a pas de géométrie et a deux colonnes obligatoires :

| Colonne | Contenu |
|---|---|
| `ref` | Un identifiant unique du groupe, utilisé dans la colonne `group_refs` des couches. Il ne peut pas contenir de virgule. |
| `name` | Le nom du groupe. |

La table doit être présente même si vous n'utilisez pas de groupes.

À propos de la colonne `group_refs` : si une couche n'a pas cette colonne, les groupes de ses
unités ne sont pas modifiés. Si la colonne existe mais est vide pour une unité, cette unité
est retirée de tous ses groupes.

## Erreurs fréquentes

L'import échoue si le fichier contient :

- une `ref` ou un `name` vide ;
- deux unités avec la même `ref` ;
- une `parent_ref` qui ne correspond à aucune unité du fichier ni d'IASO ;
- un groupe dans `group_refs` absent de la table `groups` et d'IASO ;
- une virgule dans la `ref` d'un groupe ;
- une date qui n'est pas écrite `AAAA-MM-JJ`.

!!! tip "Partez d'un export"
    Le plus simple pour obtenir un fichier correct est de partir d'un fichier existant :
    dans IASO, une version de source de données peut être téléchargée avec **Download
    GeoPackage**. L'export utilise le même format, avec quelques colonnes en plus (`id`,
    `uuid`, `parent`, `group_names`) qui sont ignorées si vous réimportez le fichier.

## Préparer le fichier avec un assistant IA

Donnez vos fichiers à un assistant IA (Claude, ChatGPT…) et envoyez ce message, adapté à vos
niveaux :

> Convertis les fichiers joints en un GeoPackage conforme au format d'import IASO décrit sur
> https://docs.openiaso.com/fr/pages/users/reference/geopackage_format.html. Les niveaux sont :
> [pays, région, district, formation sanitaire…]. Vérifie que chaque unité a une `ref` unique
> et une `parent_ref` qui existe au niveau supérieur, ajoute une table `groups` vide, et
> donne-moi le fichier `.gpkg` à télécharger.

## Importer le fichier dans IASO

1. Allez dans **Admin > Sources de données > Liste des sources de données**.
2. Cliquez sur **Versions** sur votre source, puis sur **Nouvelle version sur base d'un
   Geopackage**.
3. Choisissez votre fichier.
4. **Cochez « Passer le statut des org units à "Valide" ».** Sinon, toutes les unités sont
   importées avec le statut *Nouveau* et doivent être validées une par une avant de pouvoir
   être utilisées.
5. Lancez l'import. Il se fait en arrière-plan et peut prendre une dizaine de minutes :
   suivez-le dans **Admin > Tâches**.
6. Une fois la tâche terminée, faites de la nouvelle version la version par défaut :
   modifiez la source de données, choisissez le numéro de la nouvelle version dans
   **Version par défaut**, puis cliquez sur **Sauver**.

Pour corriger ou compléter une pyramide, importez le fichier dans la **même version** plutôt
que dans une nouvelle : les unités ayant la même `ref` sont mises à jour au lieu d'être
dupliquées.
