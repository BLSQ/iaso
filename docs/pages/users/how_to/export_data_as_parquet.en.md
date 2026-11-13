# Export data as parquet

To analyse submissions outside IASO (Superset, OpenHEXA, a notebook...), export them as
[parquet](https://parquet.apache.org/) files rather than csv or xlsx: the export is much faster, the file is
compressed and keeps the column types, and it can be queried directly with [DuckDB](https://duckdb.org/), pandas,
polars or Superset.

## Submissions and pyramid, joined

Download two files from the web interface:

- on the **Submissions** page, select **one** form, then **Download** > **Parquet**: `submissions.parquet`;
- on the **Org units** page, search with the status **All** in your data source version, then **Download** >
  **Parquet**: `pyramid.parquet`.

Each org unit row already contains its whole hierarchy (`level_1_name`, `level_2_name`, `level_3_name`...), so a
single join gives every level of the pyramid to each submission. With DuckDB:

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
    submissions.age -- a question of your form, one column per question
FROM 'submissions.parquet' AS submissions
LEFT JOIN 'pyramid.parquet' AS pyramid ON pyramid.org_unit_id = submissions.iaso_subm_org_unit_id;
```

| Column                          | Comes from | Contains                                                              |
|---------------------------------|------------|-----------------------------------------------------------------------|
| `level_2_name`, `level_3_name`  | pyramid    | name of the ancestors of the org unit at level 2, 3... of the pyramid |
| `org_unit_name`                 | pyramid    | name of the org unit of the submission                                |
| `org_unit_type_name`            | pyramid    | its type (health facility, village...)                                |
| `iaso_subm_id`                  | submission | id of the submission in IASO                                          |
| `iaso_subm_period`              | submission | period of the submission (`202611`...), for forms with a period       |
| `iaso_subm_created_at`          | submission | when IASO received it                                                 |
| `iaso_subm_created_by_username` | submission | user who sent it                                                      |
| `age`                           | submission | answer to the question `age` of the form, as text                     |

The submissions columns all start with `iaso_subm_`, the other ones are the questions of the form. The full list of
columns is in the [reference](#reference) below.

Which level is the region or the district depends on your pyramid: `level_1` is the root (usually the country).

In practice a project has several forms and one pyramid: download one file per form (an export holds one form),
and a single `pyramid.parquet` that every form joins to.

## Automate it with the API

The same files can be downloaded with the API by adding `parquet=true`, for example from a nightly OpenHEXA
pipeline. The export contains exactly what the IASO user sees in the web interface.

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
    """Minimal IASO API client: every call raises an error when something goes wrong."""

    def __init__(self, server, username, password):
        self.server = server
        self.session = requests.Session()
        token = self._check(self.session.post(f"{server}/api/token/", json={"username": username, "password": password}))
        self.session.headers["Authorization"] = f"Bearer {token.json()['access']}"

    def get(self, path, **params):
        return self._check(self.session.get(f"{self.server}{path}", params=params, timeout=600)).json()

    def download_parquet(self, path, file_name, **params):
        """Download a parquet export, the previous file is only replaced by a complete one."""
        start = time.monotonic()
        url = f"{self.server}{path}"
        # timeout: seconds without receiving data (the export can take a while to prepare), not the total time
        with self._check(self.session.get(url, params={**params, "parquet": "true"}, stream=True, timeout=1800)) as response:
            with open(f"{file_name}.tmp", "wb") as f:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    f.write(chunk)
        # raises if the file is cut or not parquet
        rows = duckdb.sql(f"SELECT count(*) FROM read_parquet('{file_name}.tmp')").fetchall()[0][0]
        columns = len(duckdb.sql(f"DESCRIBE SELECT * FROM read_parquet('{file_name}.tmp')").fetchall())
        os.replace(f"{file_name}.tmp", file_name)
        size_mb = os.path.getsize(file_name) / 1024 / 1024
        print(f"{file_name}: {rows} rows x {columns} columns, {size_mb:.1f} MB in {time.monotonic() - start:.1f}s")

    @staticmethod
    def _check(response):
        if not response.ok:
            # IASO explains the problem in the body, e.g. the accepted parameters
            raise RuntimeError(f"{response.status_code} {response.request.method} {response.url}: {response.text}")
        return response


iaso = IasoClient("https://iaso.bluesquare.org", os.environ["IASO_USERNAME"], os.environ["IASO_PASSWORD"])
FORM_IDS = [123, 124, 125]

# one pyramid, shared by all the forms
iaso.download_parquet(
    "/api/orgunits/",
    "pyramid.parquet",
    searches=json.dumps([{"defaultVersion": "true", "validation_status": "all"}]),
)

# one file per form
for form_id in FORM_IDS:
    iaso.download_parquet("/api/instances/", f"form_{form_id}.parquet", form_ids=form_id)
```

Run it with [uv](https://docs.astral.sh/uv/): `IASO_USERNAME=... IASO_PASSWORD=... uv run export.py`.

Then join each `form_<id>.parquet` to `pyramid.parquet` as above.

### Shapes and groups of the org units

The pyramid can also include the shapes and the groups of the org units, with `extra_fields`:

```python
iaso.download_parquet(
    "/api/orgunits/",
    "pyramid_with_shapes.parquet",
    searches=json.dumps([{"defaultVersion": "true", "validation_status": "all"}]),
    extra_fields="simplified_geom_geojson,groups_exploded",
)
```

- `org_unit_simplified_geom_geojson`: the simplified shape, as GeoJSON (use `geom_geojson` for the full one, much
  bigger);
- one column per group, `group_<id>_<name>`, containing `1` when the org unit is in the group, `0` otherwise. The name
  is in lowercase, other characters than letters and digits become `_`: the group 7 `Urban` gives `group_7_urban`.

For example, the shapes of the org units in the group `Urban`:

```sql
SELECT org_unit_name, org_unit_simplified_geom_geojson, group_3_public, group_7_urban
FROM 'pyramid_with_shapes.parquet'
WHERE group_7_urban = 1;
```

With `groups_exploded_code` instead, the columns don't contain the id (`group_urban`), but the export is refused when
two group names give the same column. All the options are in the [reference](#reference).

## One file per form: pyramid, answers and labels

The question columns contain the choice names (`1`, `yes`...), their labels are in the latest version of the form.
Continuing the script above, this builds a single `form_<id>_full.parquet` per form with:

- the submission columns (`iaso_subm_*`);
- the pyramid of its org unit (`org_unit_*`, `level_*`);
- each question, followed by `<question>_label` for the select questions.

```python
LANGUAGE = "French"  # as written in the xlsform: label::French, label::English (en)...


def label(item):
    """Label in LANGUAGE, the first language otherwise, the name when there is no label."""
    text = item.get("label", item["name"])
    if isinstance(text, dict):
        text = next((value for key, value in text.items() if key.startswith(LANGUAGE)), next(iter(text.values())))
    return text


def select_choices(children):
    """(question, choice name, choice label) of the select questions, also inside groups and repeats."""
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

    # submission columns, then the pyramid, then each question followed by its label
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

For a select one question `fever` with the choices `yes` and `no`, labelled `Oui` and `Non`, `fever` contains `yes`
and `fever_label` contains `Oui`. For a select multiple question, the labels of the chosen choices are joined:
`cough headache` gives `Maux de tête, Toux`.

## Good patterns

**Take all the org units of one version.** `validation_status: "all"` keeps the org units created in the field and
not validated yet, submissions can be attached to them. Without a version (`version` or `defaultVersion`), the same
health facility appears once per version of the pyramid.

**Don't download the pyramid at each run.** It changes much less than the submissions: download it again once a day,
or when submissions point to org units it doesn't contain yet.

**A lot of submissions: download only what changed.** Download the submissions per period of modification (a day, a week or a
month), one file per period, with `modificationDateFrom` and `modificationDateTo` (whole UTC days, inclusive). At the
next run, only download again the periods that are not over yet. Download the deleted submissions the same way with
`showDeleted=true` (it returns **only** the deleted ones). Then rebuild the current state: the most recent row of each
submission, without the ones deleted since.

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

**Read the files with `union_by_name = true`.** The form changes over time: older files don't have the columns of the
questions added since.

**Stop on errors.** `IasoClient` raises an error with the message of IASO (wrong password, unsupported
parameter...) and only replaces a file by a complete download: a failed run never leaves partial data behind.

**Convert the answers.** Answers are exported as text: `TRY_CAST(age AS INTEGER)`, `TRY_CAST(visit_date AS DATE)`.

## Reference

### Submissions: `/api/instances/?form_ids=123&parquet=true`

`form_ids` must contain **exactly one** form id. Accepted filters: `modificationDateFrom`, `modificationDateTo`,
`dateFrom`, `dateTo` (creation), `sentDateFrom`, `sentDateTo` (reception by the server), `startPeriod`, `endPeriod`,
`orgUnitParentId`, `orgUnitTypeId`, `org_unit_status`, `showDeleted`, `status`, `validation_status`, `withLocation`,
`userIds`, `project_ids`, `missionIds`, `planningIds`, `deviceId`, `deviceOwnershipId`, `referenceInstances`,
`search`, `jsonContent`, `workflow_ids`, `order`. Any other parameter is refused (error `409`).

Columns:

- `iaso_subm_*`: the submission (`iaso_subm_id`, `iaso_subm_uuid`, `iaso_subm_period`, `iaso_subm_org_unit_id`,
  `iaso_subm_created_at`, `iaso_subm_updated_at`, `iaso_subm_created_by_username`, `iaso_subm_latitude`,
  `iaso_subm_longitude`...);
- one column per question of the form, named after the question. Characters other than letters, digits and `_`
  become `_`, a question named `id` becomes `answer_id`.

### Org units: `/api/orgunits/?parquet=true&searches=[{...}]`

The filters go in `searches`, a JSON list with **one** search using the keys of the **Org units** page: `version`,
`defaultVersion`, `validation_status` (`VALID` by default, `NEW`, `REJECTED`, `all`), `orgUnitTypeId`,
`orgUnitParentId`, `group`... Only `parquet`, `searches`, `order` and `extra_fields` are accepted.

Columns:

- `org_unit_*`: the org unit (`org_unit_id`, `org_unit_name`, `org_unit_source_ref`, `org_unit_type_name`,
  `org_unit_parent_id`, `org_unit_validation_status`, `org_unit_latitude`, `org_unit_longitude`, `org_unit_level`...);
- `level_{n}_id`, `level_{n}_name`, `level_{n}_source_ref`, `level_{n}_closed_date`, `level_{n}_validation_status`:
  its ancestor at each level.

Optional columns, comma separated in `extra_fields`: `simplified_geom_geojson`, `geom_geojson` (full shape, can be
big), `biggest_polygon_geojson` (largest polygon, Superset maps don't support multipolygons), `location_geojson`,
`groups_json` (list of groups), `groups_exploded` (one `0`/`1` column per group: `group_<id>_<name>`),
`groups_exploded_code` (same without the id: `group_<name>`).
