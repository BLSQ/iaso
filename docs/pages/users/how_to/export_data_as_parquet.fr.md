# Exporter les données en parquet

Pour analyser les soumissions en dehors d'IASO (Superset, OpenHEXA, un notebook...), exportez-les en fichiers
[parquet](https://parquet.apache.org/) plutôt qu'en csv ou xlsx : l'export est beaucoup plus rapide, le fichier est
compressé et garde le type des colonnes, et il se lit directement avec [DuckDB](https://duckdb.org/), pandas, polars
ou Superset.

## Soumissions et pyramide, jointes

Téléchargez deux fichiers depuis l'interface web :

- sur la page **Soumissions**, sélectionnez **un seul** formulaire, puis **Télécharger** > **Parquet** :
  `submissions.parquet` ;
- sur la page **Unités d'organisation**, recherchez avec le statut **Tous** dans votre version de source de données,
  puis **Télécharger** > **Parquet** : `pyramid.parquet`.

Chaque ligne d'unité d'organisation contient déjà toute sa hiérarchie (`level_1_name`, `level_2_name`,
`level_3_name`...) : une seule jointure donne tous les niveaux de la pyramide à chaque soumission. Avec DuckDB :

```sql
SELECT
    pyramid.level_2_name AS region,
    pyramid.level_3_name AS district,
    pyramid.org_unit_name,
    pyramid.org_unit_type_name,
    submissions.iaso_subm_id,
    submissions.iaso_subm_period,
    submissions.iaso_subm_created_at,
    submissions.iaso_subm_created_by_username,
    submissions.age -- une question de votre formulaire, une colonne par question
FROM 'submissions.parquet' AS submissions
LEFT JOIN 'pyramid.parquet' AS pyramid ON pyramid.org_unit_id = submissions.iaso_subm_org_unit_id;
```

| Colonne                         | Vient de   | Contient                                                                   |
|---------------------------------|------------|----------------------------------------------------------------------------|
| `level_2_name`, `level_3_name`  | pyramide   | nom des ancêtres de l'unité d'organisation au niveau 2, 3... de la pyramide |
| `org_unit_name`                 | pyramide   | nom de l'unité d'organisation de la soumission                             |
| `org_unit_type_name`            | pyramide   | son type (formation sanitaire, village...)                                 |
| `iaso_subm_id`                  | soumission | identifiant de la soumission dans IASO                                     |
| `iaso_subm_period`              | soumission | période de la soumission (`202611`...), pour les formulaires avec période  |
| `iaso_subm_created_at`          | soumission | date de réception par IASO                                                 |
| `iaso_subm_created_by_username` | soumission | utilisateur qui l'a envoyée                                                |
| `age`                           | soumission | réponse à la question `age` du formulaire, en texte                        |

Les colonnes de la soumission commencent toutes par `iaso_subm_`, les autres sont les questions du formulaire. La
liste complète des colonnes est dans la [référence](#reference) plus bas.

Le niveau de la région ou du district dépend de votre pyramide : `level_1` est la racine (en général le pays).

En pratique un projet a plusieurs formulaires et une seule pyramide : téléchargez un fichier par formulaire (un
export contient un seul formulaire), et un seul `pyramid.parquet` auquel tous les formulaires se joignent.

## Automatiser avec l'API

Les mêmes fichiers se téléchargent avec l'API en ajoutant `parquet=true`, par exemple depuis un pipeline OpenHEXA
lancé chaque nuit. L'export contient exactement ce que l'utilisateur IASO voit dans l'interface web.

```python
# /// script
# dependencies = ["requests", "duckdb"]
# ///
import json
import os
import time

import duckdb
import requests


class IasoClient:
    """Client minimal de l'API IASO : chaque appel lève une erreur en cas de problème."""

    def __init__(self, server, username, password):
        self.server = server
        self.session = requests.Session()
        token = self._check(self.session.post(f"{server}/api/token/", json={"username": username, "password": password}))
        self.session.headers["Authorization"] = f"Bearer {token.json()['access']}"

    def get(self, path, **params):
        return self._check(self.session.get(f"{self.server}{path}", params=params, timeout=600)).json()

    def download_parquet(self, path, file_name, **params):
        """Télécharge un export parquet, l'ancien fichier n'est remplacé que par un fichier complet."""
        start = time.monotonic()
        url = f"{self.server}{path}"
        # timeout : secondes sans recevoir de données (l'export peut être long à préparer), pas la durée totale
        with self._check(self.session.get(url, params={**params, "parquet": "true"}, stream=True, timeout=1800)) as response:
            with open(f"{file_name}.tmp", "wb") as f:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    f.write(chunk)
        # lève une erreur si le fichier est coupé ou n'est pas du parquet
        rows = duckdb.sql(f"SELECT count(*) FROM read_parquet('{file_name}.tmp')").fetchall()[0][0]
        columns = len(duckdb.sql(f"DESCRIBE SELECT * FROM read_parquet('{file_name}.tmp')").fetchall())
        os.replace(f"{file_name}.tmp", file_name)
        size_mb = os.path.getsize(file_name) / 1024 / 1024
        print(f"{file_name}: {rows} rows x {columns} columns, {size_mb:.1f} MB in {time.monotonic() - start:.1f}s")

    @staticmethod
    def _check(response):
        if not response.ok:
            # IASO explique le problème dans la réponse, par ex. les paramètres acceptés
            raise RuntimeError(f"{response.status_code} {response.request.method} {response.url}: {response.text}")
        return response


iaso = IasoClient("https://iaso.bluesquare.org", os.environ["IASO_USERNAME"], os.environ["IASO_PASSWORD"])
FORM_IDS = [123, 124, 125]

# une seule pyramide, partagée par tous les formulaires
iaso.download_parquet(
    "/api/orgunits/",
    "pyramid.parquet",
    searches=json.dumps([{"defaultVersion": "true", "validation_status": "all"}]),
)

# un fichier par formulaire
for form_id in FORM_IDS:
    iaso.download_parquet("/api/instances/", f"form_{form_id}.parquet", form_ids=form_id)
```

Lancez-le avec [uv](https://docs.astral.sh/uv/) : `IASO_USERNAME=... IASO_PASSWORD=... uv run export.py`.

Joignez ensuite chaque `form_<id>.parquet` à `pyramid.parquet` comme ci-dessus.

### Contours et groupes des unités d'organisation

La pyramide peut aussi contenir les contours et les groupes des unités d'organisation, avec `extra_fields` :

```python
iaso.download_parquet(
    "/api/orgunits/",
    "pyramid_with_shapes.parquet",
    searches=json.dumps([{"defaultVersion": "true", "validation_status": "all"}]),
    extra_fields="simplified_geom_geojson,groups_exploded",
)
```

- `org_unit_simplified_geom_geojson` : le contour simplifié, en GeoJSON (`geom_geojson` pour le contour complet,
  beaucoup plus lourd) ;
- une colonne par groupe, `group_<id>_<nom>`, qui contient `1` quand l'unité d'organisation est dans le groupe, `0`
  sinon. Le nom est en minuscules, les caractères autres que lettres et chiffres deviennent `_` : le groupe 7 `Urban`
  donne `group_7_urban`.

Par exemple, les contours des unités d'organisation du groupe `Urban` :

```sql
SELECT org_unit_name, org_unit_simplified_geom_geojson, group_3_public, group_7_urban
FROM 'pyramid_with_shapes.parquet'
WHERE group_7_urban = 1;
```

Avec `groups_exploded_code` à la place, les colonnes ne contiennent pas l'identifiant (`group_urban`), mais l'export
est refusé quand deux noms de groupes donnent la même colonne. Toutes les options sont dans la
[référence](#reference).

## Un fichier par formulaire : pyramide, réponses et libellés

Les colonnes des questions contiennent le nom des choix (`1`, `yes`...), leurs libellés sont dans la dernière version
du formulaire. À la suite du script ci-dessus, ceci construit un seul `form_<id>_full.parquet` par formulaire avec :

- les colonnes de la soumission (`iaso_subm_*`) ;
- la pyramide de son unité d'organisation (`org_unit_*`, `level_*`) ;
- chaque question, suivie de `<question>_label` pour les questions à choix.

```python
LANGUAGE = "French"  # comme dans le xlsform : label::French, label::English (en)...


def label(item):
    """Libellé dans LANGUAGE, sinon dans la première langue, le nom quand il n'y a pas de libellé."""
    text = item.get("label", item["name"])
    if isinstance(text, dict):
        text = next((value for key, value in text.items() if key.startswith(LANGUAGE)), next(iter(text.values())))
    return text


def select_choices(children):
    """(question, nom du choix, libellé du choix) des questions à choix, aussi dans les groupes et répétitions."""
    for question in children:
        if question["type"].startswith("select"):
            for choice in question["children"]:
                yield question["name"], choice["name"], label(choice)
        elif "children" in question:  # group, repeat
            yield from select_choices(question["children"])


def label_column(question):
    return f"""(SELECT string_agg(label, ', ' ORDER BY label) FROM choices
        WHERE question = '{question}' AND list_contains(string_split(submissions."{question}", ' '), value)
    ) AS {question}_label"""


for form_id in FORM_IDS:
    form_version = iaso.get(
        "/api/formversions/", form_id=form_id, fields="descriptor", order="-created_at", limit=1
    )["form_versions"][0]
    duckdb.sql("CREATE OR REPLACE TABLE choices (question VARCHAR, value VARCHAR, label VARCHAR)")
    duckdb.executemany("INSERT INTO choices VALUES (?, ?, ?)", list(select_choices(form_version["descriptor"]["children"])))
    select_questions = {question for (question,) in duckdb.sql("SELECT DISTINCT question FROM choices").fetchall()}

    # colonnes de la soumission, puis la pyramide, puis chaque question suivie de son libellé
    columns = [row[0] for row in duckdb.sql(f"DESCRIBE SELECT * FROM 'form_{form_id}.parquet'").fetchall()]
    selected = [f'submissions."{column}"' for column in columns if column.startswith("iaso_subm_")]
    selected.append("pyramid.*")
    for column in columns:
        if not column.startswith("iaso_subm_"):
            selected.append(f'submissions."{column}"')
            if column in select_questions:
                selected.append(label_column(column))

    duckdb.sql(
        f"""
        COPY (
            SELECT {", ".join(selected)}
            FROM 'form_{form_id}.parquet' AS submissions
            LEFT JOIN 'pyramid.parquet' AS pyramid ON pyramid.org_unit_id = submissions.iaso_subm_org_unit_id
        ) TO 'form_{form_id}_full.parquet' (FORMAT parquet)
        """
    )
```

Pour une question à choix unique `fever` avec les choix `yes` et `no`, libellés `Oui` et `Non`, `fever` contient
`yes` et `fever_label` contient `Oui`. Pour une question à choix multiples, les libellés des choix sélectionnés sont
joints : `cough headache` donne `Maux de tête, Toux`.

## Bonnes pratiques

**Prendre toutes les unités d'organisation d'une version.** `validation_status: "all"` garde les unités
d'organisation créées sur le terrain et pas encore validées, des soumissions peuvent y être rattachées. Sans version
(`version` ou `defaultVersion`), la même formation sanitaire apparaît une fois par version de la pyramide.

**Ne pas retélécharger la pyramide à chaque fois.** Elle change beaucoup moins que les soumissions : retéléchargez-la
une fois par jour, ou quand des soumissions pointent vers des unités d'organisation qu'elle ne contient pas encore.

**Beaucoup de soumissions : ne télécharger que ce qui a changé.** Téléchargez les soumissions par période de modification
(un jour, une semaine ou un mois), un fichier par période, avec `modificationDateFrom` et `modificationDateTo` (jours
entiers en UTC, inclus). À l'exécution suivante, ne retéléchargez que les périodes pas encore terminées. Téléchargez
de la même façon les soumissions supprimées avec `showDeleted=true` (qui renvoie **uniquement** les supprimées). Puis
reconstruisez l'état actuel : la ligne la plus récente de chaque soumission, sans celles supprimées depuis.

```sql
COPY (
    WITH active AS (
        SELECT *, row_number() OVER (PARTITION BY iaso_subm_id ORDER BY iaso_subm_updated_at DESC) AS version
        FROM read_parquet('active/*.parquet', union_by_name = true)
    ),
    deleted AS (
        SELECT iaso_subm_id, max(iaso_subm_updated_at) AS deleted_at
        FROM read_parquet('deleted/*.parquet', union_by_name = true)
        GROUP BY iaso_subm_id
    )
    SELECT active.* EXCLUDE (version)
    FROM active
    LEFT JOIN deleted USING (iaso_subm_id)
    WHERE active.version = 1
      AND (deleted.deleted_at IS NULL OR deleted.deleted_at < active.iaso_subm_updated_at)
) TO 'submissions.parquet' (FORMAT parquet, COMPRESSION zstd);
```

**Lire les fichiers avec `union_by_name = true`.** Le formulaire évolue : les fichiers plus anciens n'ont pas les
colonnes des questions ajoutées depuis.

**S'arrêter sur les erreurs.** `IasoClient` lève une erreur avec le message d'IASO (mauvais mot de passe,
paramètre non supporté...) et ne remplace un fichier que par un téléchargement complet : une exécution en échec ne
laisse jamais de données partielles.

**Convertir les réponses.** Les réponses sont exportées en texte : `TRY_CAST(age AS INTEGER)`,
`TRY_CAST(visit_date AS DATE)`.

## Référence

### Soumissions : `/api/instances/?form_ids=123&parquet=true`

`form_ids` doit contenir **exactement un** identifiant de formulaire. Filtres acceptés : `modificationDateFrom`,
`modificationDateTo`, `dateFrom`, `dateTo` (création), `sentDateFrom`, `sentDateTo` (réception par le serveur),
`startPeriod`, `endPeriod`, `orgUnitParentId`, `orgUnitTypeId`, `org_unit_status`, `showDeleted`, `status`,
`validation_status`, `withLocation`, `userIds`, `project_ids`, `missionIds`, `planningIds`, `deviceId`,
`deviceOwnershipId`, `referenceInstances`, `search`, `jsonContent`, `workflow_ids`, `order`. Tout autre paramètre est
refusé (erreur `409`).

Colonnes :

- `iaso_subm_*` : la soumission (`iaso_subm_id`, `iaso_subm_uuid`, `iaso_subm_period`, `iaso_subm_org_unit_id`,
  `iaso_subm_created_at`, `iaso_subm_updated_at`, `iaso_subm_created_by_username`, `iaso_subm_latitude`,
  `iaso_subm_longitude`...) ;
- une colonne par question du formulaire, nommée d'après la question. Les caractères autres que lettres, chiffres et
  `_` deviennent `_`, une question nommée `id` devient `answer_id`.

### Unités d'organisation : `/api/orgunits/?parquet=true&searches=[{...}]`

Les filtres se mettent dans `searches`, une liste JSON avec **une seule** recherche qui utilise les clés de la page
**Unités d'organisation** : `version`, `defaultVersion`, `validation_status` (`VALID` par défaut, `NEW`, `REJECTED`,
`all`), `orgUnitTypeId`, `orgUnitParentId`, `group`... Seuls `parquet`, `searches`, `order` et `extra_fields` sont
acceptés.

Colonnes :

- `org_unit_*` : l'unité d'organisation (`org_unit_id`, `org_unit_name`, `org_unit_source_ref`,
  `org_unit_type_name`, `org_unit_parent_id`, `org_unit_validation_status`, `org_unit_latitude`,
  `org_unit_longitude`, `org_unit_level`...) ;
- `level_{n}_id`, `level_{n}_name`, `level_{n}_source_ref`, `level_{n}_closed_date`, `level_{n}_validation_status` :
  son ancêtre à chaque niveau.

Colonnes optionnelles, séparées par des virgules dans `extra_fields` : `simplified_geom_geojson`, `geom_geojson`
(contour complet, peut être lourd), `biggest_polygon_geojson` (plus grand polygone, les cartes Superset ne gèrent pas
les multipolygones), `location_geojson`, `groups_json` (liste des groupes), `groups_exploded` (une colonne `0`/`1`
par groupe : `group_<id>_<nom>`), `groups_exploded_code` (pareil sans l'identifiant : `group_<nom>`).
