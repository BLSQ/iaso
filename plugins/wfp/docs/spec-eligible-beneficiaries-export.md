# Spec (draft): eligible-beneficiary extraction and incremental beneficiary data export for CODA

- **Status:** Draft for discussion
- **Author:** Martin De Wulf (Bluesquare)
- **Date:** 2026-10-01
- **Scope:** IASO / CODA, `wfp` plugin. Bangladesh BSFP/NSEP is the first use case; the design is meant to work for every CODA country.

---

## 1. Context and goal

WFP Country Offices need to generate **eligible-beneficiary lists** for each monthly reporting cycle. The Transfer Management team uses these lists. For each cycle, the list must include:

- beneficiaries with an actual visit between the **26th of the previous month and the 25th of the current month**,
- whose visit was **synchronised to the server by the 25th**,
- who are still eligible (Green MUAC, 24–35 months for NSEP children, not exited),
- once per beneficiary, programme and cycle,
- with identifying fields (Progress ID, FCN, INF, camp, …) that **differ between countries and projects**.

Rather than building a single hard-coded "BSFP list" screen, this spec proposes a **general beneficiary data export layer**:

1. It is **built on top of the existing WFP ETL tables** (`wfp_beneficiary`, `wfp_journey`, `wfp_visit`, `wfp_step`). Any figures partners compute from it then match the dashboards (Tableau/Superset), which already read these tables.
2. It **re-attaches non-anonymised information from the forms**: the beneficiary's reference form and the visit's form instance. Which fields are included is **configured on the entity type**.
3. It is **exported incrementally** (via Athena) to an S3 bucket that WFP/partners can access, so they can run the eligibility extraction and any other analysis they need.
4. **Personal data (PII) is declared on the forms**, question by question. When the data is shared with partners, PII fields are removed or pseudonymised, whichever form they come from (reference form, visit forms, assistance forms, …). For example, the name of the person who referred the beneficiary is PII even though it sits in a visit form.

The eligibility rules from the ticket then become a **reference query (view)** over the exported data (section 7). Section 9 discusses whether the list is also produced inside CODA.

### Non-goals (for this iteration)

- Changing how the ETL computes journeys, exits or programmes. The export reuses the ETL's results.
- Building a generic UI for designing reports.
- Pushing data to WFP systems (SCOPE, PRISM, …) directly.

---

## 2. Current state (what the code does today)

### 2.1 ETL tables (`plugins/wfp/models.py`)

| Table | Content | Key columns |
|---|---|---|
| `wfp_beneficiary` | One row per entity (anonymised) | `id`, `entity_id`, `account_id`, `birth_date`, `gender`, `guidelines` |
| `wfp_journey` | One row per programme enrolment (admission → exit) | `beneficiary_id`, `nutrition_programme` (TSFP/OTP/BSFP/NSEP/…), `programme_type` (U5/PLW), `physiology_status`, `admission_type`, `admission_criteria`, `start_date`, `end_date`, `exit_type`, weights, `instance_id` |
| `wfp_visit` | One row per anthropometric visit | `journey_id`, `date`, `number`, `org_unit_id`, `muac_size`, `whz_color`, `oedema`, `entry_point`, `instance_id` |
| `wfp_step` | One row per assistance item given during a visit | `visit_id`, `assistance_type`, `quantity_given`, `ration_size`, `instance_id` |

Celery tasks run the ETL per country: `etl_ssd`, `etl_ng`, `etl_ethiopia`, `etl_bangladesh` (`plugins/wfp/tasks.py`). Management commands with the same names exist (`manage etl_bangladesh [all_data]`). The core logic is in `plugins/wfp/common.py` (`ETL` class).

### 2.2 Properties that matter for this design

1. **The ETL rewrites whole beneficiaries.** On each run it gets the entities whose instances changed since the last successful run (`get_updated_entity_ids`, based on `Instance.updated_at`; the watermark has day granularity). It **deletes** their `Beneficiary` rows, which cascades to journeys, visits and steps. It then `bulk_create`s new ones in one transaction per batch (`ETL._save_all`).
   → A beneficiary and all its journeys, visits and steps are always written **together, as a unit**. This design builds on that.
   → **The integer primary keys of the ETL tables are not stable**, so we cannot use them as export identifiers.
2. **Every ETL row can be traced to a stable source:**
   - `Beneficiary.entity_id` → `iaso_entity.uuid` (stable, generated on the device).
   - `Visit.instance_id` → `iaso_instance.uuid` of the anthropometric form submission (stable).
   - `Journey.instance_id` → the admission submission (stable when present).
   - `Step.instance_id` → the assistance submission.
3. **Deleted entities simply disappear.** `Entity.soft_delete_with_instances_and_pending_duplicates` also soft-deletes the entity's instances, which bumps their `updated_at`. The ETL therefore picks the entity up and deletes its `Beneficiary`. However, `_retrieve_submissions` excludes deleted instances and deleted entities, so **nothing is recreated**. No row is left to tell an incremental export that the beneficiary is gone.
4. **Actual visit date.** For Bangladesh, `Visit.date` already comes from the `visit_date` field entered in the form (`extract_form_visit_date`). Other countries use `source_created_at`, the creation time on the device.
5. **Synchronisation date.** `iaso_instance.created_at` is the time the server first received the submission. `iaso_instance.updated_at` is the time of the last change on the server, for example an edit or a re-upload.
6. **Business identifiers are not in the ETL tables.** Progress ID, FCN, names, camp and EDD are in the entity's **reference form** (`EntityType.reference_form` → `Entity.attributes`) or in the **visit forms**. Their field names differ between countries.
7. `EntityType` already holds field lists that point into the reference form (`fields_list_view`, `fields_detail_info_view`, `fields_duplicate_search`). The export configuration follows the same pattern.

---

## 3. Architecture overview

```
 Mobile app ──sync──► iaso_instance / iaso_entity
                              │
                              ▼
   EntityType.export_config ─► ┌─────────────────────────────────────┐
   (fields to export)          │ WFP ETL (logic unchanged)           │
                               │  writes per beneficiary, per batch: │
                               │  wfp_beneficiary/journey/visit/step │──► Dashboards
                               │    + created_at (anonymised)        │    (Tableau / Superset)
                               │  wfp_beneficiary_fields             │
                               │  wfp_visit_fields   (identifiable)  │
                               │  wfp_deleted_beneficiary            │
                               └──────────────────┬──────────────────┘
                                                  │ views wfp_export_* (joins with
                                                  │ iaso_entity / iaso_instance / iaso_orgunit)
                                                  ▼
                                 Athena (PostgreSQL federated connector)
   Form.pii_fields ────────────► UNLOAD … WHERE created_at in (wm_prev, wm_new]
   (PII per question)            PII fields removed / pseudonymised
                                                  ▼
                               s3://<wfp-export-bucket>/<account>/<table>/export_date=…/
                                                  │
                                                  ▼
                        Partners / WFP: eligibility lists, reconciliation, analyses
```

Design principles:

- **The ETL is the single source of truth for business logic** (journeys, programmes, exits). The export only joins, renames and adds traceability. It never re-derives programme logic.
- **Change detection uses a creation date.** Every row the ETL writes gets a `created_at`. Since the ETL rewrites a beneficiary completely whenever anything about it changes, `created_at` effectively means "last time this beneficiary was recomputed". The export sends every beneficiary recomputed since the previous export.
- **The beneficiary is the unit of replacement.** Consumers do not upsert row by row. When a beneficiary appears in an export, they replace everything they hold for it (section 8.3). This handles visits or journeys that disappeared without needing per-row tombstones.
- **Explicit deletion log.** Only beneficiaries that disappear completely need a deletion record (`wfp_deleted_beneficiary`).
- **Identifiable data is kept separate.** The ETL tables stay anonymised. Configured form fields go into separate `*_fields` tables with their own access controls.
- **What is PII is decided per form question, not per export.** `EntityType.export_config` says *which* fields are exported. `Form.pii_fields` says *which questions are personal data*, and the PII policy is applied when data leaves CODA (section 4.4). The two concerns are kept apart: a PII question stays protected whichever export or entity type uses it.

---

## 4. Configuration: which fields to export

### 4.1 Where

Add a new JSON field **`export_config`** on `iaso.EntityType`. It is edited in the entity type configuration screen, next to the existing "fields list view / detail view / duplicate search" settings.

> Alternative: a separate `EntityTypeExportField` model, one row per field. That is easier to validate in the UI but heavier. A JSON field validated by a JSON schema is enough for v1, and we can migrate later if needed.

### 4.2 Format

```json
{
  "version": 1,
  "beneficiary": [
    { "alias": "progress_id", "type": "text",
      "sources": [{ "form": "@reference", "path": "progress_id" }] },
    { "alias": "fcn", "type": "text",
      "sources": [{ "form": "@reference", "path": "fcn" }] },
    { "alias": "first_name", "type": "text",
      "sources": [{ "form": "@reference", "path": "first_name" }] },
    { "alias": "camp", "type": "text",
      "sources": [{ "form": "@reference", "path": "camp" }] }
  ],
  "visit": [
    { "alias": "child_birth_date", "type": "date",
      "sources": [
        { "form": "bsfp_pbwg_visit", "path": "child_dob" },
        { "form": "bsfp_pbwg_followup_visit", "path": "infant_birth_date" }
      ] },
    { "alias": "edd", "type": "date",
      "sources": [
        { "form": "bsfp_pbwg_visit", "path": "edd" },
        { "form": "bsfp_pbwg_followup_visit", "path": "expected_delivery_date" }
      ] }
  ]
}
```

Rules:

- `alias` becomes the column name in the export. It is `snake_case` and unique within its scope (`beneficiary` or `visit`). Aliases are the **stable contract with partners**: a form question can be renamed without breaking downstream consumers, as long as the alias stays the same.
- `sources` is an ordered list. The first non-empty value wins. This handles forms that use different field names for the same concept, which already happens today, e.g. `muac` / `muac_size` / `mother_muac`.
- `form`: `@reference` means the entity type's reference form (the `Entity.attributes` instance). Any other value is a `form_id`. For `visit` fields, the ETL checks the anthropometric instance of the visit first, then the other instances in the same visit group (the assistance form, for example).
- `path` is the question name, or a `group/question` path for nested groups.
- `type` (`text`, `integer`, `decimal`, `date`, `boolean`) is used to cast values when flattening to Parquet. A value that fails the cast is exported as `NULL`, and the ETL logs a warning.
- `export_config` does **not** say whether a field is personal data. That comes from the source forms (section 4.4).
- The UI should propose field names from the latest form versions (`FormVersion.possible_fields`), the same way the existing field pickers do. It should also show a "PII" badge on questions flagged in their form.

### 4.3 Changing the configuration

The configured fields are extracted **by the ETL**, when it writes the beneficiary. A configuration change therefore only takes effect for beneficiaries that are recomputed afterwards.

To apply a change to all beneficiaries, saving `export_config` must trigger (or require) a **full ETL run** for the country (`all_data`). That run recreates every beneficiary with a new `created_at`, so the next export is in effect a full snapshot with the new columns. Consumers must handle new columns appearing (Parquet schema evolution).

### 4.4 Personal data declaration on forms

PII can appear in **any** form, not only in the entity type's reference form. Examples are the referrer's name in a visit form, a caregiver's phone number in an assistance form, or free-text comments. PII is therefore declared **on the form, per question**, by whoever manages the form. It applies to every use of that question.

**Where:** a new JSON field **`pii_fields`** on `iaso.Form`. It is edited on the form's detail page, with a question picker based on `possible_fields`, the same pattern as `label_keys`.

```json
[
  { "path": "first_name",     "treatment": "remove" },
  { "path": "last_name",      "treatment": "remove" },
  { "path": "phone_number",   "treatment": "remove" },
  { "path": "referrer_name",  "treatment": "remove" },
  { "path": "fcn",            "treatment": "pseudonymise" }
]
```

- `path` is the question name, or a `group/question` path. It is declared on the **form**, not on a form version, so it carries over to new versions as long as the question keeps its name.
- `treatment` says what happens to the value when data is shared with partners:
  - `remove`: the column is dropped from the partner export;
  - `pseudonymise`: the value is replaced by `HMAC-SHA256(secret, value)`. The result is stable across exports, so partners can still deduplicate, count and join on it, but cannot recover the value. The secret is per account, kept in the secrets manager, and never shared.
- **Form version upload:** when a new version no longer contains a flagged `path`, the upload shows a warning. A renamed PII question would otherwise silently lose its protection.

**How it is applied:**

- **Internal tables keep the clear values.** `wfp_beneficiary_fields` and `wfp_visit_fields` store values as collected. The PII policy is applied **when data leaves CODA**:
  - the partner export (section 8.2) applies the treatments;
  - the in-app download for authorised CODA users (section 9, option B) can show clear values, under its own permission.
- **From questions to export columns.** An export column (`alias`) can have several sources (section 4.2). The column is PII if **at least one** of its sources is flagged in its form. If the treatments differ, the strictest wins: `remove` > `pseudonymise`.
- **Raw form data.** If the partner export later includes raw form data beyond `export_config` (for example a full dump of a form's answers), the same `pii_fields` apply. Protection does not depend on someone remembering to exclude the field in the export configuration.
- **Default:** unflagged questions are exported in clear **only** if `export_config` selects them. Nothing leaves CODA unless it is both selected and either non-PII or treated.

> Alternative considered: declaring PII in the XLSForm itself (a custom column, e.g. `pii`, read when the form version is uploaded). It keeps the declaration next to the question definition and versioned with it. However, every form designer has to adopt the convention, and existing forms need to be re-uploaded. Storing it on `Form` works immediately for existing forms. Reading an XLSForm `pii` column to pre-fill `pii_fields` can be added later.

---

## 5. Data model

### 5.1 Changes to the existing ETL tables

Add one column to `wfp_beneficiary`, `wfp_journey`, `wfp_visit` and `wfp_step`:

| Column | Type | Meaning |
|---|---|---|
| `created_at` | `timestamptz NOT NULL` | Time the ETL wrote the row |

- In `ETL._save_all`, take a **single timestamp per batch** (`batch_ts = timezone.now()`) and assign it to every object of the batch. All rows of a beneficiary then share exactly the same `created_at`.
- Index: `(account_id, created_at)` on `wfp_beneficiary`. The export selects beneficiaries on this index and reaches journeys, visits and steps through their foreign keys.
- No other change: no new keys and no personal data. The dashboards are not affected.

### 5.2 New tables (written by the ETL)

**`wfp_beneficiary_fields`**: identifiable data for a beneficiary. It is deleted together with its beneficiary (`ON DELETE CASCADE`) and rewritten with it.

| Column | Type | Source |
|---|---|---|
| `beneficiary_id` | int, PK, FK → `wfp_beneficiary` (cascade) | |
| `reference_instance_id` | int | `Entity.attributes` |
| `fields` | jsonb | `{alias: value}` for the `beneficiary` entries of `export_config` |
| `created_at` | timestamptz | `batch_ts` |

**`wfp_visit_fields`**: identifiable or extra data for a visit. It is also cascade-deleted with its visit.

| Column | Type | Source |
|---|---|---|
| `visit_id` | int, PK, FK → `wfp_visit` (cascade) | |
| `fields` | jsonb | `{alias: value}` for the `visit` entries of `export_config` |
| `created_at` | timestamptz | `batch_ts` |

**`wfp_deleted_beneficiary`**: deletion log. It is **never** cascade-deleted.

| Column | Type | Meaning |
|---|---|---|
| `id` | bigserial PK | |
| `account_id` | int | |
| `entity_type_code` | text | |
| `entity_id` | int | |
| `entity_uuid` | text | Key used by consumers |
| `reason` | text | `entity_deleted`, `entity_merged`, `no_longer_produced` |
| `created_at` | timestamptz, indexed with `account_id` | Time the deletion was recorded |

### 5.3 Export views

The export does not read the ETL tables directly. It reads **views** that join them with `iaso_entity`, `iaso_instance`, `iaso_orgunit` and the `*_fields` tables. The views expose stable natural keys instead of the volatile integer ids. Every view carries `beneficiary_key` and `etl_created_at` (the beneficiary's `created_at`), which the export filters on.

**`wfp_export_beneficiary`**

| Column | Type | Source |
|---|---|---|
| `beneficiary_key` | text | `iaso_entity.uuid` |
| `account_id`, `entity_type_code` | | |
| `etl_created_at` | timestamptz | `wfp_beneficiary.created_at` |
| `entity_id` | int | `iaso_entity.id` (CODA Case ID, see Q1) |
| `birth_date`, `gender`, `guidelines` | | `wfp_beneficiary` |
| `registration_date` | timestamptz | `iaso_entity.created_at` |
| `reference_instance_uuid` | text | `iaso_instance.uuid` of `Entity.attributes` |
| `reference_sync_date`, `reference_last_sync_date` | timestamptz | `created_at` / `updated_at` of the reference instance |
| `fields` | jsonb | `wfp_beneficiary_fields.fields` |

**`wfp_export_journey`**

| Column | Type | Source |
|---|---|---|
| `journey_key` | text | `iaso_instance.uuid` of `Journey.instance_id` (admission). Fallback when it is null: `md5(entity_uuid ‖ nutrition_programme ‖ start_date)` |
| `beneficiary_key`, `etl_created_at` | | from the beneficiary |
| `nutrition_programme`, `programme_type`, `physiology_status` | text | ETL |
| `admission_type`, `admission_criteria` | text | ETL |
| `admission_muac`, `admission_whz` | text | `wfp_journey.muac_size`, `whz_score` |
| `start_date`, `end_date` | date | ETL |
| `exit_type` | text | ETL (`cured`, `defaulter`, `age_limit`, …). `NULL` = still active |
| `duration`, `initial_weight`, `discharge_weight`, `weight_gain`, `weight_loss` | float | ETL |

**`wfp_export_visit`**

| Column | Type | Source |
|---|---|---|
| `visit_key` | text | `iaso_instance.uuid` of `Visit.instance_id` (anthropometric submission) |
| `journey_key`, `beneficiary_key`, `etl_created_at` | | |
| `visit_number` | int | `wfp_visit.number` |
| `visit_date` | date | `wfp_visit.date`, the **actual visit date** (form `visit_date` for Bangladesh) |
| `sync_date` | timestamptz | `iaso_instance.created_at`, the **data synchronisation date** (first reception on the server) |
| `last_sync_date` | timestamptz | `iaso_instance.updated_at` (last server-side change) |
| `device_created_at` | timestamptz | `iaso_instance.source_created_at` |
| `form_id` | text | `iaso_form.form_id` |
| `org_unit_id`, `org_unit_name` | int, text | Visit org unit (the INF, see Q3) |
| `org_unit_parent_name` | text | Parent org unit (camp/union, see Q3) |
| `muac_size` | numeric | `wfp_visit.muac_size`, cast to a number |
| `whz_color` | text | `wfp_visit.whz_color` |
| `oedema` | int | `wfp_visit.oedema` |
| `nutritional_status` | text | Derived from the programme type: U5 → `Green` if MUAC ≥ 12.5 cm and no oedema, `Yellow` if 11.5 ≤ MUAC < 12.5, `Red` otherwise. PLW → `Green` if MUAC ≥ 23 cm, `Red` otherwise. Thresholds to be confirmed against the guidelines (Q4) |
| `age_months_at_visit` | int | Whole months between `birth_date` and `visit_date` |
| `reporting_cycle` | char(7) | `YYYY-MM` of the cycle the visit belongs to (section 6) |
| `synced_before_cutoff` | bool | `sync_date` ≤ cut-off of `reporting_cycle` |
| `entry_point` | text | ETL |
| `fields` | jsonb | `wfp_visit_fields.fields` |

**`wfp_export_step`**

| Column | Type | Source |
|---|---|---|
| `visit_key`, `beneficiary_key`, `etl_created_at` | | |
| `instance_uuid` | text | Assistance submission |
| `assistance_type`, `quantity_given`, `ration_size` | | ETL |

Steps do not need their own stable key: consumers always replace a whole beneficiary, never a single step.

**`wfp_export_deleted_beneficiary`**: `beneficiary_key` (= `entity_uuid`), `account_id`, `entity_type_code`, `reason`, `deleted_at` (= `created_at`).

---

## 6. Reporting cycle and cut-off

Parameters are stored per account, for example in a small `wfp_export_settings` row or in the account's feature settings:

- `cycle_end_day` = 25
- `timezone` = `Asia/Dhaka` for Bangladesh

Derivation:

```sql
-- the cycle a visit belongs to
reporting_cycle = to_char(
    CASE WHEN extract(day FROM visit_date) > :cycle_end_day
         THEN date_trunc('month', visit_date) + interval '1 month'
         ELSE date_trunc('month', visit_date) END,
    'YYYY-MM')

-- cycle bounds for cycle 'YYYY-MM'
cycle_start = (first day of YYYY-MM - 1 month) + (:cycle_end_day) days   -- 26th of previous month
cycle_end   = first day of YYYY-MM + (:cycle_end_day - 1) days             -- 25th of current month
sync_cutoff = (cycle_end + 1 day) at 00:00 in :timezone                    -- end of the 25th, local time
```

Example: cycle `2026-10` = visits from 2026-09-26 to 2026-10-25, synchronised before 2026-10-26 00:00 Asia/Dhaka.

The view exposes `reporting_cycle` and `synced_before_cutoff` for convenience, but consumers can always recompute them from `visit_date` and `sync_date`. Both raw dates are exported.

Note: a visit synchronised **after** the cut-off keeps its `reporting_cycle` (the cycle of the visit date) with `synced_before_cutoff = false`. It is **not** moved to the next cycle (see Q5).

---

## 7. Eligibility rules → reference query

The rules in the ticket can be computed from the export views. We provide them as a **reference view** that is versioned with the code. Partners can run the same query in Athena on the exported data, and CODA can use it if an in-app download is added (section 9).

| Ticket rule | Implementation |
|---|---|
| Visit between 26th of previous month and 25th | `v.reporting_cycle = :cycle` |
| Synced by the 25th | `v.synced_before_cutoff` |
| Actual visit date drives the cycle | `v.visit_date` (form `visit_date` for Bangladesh) |
| Include new admissions and follow-ups | All visits of the journey are considered, whatever their `visit_number` |
| Latest valid visit within the cycle | `ROW_NUMBER() OVER (PARTITION BY beneficiary_key, nutrition_programme, reporting_cycle ORDER BY visit_date DESC, sync_date DESC) = 1` |
| One row per beneficiary × programme × cycle | Same window, `rn = 1` |
| Children 24–35 months: Green only | `programme_type='U5'` → `age_months_at_visit BETWEEN 24 AND 35 AND nutritional_status='Green'` |
| PBWG: Green only | `programme_type='PLW'` → `nutritional_status='Green'` |
| Exclude beneficiaries who met exit criteria | The journey of the selected visit has no exit **before** that visit: `j.exit_type IS NULL OR j.end_date > v.visit_date`. Whether the exit visit itself is included is open question Q6 |

```sql
CREATE VIEW wfp_export_eligible_bsfp_nsep AS
WITH ranked AS (
    SELECT
        v.*, j.nutrition_programme, j.programme_type, j.physiology_status,
        j.exit_type, j.end_date,
        ROW_NUMBER() OVER (
            PARTITION BY v.beneficiary_key, j.nutrition_programme, v.reporting_cycle
            ORDER BY v.visit_date DESC, v.sync_date DESC
        ) AS rn
    FROM wfp_export_visit v
    JOIN wfp_export_journey j ON j.journey_key = v.journey_key
    WHERE v.synced_before_cutoff
      AND j.nutrition_programme IN ('BSFP', 'NSEP')
)
SELECT
    r.account_id, r.reporting_cycle, r.nutrition_programme, r.programme_type,
    b.fields->>'progress_id'         AS progress_id,
    b.entity_id                      AS case_id,
    b.fields->>'fcn'                 AS fcn,
    b.birth_date                     AS date_of_birth,
    r.age_months_at_visit            AS age_months,
    b.gender                         AS sex,
    r.visit_date                     AS actual_visit_date,
    r.sync_date                      AS data_synchronisation_date,
    r.nutritional_status,
    r.org_unit_name                  AS inf_name,
    COALESCE(b.fields->>'camp', r.org_unit_parent_name) AS location_camp,
    r.physiology_status,
    r.fields->>'child_birth_date'    AS child_birth_date,
    r.fields->>'edd'                 AS expected_delivery_date
FROM ranked r
JOIN wfp_export_beneficiary b ON b.beneficiary_key = r.beneficiary_key
WHERE r.rn = 1
  AND r.nutritional_status = 'Green'
  AND (r.exit_type IS NULL OR r.end_date > r.visit_date)
  AND (r.programme_type = 'PLW' OR r.age_months_at_visit BETWEEN 24 AND 35);
```

On the consumer side, the same query runs on the tables rebuilt from the exports (section 8.3).

The view hard-codes the Bangladesh aliases (`progress_id`, `fcn`, `camp`, `edd`, `child_birth_date`). Each country gets its own view, or the view reads `fields` generically. This is acceptable because the aliases are part of each country's configuration contract.

### 7.1 Field mapping for the ticket

**NSEP – children 24–35 months**

| # | Field | Source |
|---|---|---|
| 1 | Progress ID | `beneficiary.fields.progress_id` (reference form) |
| 2 | Case ID | `beneficiary.entity_id` or `beneficiary_key` (Q1) |
| 3 | FCN | `beneficiary.fields.fcn` (reference form) |
| 4 | Date of birth | `beneficiary.birth_date` |
| 5 | Age | `visit.age_months_at_visit` |
| 6 | Sex | `beneficiary.gender` |
| 7 | Actual visit date | `visit.visit_date` |
| 8 | Data synchronisation date | `visit.sync_date` |
| 9 | Nutritional status | `visit.nutritional_status` |
| 10 | Name of INF | `visit.org_unit_name` (Q3) |
| 11 | Location/Camp | `beneficiary.fields.camp` or `visit.org_unit_parent_name` (Q3) |

**NSEP – PBWG**: same as above, minus date of birth and sex, plus:

| # | Field | Source |
|---|---|---|
| 10 | Child birth date (breastfeeding) | `visit.fields.child_birth_date` (configurable) |
| 11 | EDD (pregnant) | `visit.fields.edd` (configurable) |
| – | Physiology status | `journey.physiology_status`, needed to know whether 10 or 11 applies |

The ticket requires that fields can be added later. This is covered by `export_config`, with no code change (followed by a full ETL run, section 4.3).

---

## 8. Incremental write and export

### 8.1 Write path (in the ETL)

Changes to the ETL run for each entity type (`etl_bangladesh`, …):

1. **Batch timestamp.** In `_save_all`, set `created_at = batch_ts` on every `Beneficiary`, `Journey`, `Visit` and `Step` of the batch.
2. **Configured fields.** While it builds beneficiaries and visits, the ETL also builds `wfp_beneficiary_fields` and `wfp_visit_fields` from `export_config`:
   - beneficiary fields from the reference instance (`Entity.attributes`). The ETL loads it if it is not already among the retrieved submissions;
   - visit fields from the submissions of the visit group, which the ETL already has in memory.

   These rows are saved in the same transaction as the ETL rows. A beneficiary and its fields therefore always appear together.
3. **Deletion log.** For the entities being processed, insert a row into `wfp_deleted_beneficiary` when the source says the beneficiary no longer exists:
   - `iaso_entity.deleted_at IS NOT NULL` → `entity_deleted`;
   - the entity was merged into another one (`merged_to`, to verify against the merge implementation) → `entity_merged`;
   - optionally, the entity still exists but no longer produces a beneficiary (for example all its anthropometric submissions were deleted) → `no_longer_produced`.

   Deletions must be decided from the **source data**, not from "no `Beneficiary` row after the run". A batch whose save fails (`_save_all` catches the error) also leaves no row, and that is not a deletion.
4. If an entity is restored later, the ETL recreates its beneficiary with a newer `created_at`. Consumers resolve this by timestamp (section 8.3). No clean-up of the log is needed.

### 8.2 Export to S3 via Athena

- Athena reads PostgreSQL through the **Athena PostgreSQL federated connector** (Lambda). It uses a **dedicated read-only DB role** that can only `SELECT` from the `wfp_export_*` views (and the tables underneath them through the views).
- For each account, the export job stores a watermark `wm_prev`. Each run:
  1. sets `wm_new = now() - safety_margin`. `batch_ts` is taken in Python before the transaction commits, so a batch can become visible slightly after its timestamp. The margin (for example 15 minutes) must be longer than the duration of a single ETL batch transaction.
  2. exports, for the window `(wm_prev, wm_new]`:
     - every view (`beneficiary`, `journey`, `visit`, `step`), filtered on `etl_created_at`:
       ```sql
       UNLOAD (
         SELECT <columns>, <fields flattened per export_config>
         FROM wfp_export_visit
         WHERE account_id = :account AND etl_created_at > :wm_prev AND etl_created_at <= :wm_new
       ) TO 's3://<bucket>/<account>/visit/export_date=YYYY-MM-DD/run=<run_id>/'
       WITH (format = 'PARQUET', compression = 'SNAPPY')
       ```
     - `wfp_export_deleted_beneficiary`, filtered on `deleted_at`;
  3. if all the exports succeed, saves `wm_new` as the new watermark.
- The `fields` jsonb column is **flattened into one column per alias** at export time, using `export_config` and casting to the declared `type`.
- The **PII policy is applied during flattening** (section 4.4). Aliases whose sources are flagged `remove` are not emitted. Aliases flagged `pseudonymise` are emitted as an HMAC, with the column renamed `<alias>_hash` so the treatment is explicit for consumers. The export run records which aliases were removed or pseudonymised, together with the version of the PII configuration used.
- When a form's `pii_fields` change, the next export must be a **full snapshot**. Otherwise data already shared under the old policy would stay as it is on the consumer side. When a field becomes PII, the consumer must also be told to purge the old clear values (see Q14).
- **Full snapshot** on demand: `wm_prev = -infinity`. Use it for the initial load or for reconciliation. Snapshots go to a separate `snapshot=` prefix.

### 8.3 Consumer contract

The unit is the **beneficiary** (`beneficiary_key`):

1. For each `beneficiary_key` in the export run, keep only the most recent event: the beneficiary's `etl_created_at` or the deletion's `deleted_at`.
2. If the most recent event is a **beneficiary**: delete everything held for that key in the four tables, then insert the exported beneficiary, journeys, visits and steps.
3. If the most recent event is a **deletion**: delete everything held for that key.
4. Ignore an event that is older than what the consumer already holds for that key. This makes reprocessing a run, or overlapping windows, harmless (idempotent).

With Iceberg tables on the consumer side, steps 2 and 3 are a `DELETE … WHERE beneficiary_key IN (…)` followed by an `INSERT`, in one transaction per run.

### 8.4 Known limits

- **More data is exported than strictly changed.** One new visit re-exports that beneficiary's whole history. The ETL watermark has day granularity, so the same entities can be reprocessed and re-exported several times a day. With replace-by-beneficiary this is harmless; it only costs volume.
- **An `all_data` ETL run re-exports everything.** This is how a configuration change reaches consumers.
- **Failed batches.** If `_save_all` fails for a batch, its beneficiaries have already been deleted from the ETL tables (existing behaviour). They are simply absent from that export, and consumers keep the previous version until a later successful run recreates them.
- **The safety margin** must stay longer than the longest ETL batch transaction. Check this on the largest country.

### 8.5 Scheduling

| Step | When |
|---|---|
| Country ETL (with `created_at`, fields, deletion log) | Existing Celery schedule (unchanged) |
| Athena export | Daily, plus on demand. Optionally an extra run just after the 25th cut-off (for example on the 26th at 06:00 local time) so lists can be built from complete data |

### 8.6 Alternative considered

A separate "publish" layer: physical export tables with stable keys, upserts, `updated_at` set only when a content hash changes, and per-row tombstones. It exports only rows that really changed, but it duplicates all the data and adds hashing and tombstone logic on every table. It was rejected in favour of the simpler `created_at` + replace-by-beneficiary approach. We can revisit it if export volumes become a problem.

---

## 9. Producing the list in CODA (ticket functional requirements)

The ticket asks that an authorised Country Office user can **select a programme and cycle in CODA and download Excel/CSV**. Two options:

- **A. Partner side only.** WFP/Transfer Management run the reference query in Athena (or their BI tool) on the S3 data. This is the least work in IASO, but it does not literally meet "select in CODA and download".
- **B. Also in CODA (recommended as phase 2).** Add a small screen in the WFP plugin: choose programme + cycle → download CSV/XLSX. It runs the same reference view directly on the `wfp_export_*` views, so the in-app download and the partner exports always use the same logic. It is protected by a new permission, `iaso_wfp_beneficiary_export`, which covers the RBAC requirement. Because data does not leave CODA's access control here, this download can include PII fields in clear, such as the Progress ID and FCN that Transfer Management needs (see Q13).

In both cases the business rules live in **one place**: the reference view, which is versioned in the repo and covered by tests.

---

## 10. Security and data protection

- `wfp_beneficiary_fields`, `wfp_visit_fields` and the `wfp_export_*` views contain **personal data** (names, IDs such as Progress ID/FCN, dates of birth). They must:
  - never be readable by the dashboard DB roles (Tableau/Superset keep using the anonymised ETL tables, which gain only a `created_at` column),
  - be readable only by the export connector role, and by the in-app download if option B is chosen,
  - only contain the fields listed in `export_config`. The default is an empty config, so nothing identifiable is exported unless someone configures it.
- **Partner exports apply the form-level PII policy** (`Form.pii_fields`, section 4.4). PII questions are removed or pseudonymised, whichever form they come from. Clear values stay inside CODA.
- The pseudonymisation secret is per account, stored in the secrets manager, and never exported. Rotating it changes every hash, so a rotation requires a full snapshot.
- S3 bucket: SSE-KMS encryption, access limited to named WFP/partner IAM principals, access logging enabled, lifecycle/retention policy agreed with WFP.
- A data-sharing agreement must be in place before identifiable data leaves CODA (owner: WFP CO + Bluesquare).

---

## 11. Implementation plan

| Phase | Content | Notes |
|---|---|---|
| 1 | `EntityType.export_config` (migration, JSON schema validation, API, entity type form field with question picker) | Core IASO, generic |
| 1b | `Form.pii_fields` (migration, API, question picker on the form detail page, warning on form version upload when a flagged question disappears) | Core IASO, generic. Reusable later by other IASO exports |
| 2 | ETL changes: `created_at` on the four ETL tables (`batch_ts`), `wfp_beneficiary_fields`, `wfp_visit_fields`, `wfp_deleted_beneficiary`, field extraction from `export_config`, deletion detection | Tests: all rows of a beneficiary share `created_at`; fields extracted with fallback sources; deleted/merged entity → log row; failed batch → no log row |
| 3 | `wfp_export_*` views (natural keys, sync dates, `reporting_cycle`, `nutritional_status`, age) + reference view `wfp_export_eligible_bsfp_nsep` | Tests with fixtures on cycle boundaries (25th/26th, end of February, timezone) |
| 4 | Athena connector + read-only role + UNLOAD job + watermarks + PII treatment during flattening + S3 bucket (infra) | Infra/DevOps. Provide a reference consumer script implementing section 8.3. Tests: a `remove` field never appears in the output; a `pseudonymise` field gives the same hash across runs |
| 5 (opt.) | In-CODA download screen (programme + cycle → CSV/XLSX) + permission | Option B |

Bangladesh pilot: flag PII questions on all Bangladesh forms (reference, visit, assistance and medical forms), configure `export_config` for `bangladesh_under5` and `bangladesh_pbwg`, and run a full ETL. Then **reconcile** the counts from the view against the dashboard figures and a list produced manually by the CO for one past cycle.

---

## 12. Open questions

| # | Question | Proposed default |
|---|---|---|
| Q1 | What is the "CODA Case ID": `iaso_entity.id` (integer) or `iaso_entity.uuid`? | Export both. The `uuid` is the technical key |
| Q2 | Are Progress ID and FCN in the reference form for all Bangladesh entity types? What are the exact field names? | To check against the form definitions |
| Q3 | Is "Name of INF" the visit org unit? Is "Location/Camp" a parent org unit or a reference form field? | INF = visit org unit; camp = parent org unit, overridable through `export_config` |
| Q4 | Exact "Green" thresholds: U5 MUAC ≥ 12.5 cm without oedema; PBWG MUAC ≥ 23 cm (or > 23)? | As stated, to be validated by the WFP nutrition team |
| Q5 | Visit synced after the cut-off: exclude it from its cycle (current proposal), or count it in the next cycle? | Exclude from its cycle and flag it. No carry-over |
| Q6 | Exit visit within the cycle: is the beneficiary on that cycle's list (they may have received a ration at that visit) or not? | Exclude only when the exit is **before** the latest visit in the cycle. To confirm |
| Q7 | Age for the 24–35 months rule: at the visit date or at the cycle end? | At the actual visit date |
| Q8 | Is `sync_date` the first reception (`created_at`) or the last change (`updated_at`) when a visit is edited after the cut-off? | `created_at` for the cut-off. `updated_at` is also exported |
| Q9 | "Unless explicitly required by the programme configuration" (duplicates): is there a known case? | No duplicates in v1 |
| Q10 | Is the actual visit date (form `visit_date`) also needed for other countries, which currently use `source_created_at`? | Bangladesh only for now |
| Q11 | Bucket ownership (Bluesquare vs WFP AWS account), retention, export frequency | To agree with WFP |
| Q12 | How are entity merges implemented (soft delete of the merged entity, `merged_to`)? Are they visible to the ETL's change detection? | To verify in phase 2 |
| Q13 | Transfer Management needs Progress ID and FCN **in clear** to distribute assistance. Are they PII to remove or pseudonymise in the partner export? If so, does Transfer Management get the list through the in-app download (option B) instead of the bucket, or do we need several export profiles (WFP internal vs external partners) with different PII treatments? | One partner export with PII treated. Transfer Management uses the in-app download, which makes option B necessary |
| Q14 | When a question becomes PII after it has already been shared in clear: who purges the old values on the consumer side? Is this written into the data-sharing agreement? | The full snapshot replaces the data, and the agreement requires the consumer to apply it |
| Q15 | The ETL derives some core columns from form questions (for example `birth_date` from date-of-birth or age questions). Does the PII policy of those source questions also apply to the derived columns (e.g. export only year/month of birth or age in months)? | Export `birth_date` as is in v1, to confirm with WFP data protection |
