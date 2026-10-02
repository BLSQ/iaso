# Déduire un formulaire à partir d'un autre formulaire (statistiques agrégées)

Lorsque vous cochez **« Déduit d'un autre formulaire »** sur un formulaire, ce formulaire n'est plus rempli directement par les utilisateurs sur le terrain. IASO génère automatiquement ses soumissions en agrégeant les réponses d'un *autre* formulaire - en calculant une somme, une moyenne, un comptage, un minimum ou un maximum par unité d'organisation et par période.

## À quoi cela sert

Cette fonctionnalité est principalement utilisée dans le cadre de programmes de **Financement Basé sur la Performance (FBP)**. Cas typique : une enquête de satisfaction communautaire est remplie une fois par patient rencontré (le patient a-t-il été retrouvé ? quel score a-t-il donné ?). Pour la facturation, ce qui est réellement nécessaire, c'est l'agrégat par unité d'organisation et par période - combien de patients ont été retrouvés, quel a été le score de satisfaction moyen, etc.

Plutôt que de réencoder ces totaux manuellement, ou de dépendre des analytics/de l'agrégation d'événements propres à DHIS2 pour les calculer, IASO peut générer une soumission « statistique » directement à partir des réponses de l'enquête sous-jacente. Cet agrégat peut ensuite être utilisé pour la facturation au sein d'IASO (par exemple avec Hesabu), ou être mappé vers un ensemble de données DHIS2 pour un usage ultérieur.

## Comment le configurer

### 1. Créer le formulaire d'enquête et le formulaire de statistiques

Téléversez les deux formulaires dans IASO comme d'habitude :

- Le **formulaire d'enquête** est celui que les utilisateurs sur le terrain remplissent réellement (par exemple, une soumission par patient).
- Le **formulaire de statistiques** contient les résultats agrégés. Cochez-le comme **« Déduit d'un autre formulaire »** - cela empêche les utilisateurs sur le terrain de créer manuellement des soumissions de ce formulaire dans l'application mobile, puisqu'il est censé être généré, et non rempli.

![Case "Déduit d'un autre formulaire"](./deduce_form_from_another_form_attachments/deduced_checkbox.png)

Astuce : donnez le même préfixe de nom aux deux formulaires (par exemple « ... - statistique ») pour qu'ils apparaissent côte à côte dans les listes de formulaires.

### 2. Dans l'administration Django, créer un Mapping

Allez sur `/admin/iaso/mapping/` et ajoutez un nouveau **Mapping** :

- **Form** : le formulaire de statistiques (pas le formulaire d'enquête)
- **Mapping type** : `Derived`

![Administration Django - écran d'ajout de mapping](./deduce_form_from_another_form_attachments/django_admin_add_mapping.png)

**Attention** : l'administration Django affiche tous les projets et formulaires du compte. Il est facile de lier par erreur des formulaires appartenant à des projets sans rapport entre eux.

### 3. Créer une version de mapping avec les règles d'agrégation

Toujours dans l'administration Django, ajoutez une **version de mapping** pour ce mapping, en la faisant pointer vers une version spécifique du formulaire de statistiques, avec un JSON décrivant ce qu'il faut agréger :

```json
{
  "formId": "MALI-enquete_satisfaction01",
  "aggregations": [
    {
      "id": "score_satisfaction_communautaire_average",
      "name": "Score de satisfaction communautaire",
      "defaultValue": 0,
      "questionName": "score_satisfaction_communautaire",
      "aggregationType": "avg"
    },
    {
      "id": "nombre_submission",
      "name": "Nombre de submission de la satisfaction",
      "defaultValue": 0,
      "questionName": "MALI-PBF-patient_existe",
      "aggregationType": "count"
    }
  ]
}
```

![Administration Django - écran d'ajout de version de mapping](./deduce_form_from_another_form_attachments/django_admin_add_mapping_version.png)

Chaque entrée de `aggregations` signifie :

| Champ | Signification |
|---|---|
| `formId` | L'identifiant du formulaire d'**enquête** dont il faut lire les réponses |
| `id` | Le nom de la question dans le formulaire de **statistiques** où le résultat est écrit |
| `name` | Le libellé affiché pour cette question dans le formulaire de statistiques |
| `questionName` | Le nom de la question dans le formulaire d'**enquête** à agréger |
| `aggregationType` | Une valeur parmi `sum`, `avg`, `count`, `max`, `min` |
| `defaultValue` | La valeur utilisée quand il n'y a rien à agréger |

## Générer les instances déduites

Une fois que le formulaire d'enquête a des soumissions, allez dans **Forms > Completeness (Formulaires > Complétude)**, trouvez la ligne du formulaire d'enquête pour la période concernée, et cliquez sur l'icône de génération dans la colonne **Action(s)**.

![Écran de complétude avec l'action de génération](./deduce_form_from_another_form_attachments/completeness_generate_button.png)

Cela crée une nouvelle soumission du formulaire de statistiques par unité d'organisation et par période, remplie avec les valeurs calculées.

![Une soumission de statistiques générée](./deduce_form_from_another_form_attachments/generated_statistics_submission.png)

## Points de vigilance

- **La logique de saut ("relevant") change ce qui est moyenné.** Si une question (par exemple le score de satisfaction) n'est posée que sous une certaine condition (par exemple "patient retrouvé"), un `avg` ne fait la moyenne que sur les soumissions où cette question a effectivement été répondue - les réponses sautées ne comptent pas comme zéro. `avg(15, 12, 12, 0, 0)` et `avg(15, 12, 12)` donnent des résultats très différents ; déterminez le comportement réellement souhaité et ajustez la logique `relevant` de l'enquête en conséquence.
- **Testez avec au moins 3 soumissions**, dont certaines où la branche « non retrouvé » est déclenchée, pour vous assurer que l'agrégation se comporte comme prévu avant de vous y fier.
- **Régénérez après toute modification.** Si les soumissions de l'enquête changent après qu'une instance de statistiques a déjà été générée, il faut recliquer sur le bouton de génération pour la mettre à jour.

## Aller plus loin : envoyer l'agrégat vers DHIS2

L'instance de statistiques peut elle-même être la source d'un mapping DHIS2 supplémentaire (un mapping de type « Aggregate »), qui envoie les valeurs calculées vers un ensemble de données DHIS2. C'est ainsi que les indicateurs FBP agrégés alimentent ensuite les outils de facturation basés sur DHIS2.
