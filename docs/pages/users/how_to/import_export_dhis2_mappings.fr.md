# Importer et exporter des mappings DHIS2

Pour exporter des soumissions vers DHIS2, chaque question d'un formulaire est mappée vers un data
element DHIS2 (voir la section « Correspondances avec DHIS2 » du [guide utilisateur](../reference/user_guide.md)).
Cette page explique comment réutiliser ces mappings au lieu de les refaire à la main.

## Quel type de mapping choisir

Le type de mapping dépend du nombre de soumissions du formulaire, et de ce qu'elles doivent devenir
dans DHIS2 :

| Type de mapping | À utiliser quand | Chaque soumission devient, dans DHIS2 |
|---|---|---|
| **Aggregate** | il y a **une soumission par unité d'organisation et par période** (rapport mensuel, formulaire de quantités...). Le formulaire doit avoir un type de période. | un ensemble de valeurs d'un **dataset**, pour l'unité d'organisation et la période de la soumission ; le dataset est marqué comme complet. Une deuxième soumission pour la même unité d'organisation et la même période écrase les valeurs de la première. |
| **Event** | il y a **plusieurs soumissions par unité d'organisation et par période**, sans personne à suivre (consultations, visites, enquêtes...) | un évènement d'un **programme d'évènements sans enregistrement** (event program without registration). Sa date est la date de création ou le début de la période de la soumission (**Source pour la date d'évènement**). |
| **Event Tracker** | la **même personne (ou le même objet) est suivie dans le temps** | une entité suivie (tracked entity) d'un **programme tracker** (retrouvée par son identifiant, ou créée), avec ses attributs, une inscription (enrollment) et un évènement par étape du programme. Un groupe répété peut créer des entités suivies liées, reliées par une relation. |

Le type **Derived** n'exporte pas vers DHIS2 : il calcule un formulaire de statistiques à partir
d'un autre formulaire, voir [Déduire un formulaire à partir d'un autre formulaire](deduce_form_from_another_form.md).

## Un mapping par version de formulaire

Un mapping est attaché à une **version** d'un formulaire, pas au formulaire lui-même : des questions
peuvent être ajoutées, supprimées ou renommées d'une version à l'autre.

Quand vous chargez une nouvelle version d'un formulaire, IASO copie les mappings de la version
précédente :

- les mappings des questions encore présentes dans la nouvelle version sont gardés ;
- les mappings des questions qui n'existent plus sont supprimés ;
- les nouvelles questions ne sont pas encore mappées : mappez-les, ou marquez-les comme jamais mappées.

## Exporter les mappings d'une version

Sur la page de mapping d'une version de formulaire, cliquez sur **Exporter les mappings**. Un
fichier `.json` est téléchargé avec les mappings des questions et le dataset DHIS2 (mappings
agrégés) ou le programme (mappings event et tracker) qu'ils visent. Les questions marquées comme
jamais mappées ne sont pas exportées.

Utilisez-le pour garder une copie avant un gros changement, ou pour copier les mappings vers un
autre serveur ou un autre compte.

## Importer des mappings

Sur la page de mapping de la version de formulaire à compléter, cliquez sur **Importer des
mappings**. Rien n'est modifié avant la confirmation de la dernière étape.

### 1. Choisir les mappings à réutiliser

Choisissez :

- une autre **version du même formulaire** qui utilise la même source de données DHIS2, ou
- un **export de mapping** (`.json`), fait par exemple sur un autre compte ou un autre serveur.

Un fichier est refusé s'il n'est pas un export de mapping, ou s'il a été fait pour un autre type de
mapping (par exemple un export tracker dans un mapping agrégé). S'il a été fait pour un autre
dataset ou programme DHIS2, un avertissement vous demande de vérifier que ses data elements font
partie de celui-ci.

### 2. Vérifier les différences

Les mappings importés sont comparés aux mappings actuels, question par question, dans quatre
onglets :

| Onglet | Contenu | Décision par défaut |
|---|---|---|
| **Conflits** | la question est déjà mappée (ou marquée comme jamais mappée) vers autre chose | **Garder** le mapping actuel |
| **À ajouter** | la question n'est pas encore mappée dans cette version | **Ajouter** le mapping importé |
| **Identiques** | même cible DHIS2 des deux côtés, rien à résoudre | aucun changement |
| **Ignorés** | ne peuvent pas être importés : la question n'existe pas dans cette version, ou le mapping n'est pas valide pour ce type de mapping | non importé |

Pour chaque conflit, choisissez **Garder** ou **Écraser** ; pour chaque ajout, **Ajouter** ou
**Ignorer**. Les boutons au-dessus du tableau décident pour toutes les lignes de l'onglet à la fois
(**Garder l'actuel partout**, **Écraser partout**, **Tout ajouter**, **Tout ignorer**).

### 3. Appliquer

Cliquez sur **Appliquer** (le bouton indique le nombre de changements). Un message résume combien
de mappings ont été ajoutés, écrasés, gardés et non importés.

!!! warning "Attention"
    Les identifiants DHIS2 des mappings importés ne sont pas vérifiés auprès de DHIS2. Si un data
    element n'existe pas dans le dataset ou le programme visé, l'erreur n'apparaît qu'à l'export des
    soumissions.

## Revenir à un mapping précédent

Chaque modification d'une version de mapping, import compris, est enregistrée. Sur la page de
mapping, le **Lien vers le Journal des modifications** affiche l'historique, avec les mappings
avant et après chaque modification : utilisez-le pour retrouver un mapping écrasé par erreur.
