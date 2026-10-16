# Entity workflow scenario tests — design proposal

Status: proposal, nothing implemented. Date: 2026-10-08.

## TL;DR

- **Users are implementers, not developers** (XLSForm is already hard for some). The UI never shows JSON, JsonLogic,
  XPath, question codes or `__int__` suffixes: scenarios are **recorded by filling the forms**, checks are **ticked
  from what happened**, failures are **explained in sentences**. Technical details exist, collapsed, for support.
- **JSON only as an import/export file** (not YAML: its implicit typing turns `yes` into a boolean, §3), to copy scenarios to another server or account (e.g. staging → prod,
  one country account → another). On import, a matching screen links what the file refers to (forms, org units,
  roles, entity type) to what exists on the target.
- Users write **scenarios**: "register with these answers → I'm offered forms X, Y → fill X with these answers → the
  profile (entity attributes) now has these values". Scenarios are grouped in **suites**, attached to an entity type,
  and run against a workflow version (published, or a **draft before publishing**) and the forms' versions (current, or
  a **candidate XLSForm before uploading it**).
- Runs are **pure dry-runs**: nothing is written to `Entity` / `Instance`. Only the run and its trace are stored.
- **Two layers.** IASO (Python) runs the scenarios: it sequences the steps, keeps the state and the trace, checks the
  expectations, and handles sync steps against the real server code — reusable later for web entry (§6b).
  **`odk_cli`** (our JavaRosa fork, same JavaRosa commit as the phone) is called for stateless operations: fill or
  edit a submission, recompute, validate (its `InstanceEditor` already does the edit half). It never launches the
  test suite. **Open**: whether the phone's workflow logic (followups, typing, prefill, copy rules, card format) is
  re-written in Python or copied from the app's Kotlin into `odk_cli` as more stateless commands (§4.1, recommended).
- The web part is for **authoring and debugging**, not judging: a recorder using `@getodk/web-forms` (already bundled
  as `iaso/static/odk-preview/`, used by Form AI) instead of Enketo, plus IASO-rendered org unit / entity pickers in
  place of the `ex:…pick_ou` / `pick_entity` intents.
- The failure view shows **why**: expected vs actual, the dependency chain (profile field ← mapping ← followup question
  ← calculate ← answers in step N / prefill / org unit injection), the followup conditions with the values they read,
  and the full profile and instances at every step.
- AI is optional and comes last. Most of "generate a suite from hand-filled data" is deterministic (replay a real
  entity's history); the LLM names, prunes assertions, proposes branch-covering variants and fixes after a form
  update.

## 1. What exists today (findings)

**Server (this repo)**

- Workflow config: `Workflow` 1–1 `EntityType`, `WorkflowVersion` (DRAFT/UNPUBLISHED/PUBLISHED),
  `WorkflowFollowup` (`order`, JsonLogic `condition`, `forms`), `WorkflowChange` (`form`, `mapping`
  `{followup_question: profile_question}`) — `iaso/models/workflow.py`. Note the comment at `:171` describes the
  mapping the wrong way round; the validator `iaso/api/workflows/serializers.py:99-132` is right.
- `Entity.attributes` is a 1–1 to the current reference-form `Instance`; repointed in `import_data`
  (`iaso/api/instances/views.py:1244`).
- **The server never evaluates followup conditions and never applies mappings.** `iaso/utils/jsonlogic.py` only
  translates JsonLogic to `Q`. There is no XForm engine server-side (pyxform only builds descriptors).
- Enketo (`iaso/api/enketo.py`) renders externally; `enketo/create/` doesn't link an entity; it can't run IASO intents.
- `@getodk/web-forms` is bundled (`docker/odk-preview/src/App.vue`, `postMessage` `load-form-xml` / `odk-submit`).
- Form AI already uses `anthropic` + `pydantic` with a per-account API key (`iaso/api/form_ai/agent.py`).

**Mobile (`iaso-mobile-app`)** — behaviour to reproduce

- Followups: `GetFollowUpForms.kt:25-34`, `json-logic-java:1.1.0`, no custom operator. Variables = the profile's
  answers keyed by **leaf name**, **typed**: dates → epoch ms, time → seconds of the day, ints/decimals, select_multiple
  → list, calculates typed by a `__int__` / `__decimal__` / `__bool__` / `__date__`… suffix, otherwise strings; plus
  `current_date`, `current_time`, `current_datetime`. **Followups are not sorted by `order` on the device** (list order).
- Prefill of a followup form: every profile answer, matched on the first element with that leaf name, falling back to
  `_name` (`FormController.answerQuestion`). Org unit: `current_ou_*` / `parent{i}_ou_*` × `id, name, type_id,
  type_name, is_root`, exact names.
- Changes: `UpdateEntity.kt:155-165` — string copy source → target, re-typed, then the profile's calculates are
  recomputed (`triggerTriggerables`) and the same reference instance is re-uploaded. Quirk: a null source empties the
  DB row but not the XML.
- Intents: `iaso.action.pick_ou(map, limit_root, ou_type, filter_out_ou_types, allow_ou_creation, …)` returns `id,
  name, parentId, latitude, longitude, accuracy, orgUnitTypeId, path`; `pick_entity(map, entity_type, org_unit_id)`
  returns `id, name, entityTypeId, entityTypeName`; each renamable with `map`.
- Duplicate search (`fields_duplicate_search`, `prevent_add_if_duplicate_found`) and list filters (`predefined_filters`).

**`odk_cli`**

- `EntityWorkflowValidator.kt` (YAML: `workflow`, `forms`, `form_attachments`, `profile`, `steps[next_forms, form,
  answers, checks]`) — the idea, already working on a real nutrition workflow (`src/test/resources/test.yaml`). Gaps:
  values all strings (JsonLogic untyped, unlike the device), XML flattened by leaf name (repeats collapse), no profile
  recompute after changes, stops at first error, no trace.
- `InstanceEditor.kt` — the better engine core: path keys with repeat indexes, every error in form order with codes
  (`REQUIRED`, `CONSTRAINT`, `NOT_RELEVANT`, `UNKNOWN_QUESTION`, `UNKNOWN_CHOICE`, …), form's own constraint messages.
- Distributed as a GraalVM native binary that IASO images download.

## 2. Goals and non-goals

Goals

1. Business users (implementers, not devs) describe expected behaviour of an entity workflow in their vocabulary
   (form names, question labels, org units, user roles) — **without writing anything that looks like code**.
2. Scenarios are portable: export a file, import it on another server/account, map what differs.
3. Same verdict as the phone. Configuration is brittle precisely because of mobile-side logic; a test that disagrees
   with the phone is worse than no test.
4. Fast: a scenario in < 1 s, a suite in seconds, so it's run on every config change.
5. Debuggable: on failure, everything needed to understand it on one screen.
6. Safe: no records created, runnable on production configs.
7. Regression gates: run on workflow-version publish and on form-version upload, and say *what to fix* ("question
   `muac_unit` is now required in step 2").

Non-goals (for now)

- Testing the Android UI itself, sync, NFC cards, or offline storage.
- Submission validation workflows (`ValidationWorkflow`) — separate feature; can be added as a step type later.
- Reproducing every device quirk bit-for-bit on day one: we list them (§4.4) and decide one by one.

## 3. Concepts and scenario format

```
Suite ──< Scenario ──< Step
  │         │            ├─ kind: register | fill | expect | use | set_context
  │         │            ├─ description (optional, plain words: "back 2 weeks later with swelling")
  │         │            ├─ context override (project / user / role / org unit / date)
  │         │            ├─ answers, picker results
  │         │            └─ expectations
  │         └─ context, uses: [shared blocks]
  └─ entity_type, default context, workflow version target, shared blocks (reusable step groups)
```

Words shown to users by default (the technical terms come back with the "Show technical names" switch, §5, and in the export file):

| technical                         | in the UI                                                              |
|-----------------------------------|------------------------------------------------------------------------|
| suite                             | scenario group (per entity type: "Scenarios for Child")                |
| scenario                          | scenario — a beneficiary's journey, named in a sentence                |
| step `register` / `fill`          | "Register a child" / "Fill Anthropometry"                              |
| profile / `Entity.attributes`     | "<entity type> information" (e.g. "Child information", "Household information") — entities are generic, so never "the child's file"; same wording as the existing "Entity information" panel of the entity details page |
| followups                         | "forms offered next"                                                   |
| `WorkflowChange` mapping          | "copy rules" (already the wording to align with the workflow screens)  |
| assertion / expectation           | "check"                                                                |
| `refused` (REQUIRED, CONSTRAINT)  | "this step should be refused" + the form's own message                 |
| block                             | "shared beginning" (e.g. "Register an 11-month-old child")             |
| context                           | "filling as [Nurse] in [Nutrition app] at [CS Kalemie] on [2 weeks after the previous step]" |
| question name, `__int__` suffix   | the question **label** in the user's language; type handled silently   |
| JsonLogic condition               | the human-readable sentence already produced by `useHumanReadableJsonLogicForForm` |

### File format: JSON (decided 2026-10-08)

Stored and exchanged as **JSON**, validated by a **Pydantic** model. Nobody has to type it: the UI writes it (recorder,
check picker, forms). The JSON is the **import/export format** — to copy scenarios to another server or account, to
review in a pull request or a ticket, and for power users who duplicate and adapt scenarios in an editor. It
references things by **stable, human-meaningful keys** (form `form_id`, question name, org unit name + type + source
ref, role name, entity type code), never by database ids, so it can be imported elsewhere (§4.9).

Why JSON and not YAML (YAML was the first idea):

- **YAML's implicit typing fights IASO's data.** Answers are text, but YAML 1.1 (PyYAML) reads `yes`/`no`/`on`/`off`
  as booleans — and select choices are literally `yes`/`no` —, `11` and `12.0` as numbers, `012` possibly as octal,
  `2026-10-22T08:30` as a datetime, `08:30` as a base-60 number. Each one is a scenario failing for a reason that has
  nothing to do with the workflow. In JSON `"yes"` stays `"yes"` and `"12.0"` stays `"12.0"`.
- **Native everywhere it is used**: `JSON.parse` in the browser (paste in an import dialog, download/upload, no extra
  library), `json` in Python, JSONField in Postgres.
- **One format with what surrounds it**: the workflow export (`GET /api/workflows/export/<id>/`), the form descriptors
  and `WorkflowFollowup.condition` are JSON; a bundle stays one format.
- **Schema for free**: `Scenario.model_json_schema()` from the Pydantic model, published at a stable URL and
  referenced by `"$schema"` in every file → autocompletion and inline errors in VS Code today, Monaco in the browser
  later. The same schema validates imports and constrains the AI's structured output (§6).

What we lose and how it is compensated:

- **no comments** → `description` fields on the scenario and on each step (also shown in the UI);
- **noisier to write by hand** → power users mostly duplicate and adapt (the UI's "duplicate" and "copy as a new
  scenario from step N"), and the schema makes hand edits safe;
- the import may also accept YAML as a convenience (a superset of JSON), but exports are always JSON.

Rules of the format:

- `"format": "iaso-scenarios/1"` — a version, so later changes can be migrated on import;
- `"$schema"` — the schema URL, for editors;
- **answers are always strings**, as in a submission (`"11"`, `"12.0"`, `"yes"`); expected values too, unless a
  matcher is used (`{"approx": 12.0}`);
- one file = one bundle: the scenario group, plus the shared beginnings it uses (also from other groups), next to the
  workflow export and the forms it relies on.

```json
{
  "$schema": "https://<iaso server>/api/scenarios/schema/v1.json",
  "format": "iaso-scenarios/1",
  "kind": "entity",
  "suite": "Nutrition – TSFP admissions",
  "entity_type": "child",
  "context": {
    "project": "nutrition-app",
    "user": {"role": "nurse"},
    "org_unit": {"name": "CS Kalemie", "type": "health_facility"},
    "date": "run_day"
  },
  "blocks": {
    "register_child": {
      "description": "Register an 11-month-old child",
      "params": {"age_months": "11"},
      "steps": [
        {
          "register": "child_registration",
          "answers": {
            "consent_one": "yes",
            "first_name": "Luke",
            "last_name": "Skywalker",
            "gender": "M",
            "age_entry": "months",
            "age_months": "{{ age_months }}"
          },
          "pick_ou": {"name": "CS Kalemie"},
          "expect": {
            "attributes": {"first_name": "Luke", "org_unit_id": "{{ ctx.org_unit.id }}"},
            "next_forms": ["anthropometry"]
          }
        }
      ]
    }
  },
  "scenarios": [
    {
      "name": "MUAC yellow → TSFP, cured after 2 green visits",
      "steps": [
        {"use": "register_child", "with": {"age_months": "11"}},
        {
          "fill": "anthropometry",
          "description": "First follow-up 2 weeks later, MUAC yellow, no oedema",
          "date": {"after_previous": "14d"},
          "answers": {"muac": "12.0", "height_cm": "81", "weight_kgs": "10.0", "child_oedema__int__": "0"},
          "expect": {
            "attributes": {
              "program": "TSFP",
              "previous_muac__decimal__": {"approx": 12.0},
              "followup_visits__int__": "-1"
            },
            "next_forms": {"contains": ["medical_visit"], "not_contains": ["discharge"]}
          }
        },
        {
          "fill": "medical_visit",
          "description": "Seen by the clinician the same day",
          "as": {"user": {"role": "clinician"}, "project": "nutrition-app"},
          "answers": {"medical_temperature": "36.0", "have_complications": "0"},
          "expect": {"attributes": {"medical_visit_done__int__": "1"}}
        }
      ]
    },
    {
      "name": "Refuses negative MUAC",
      "steps": [
        {"use": "register_child"},
        {
          "fill": "anthropometry",
          "description": "Nurse types a negative MUAC by mistake",
          "answers": {"muac": "-1"},
          "expect": {"refused": [{"path": "muac", "code": "CONSTRAINT"}]}
        }
      ]
    }
  ]
}
```

Notes on the example: `context` is the default for every step (`project` is the app_id: forms available, workflow,
org unit tree); `user.role` gives a synthetic user, a username a real one; `date` is the scenario clock (see
"Dates"); `blocks` are shared beginnings, reusable with parameters, also from another group
(`"use": "other-suite/register_child"`); `pick_ou` is what the `pick_ou` intent would return; `as` switches
project/role/org unit for one step.

### Two kinds of scenarios: entity and form (decided 2026-10-08)

The same file format has two kinds, sharing their parts (steps' `answers` / `context` / `description`, the
`submission` and `refused` checks, the form engine):

- **`"kind": "entity"`** — the workflow: register, forms offered next, prefill, copy rules, profile (`attributes`) —
  and each form's own logic with the shared checks.
- **`"kind": "form"`** — **one form's logic, no entity, no workflow**: each step is an independent fill of the
  form; checks what the form computes (`submission`, calculates included) or that it refuses the answers
  (`refused`: REQUIRED, CONSTRAINT, UNKNOWN_CHOICE, INVALID, NOT_RELEVANT, READ_ONLY). Usable for **any IASO form**,
  not only entity ones: XLSForm unit tests, replayed before publishing a new form version (§4.8), shared engine
  with submission editing.

```json
{
  "$schema": "./scenario.schema.json",
  "format": "iaso-scenarios/1",
  "kind": "form",
  "name": "Child registration form",
  "form": "child_registration",
  "steps": [
    {"description": "A valid registration", "answers": {"first_name": "Luke", "age_months": "11"},
     "expect": {"submission": {"age_months": "11", "visits__int__": "0"}}},
    {"description": "120 months is refused", "answers": {"first_name": "Leia", "age_months": "120"},
     "expect": {"refused": [{"question": "age_months", "code": "CONSTRAINT"}]}}
  ]
}
```

Code (POC, branch `poc/scenario-tester`): `iaso/scenarios/schema.py` (both kinds, `load_scenario`, `json_schema`),
`forms.py` (`FormSource`, `fill_and_check`, `FormScenarioRunner`), `entities.py` (`EntityScenarioRunner`, built on
`forms.py` + `runtime.py`), `form_engine.py` (odk_cli). In the UI, form scenarios belong on the form's page (a
"Scenarios" tab next to versions), entity scenarios on the entity type / workflow page.

Step kinds

| kind          | does                                                                                          |
|---------------|-----------------------------------------------------------------------------------------------|
| `register`    | fills the reference form (or a form creating the entity) → new profile                        |
| `fill`        | asserts the form is offered (unless `force: true`), prefills from profile + context, fills it, applies the changes, recomputes the profile |
| `expect`      | assertions only (current state)                                                               |
| `use`         | inlines a block (same suite or `suite-slug/block`), with params                               |
| `set_context` | changes context for the following steps (a different nurse at another facility, a later date) |
| `sync`, `write_card`, `read_card`, `erase_card`, `lose_card` | phones, synchronisation and NFC cards — see "Phones, synchronisation and NFC cards" |

Expectations

- `next_forms`: exact list, `contains`, `not_contains`, `empty`.
- `attributes` (profile after the step), `instance` (the step's own submission, path-keyed, repeats included:
  `child[2]/age`), `absent: [field]`.
- Matchers: literal (compared after typing, so `12` = `12.0`), `approx`, `regex`, `one_of`, `date: step+14d` or `date: 2027-03-15`,
  references to earlier values `{{ steps.anthropometry.instance.muac }}`.
- `refused`: expected engine errors (`REQUIRED`, `CONSTRAINT`, `NOT_RELEVANT`, `UNKNOWN_CHOICE`…).
- Later: `duplicates_found` (duplicate search on `fields_duplicate_search`), `list_view` (what
  `fields_list_view` would show), `visible_in_list(filter)` (`predefined_filters`).

Context — what it changes (only things that really change behaviour)

| context    | effect in a run                                                                                               |
|------------|---------------------------------------------------------------------------------------------------------------|
| project    | forms available (`Project.forms`) — a step whose form is not in the project fails with "Anthropometry is not available in Nutrition app"; `app_id`; which workflow / entity types the app sees; feature flags (`MOBILE_ENTITY_*`) |
| org unit   | `current_ou_*` / `parent{i}_ou_*` injection, `org_unit_id` of the submission                                  |
| user/role  | org unit scope (`Profile.org_units` → allowed `pick_ou` answers and visible entities), `username` metadata    |
| date       | the scenario clock (see "Dates"): `current_date`/`current_time`/`current_datetime` for JsonLogic, `today()`/`now()` and `start`/`end` preloads in XForms |

Picker answers are validated against that scope: picking an org unit outside the user's tree, or outside `limit_root`
/ `ou_type` of the intent, fails the step like the phone would forbid it.

### Dates: the scenario clock

Forms and workflows contain date logic of two kinds, and scenarios must be able to test both:

- **relative**: "next visit 14 days after admission", "discharge after 2 visits ≥ 4 weeks apart", age computed from
  the birth date;
- **calendar**: campaigns with a fixed calendar written in the XLSForm or in a followup condition ("round 2 is
  offered from 2027-03-15", `if(today() < date('2027-01-01'), …)`, `current_date` in JsonLogic).

So each step has a **date**, chosen in plain words, and it drives everything the device takes from the clock:
`today()`, `now()`, the `start`/`end` preloads, and `current_date` / `current_time` / `current_datetime` in the
followup conditions.

| how the user sets it                         | stored as                         | use                                                                 |
|----------------------------------------------|-----------------------------------|---------------------------------------------------------------------|
| "Day of the run" (default for step 1)        | `run_day`                         | scenarios that must keep passing whatever the day                   |
| "N days/weeks/months before/after the run"   | `{run: "-30d"}` / `{run: "+2w"}`  | "a child registered last month"                                     |
| "N days/weeks/months after the previous step"| `{after_previous: "14d"}` (default for next steps: same day) | follow-up rhythms                               |
| "On a fixed date" (past or future)           | `{date: "2027-03-15"}`            | campaign calendars; a future date tests a round not yet started    |
| optional time of day                         | `{…, time: "08:30"}`              | time-window logic (`current_time`)                                  |

- The resolved date is always shown next to the choice ("→ 22 Oct 2026") and in the run results.
- **Date answers** (birth date, visit date) use the same choices, so "born 11 months before this step" keeps the
  child 11 months old forever, while "born on 2025-11-01" ages with the run day.
- **Date checks**: *is N days after this step's date*, *is N days after step 2's date*, *is exactly <date>*, *is
  before/after <date>*.
- A scenario mixing a fixed calendar with "day of the run" can expire (the campaign is over). The run result says so
  ("this scenario uses 15 Mar 2027 and the run day: results may change after that date") instead of failing
  mysteriously; a suite can also pin its run day ("run as if today were 1 Mar 2027") to replay a past campaign.
- Engine: the compiler resolves every date to an absolute one before calling `odk_cli`; `odk_cli` sets the clock per
  step (JavaRosa preloads / `today()` and the JsonLogic `current_*` variables) — a stub clock is needed in
  `FormValidator` for that, it does not exist yet.

### Phones, synchronisation and NFC cards

Most brittle field situations involve **more than one phone**: a child registered at the health centre, followed up
by a community worker, card read on another phone, edits made offline on both sides. Scenarios model this with
**phones** and **cards**:

- A **phone** carries the context: user/role, project, org unit, and its own clock (date, optional clock offset to
  test skew). "Filling as [Nurse] in [Nutrition app] at [CS Kalemie]" becomes "On [Phone A — Nurse, Nutrition app,
  CS Kalemie]". A scenario has one phone by default; adding a second one is one click.
- Each phone has its own local copy of the entities and submissions (synced or not); the **server** is a third state.
- A **card** is a named NFC card ("Card 1"), empty, written or blacklisted.

New step kinds:

| step                      | simulates                                                                                                    |
|---------------------------|--------------------------------------------------------------------------------------------------------------|
| `sync` (phone)            | upload the phone's unsynced submissions + download what the server would send it (entities in scope, deleted/merged list, blacklisted cards) |
| `write_card` (phone, card)| write the profile (+ records) after registration, or a record after a follow-up — as the app does it automatically |
| `read_card` (phone, card) | read the card on a phone that does / does not already know the entity                                        |
| `erase_card`, `lose_card` | reset; declare lost/stolen (blacklisted on the server, then on phones after their next sync)                  |

New checks, in words:

- **visibility**: "after sync, Phone B **sees** the child" / "does **not** see it" (outside its area, other project,
  filtered out) — `GET /api/mobile/entities/` scope;
- **who wins**: "the server keeps the MUAC entered on Phone A"; "Phone B's offline edit is **kept** / **lost**" —
  last-writer-wins per submission on the device `updated_at`, no field merge;
- **card**: "the profile fits on the card (430 / 500 bytes)", "records kept on the card: last 3 visits", "these
  values are **not** carried by the card: `_bmi`, notes" (underscore and display fields are stripped), "after reading
  Card 1 on Phone B, Child information has …", "Card 1 is blacklisted";
- **server**: "the child exists once on the server", "submissions are attached to the merged child".

How it runs (still nothing saved):

- **Phone side** (prefill, followups, copy rules, local merge on read, local blacklist, download rules) in the
  **Python runtime**, like the rest of the workflow logic, with per-phone state. The one exception is the **card
  format**: a protobuf built from the form schema, with size limits and FIFO eviction, stripping underscore/display
  fields — re-implementing it would be guesswork, so `odk_cli` gets two more stateless form-level commands,
  `card-encode` (submissions → bytes, size report) and `card-decode` (bytes → answers), built on the app's own
  `QuestionsToBytes` code. Still form engine work, no orchestration.
- **Server side** (`import_data`, `find_entity`, merge redirection, `update_instance_file_if_needed`, the mobile
  entities queryset, storage-log import and blacklisting) runs the **real Django code inside a transaction that is
  always rolled back** (a savepoint per run; the bulk-upload task executed inline). Testing the real server code is
  the point: re-implementing the scope filters would hide exactly the bugs we want to see.
- The runner keeps the per-phone states and the card bytes between steps; `odk_cli` is only called for form
  operations (`new`, `edit`, `card-encode`, `card-decode`).

Known behaviours worth a scenario each (several are today's bugs — a failing scenario documents them until fixed):

| behaviour                                                                                          | where                                    |
|----------------------------------------------------------------------------------------------------|------------------------------------------|
| reading a card of an entity unknown on the phone re-saves profile + records as **new FINISHED submissions without underscore/display fields**, re-uploaded under the original UUIDs; they replace the server XML when the card's date is newer (WC2-973) | mobile `BytesToEntity.createEntity`      |
| a local unsynced edit **older** than the server version is silently replaced on download and marked uploaded (edit lost) | mobile `ImportInstance`                  |
| `limit_date` is a **day** in the phone's time zone compared with server `updated_at`             | mobile `FetchEntities` / server          |
| org-unit scope matches if **any** submission is in the user's area; submissions on non-valid org units or unknown form versions are dropped silently | server `filter_for_mobile_entity`        |
| blacklisting: phone blacklists the previous card on **any** entity-linked operation, server only on WRITE_PROFILE | mobile `StorageDeviceRepository` / server `create_and_update_device` |
| one storage log pointing to an unknown entity/org unit loses **all** logs of that upload (atomic block, 201 anyway) | server `import_storage_logs`             |
| bulk zips processed newest first; storage logs only in the last zip                                | server tasks worker / mobile `SyncBulkUpload` |
| `/sync/form_upload/` overwrites without timestamp check (non-zip mode)                             | server `hat/sync/views.py`               |

Not simulated: radio/NFC hardware, partial writes when the card is pulled away (could be added as "card removed
during write" later), real network failures, async ordering of several zips beyond "process in this order".

Reuse across suites: blocks are addressable as `suite-slug/block`. A suite in another project can reuse a
registration block from the suite owning the entity type. Cycles are refused at save. A block's resolved state can
be cached (§4.5).

## 4. Backend

### 4.1 Pipeline

```
                         IASO (Python)                                              odk_cli (form engine)
 Suite ─► Compiler ─► Runner = entity workflow runtime ──── per form ────► new  : blank form + prefill + context
          │ names→ids   │ for each step:                                   edit : submission + answers
          │ form XMLs   │  1. next_forms(profile)  typed JsonLogic          → recomputed XML, all errors,
          │ OU ancestry │  2. prefill(profile, form, context) ──────────►     relevance, dependency edges
          │ dates       │  3. submit(answers) ──────────────────────────►
          │ blocks      │  4. apply copy rules → profile edit ──────────►   (stateless, no DB, no workflow)
          ▼             │  5. checks → trace
     compiled scenario  ▼
                     Trace ─► ScenarioResult, "why" view
```

- **Compiler** — `iaso/scenarios/compiler.py`. Everything that needs the DB: resolves names to ids, reads XForm
  files and attachments, computes `current_ou_*` like `Bundle.kt` (ancestors, `parent{i}_`), resolves dates, checks
  picker answers against scope, expands shared beginnings.
- **Runtime** — `iaso/entity_workflow/runtime.py` (shared with future web entry, §6b): `next_forms`, `prefill`,
  `submit`, `apply_changes`. Pure Python over an abstract store (in-memory for scenarios, DB for web entry). Holds the
  workflow logic the phone has in Kotlin: followup selection in list order, JsonLogic with the device's typing
  (`__int__`… suffixes, dates as epoch ms, `current_*` variables), prefill by first leaf name with `_` fallback,
  copy rules as a re-typed string copy. Phones, sync and cards (phase 5) are runner-level state too.
- **Form engine** — `odk_cli`, via `iaso/odk/engine.py`. Two operations, one process each (native image, ms startup):
  - `edit` — exists (`InstanceEditor`): submission + answers by path → recomputed XML or every error;
  - `new` — to add: blank form → preloads run with the step's clock (`today()`, `now()`, `start`/`end`), context
    and prefill set, answers set → recomputed XML or every error. Same answer syntax and error codes as `edit`.
  - both optionally return the **dependency edges** of the form (JavaRosa triggerables) and the non-relevant paths,
    for the "why" view.
  The profile recompute after copy rules is just an `edit` of the reference submission with the copied values.
- **Evaluator** — Python: matchers, typed comparisons, reference resolution, failure explanation.

Settled: **the test runner, the trace, the assertions and the sync steps live in IASO (Python)**; `odk_cli` never
launches a test suite.

#### Workflow logic: Python or Kotlin? (not decided)

The phone-side workflow logic (followup selection, value typing, prefill, copy rules, card format) can either be
re-written in Python (**B**) or **copied from the app into `odk_cli` as stateless commands** called by the Python
runner (**C**). Findings in `iaso-mobile-app` (HEAD `cd09d4026`):

| piece                                   | where in the app                                                  | Android adherence                                                     | extraction                                   |
|-----------------------------------------|-------------------------------------------------------------------|-----------------------------------------------------------------------|----------------------------------------------|
| JsonLogic + `current_*` variables       | `workflow/.../EvaluateLogic.kt` (38 lines)                        | only `@Inject`; json-logic-java, JavaRosa `DateUtils`, org.json      | **already copied verbatim** in `odk_cli` (minus DI); takes `now` → clock injectable |
| value typing (`__int__`, dates → epoch ms, lists) | `collect_app/.../GetFormStructure.kt` (327) + `protobuf-form/.../entity/Question.kt` (483) + `utils/Question.kt` `data` | Parcelable/Parcelize, `android.util.Base64`, androidx `LruCache`, Moshi, repositories | copy & strip; it reads the **server's form descriptor** (`DescriptorDto` = `FormVersion.form_descriptor`) — not copied in `odk_cli` today (strings only) |
| followup selection                      | `collect_app/.../GetFollowUpForms.kt` (35)                        | repositories, Hilt                                                    | trivial rewrite (list order!)                |
| prefill (`_` fallback, first leaf)      | Collect fork `FormController.answerQuestion`                     | Android module                                                        | already re-implemented in `odk_cli` `FormValidator` |
| copy rules + profile recompute          | `collect_app/.../UpdateEntity.kt` (147; core ~10)                 | `Uri`, disk, repositories, Timber                                     | core rewrite; recompute = `edit`             |
| questions ⇄ form controller             | `protobuf-form/.../QuestionsToFormController.kt`, `FormControllerToQuestions.kt` (~80) | Collect's Android `FormController`                                    | adapt to JavaRosa `FormDef`                  |
| card format                             | `protobuf-form/.../QuestionsToBytes.kt` (69) + visitors (~220) + `smartcard/.../AESCBCBlockModeCryptoHelper.kt` (93) | `QuestionsToBytes`: Context/Toast/Hilt; visitors and crypto: none     | copy & strip                                 |

None of it is a drop-in dependency (every module is an Android library: Hilt, Parcelize, Timber), but the logic
itself is JavaRosa + json-logic-java + protobuf + org.json: roughly **1,000–1,500 lines to copy and strip** into a
plain JVM module. As suspected, `odk_cli`'s `EntityWorkflowValidator` copies `EvaluateLogic` but **re-implements**
prefill and copy rules and **skips the typing** (every value a string) — a simplified mock, not the app's logic.

- **B — Python runtime**: one language for runner + logic, easier for web entry; but a second implementation of
  JsonLogic semantics and typing, held honest only by parity fixtures produced from the Kotlin code.
- **C — Kotlin in `odk_cli`, Python orchestrates** (recommended): `odk_cli` gains stateless commands built from the
  copied app code — `next-forms` (descriptor-based typing + `EvaluateLogic`, list order), `apply-changes` (copy rules +
  profile recompute), `card-encode` / `card-decode` — next to `new` / `edit`. Python never evaluates JsonLogic or types
  values; it only sequences calls, keeps state and checks expectations. Web entry (§6b) calls the same commands.
  Parity is by copy (same code, same libraries); a later step can turn the copy into a shared JVM module used by both
  the app and `odk_cli`, once the app team agrees to strip Android from those classes.
  Cost: more Kotlin to maintain in `odk_cli`, an `odk_cli` release when that logic changes, and one process per call.

Latency of C's extra calls (measured 2026-10-08): calling `odk_cli` costs **~3 ms** whatever it does (process start:
2.6 ms on the host, 3.0 ms through `subprocess.run` in Docker; `/bin/true` is 0.6 ms) - small next to a form fill
(15-50 ms on real forms), which both options need, like the profile recompute after copy rules. One or two small
calls per step add ~3-6 ms, 5-10 % of a step, +30-60 ms on a 10-step scenario: invisible in the UI. It matters for
**bulk evaluation** only (coverage analysis, AI exploring hundreds of variants: thousands of conditions at 3 ms vs
microseconds in Python). If C is chosen, the answer is **fewer, bigger calls**: a stateless `odk_cli step` doing fill +
copy rules + profile recompute + forms offered in one process (state in, new state + trace out), not a long-lived
`serve` (see §4.5). Latency doesn't decide B vs C; parity does.

Where the engine runs — two interchangeable backends behind one `FormEngine` interface, same calls, same results:

- **local** — **chosen**: `odk_cli` subprocess in the Django/worker images. Works on premises and offline; nothing
  to operate. Packaging already prototyped on branch `poc/ariadne-orgunits` (commit `10cac989d6`, not on develop):
  - both `docker/django/Dockerfile` and `docker/prod/Dockerfile` download the release binary from S3
    (`blsq-io/odk-cli/odk_cli-linux-amd64`), checked against a pinned SHA-256, into `/usr/local/bin/odk_cli`;
  - Python wrapper `iaso/odk/instance_editor.py` (`settings.ODK_CLI_PATH`, one process per call, 10 s timeout,
    typed errors, `InstanceEditorUnavailable` when the binary is missing);
  - **amd64 only**: on arm64 (Apple Silicon dev machines) there is no binary → needs either an arm64 build in the
    `odk_cli` release, or the JVM jar as a dev fallback.
  - First step of phase 0: bring that packaging + a generalised wrapper (`iaso/odk/engine.py`: `edit`, `new`) to
    develop, independently of the GraphQL POC.
- **remote** (`SCENARIO_ENGINE_URL`): the same binary behind HTTP — e.g. AWS Lambda / a small container (native
  image starts in tens of ms, scales to zero). One deployment for every IASO server, engine upgraded with mobile
  releases, also usable by the mobile team, CI and `odk_cli edit`.
  - forms and attachments referenced **by content hash**; only the ones the engine doesn't have cached are uploaded
    (large `pulldata` CSVs, request size limits);
  - one call per form operation (chatty: latency adds up per step — a reason to stay `local`);
  - requests signed by the IASO server; the browser never calls the engine directly (the recorder preview goes
    through IASO);
  - forms leave the server (answers are fake): deployments with data-residency rules keep `local`.
- Each run stores the engine backend and version.

Browser vs. engine: the browser (web-forms) is for **authoring speed** — recorder and live preview; the **verdict**
always comes from the engine, because it is JavaRosa like the phone, and because gates (publish, form upload,
scheduled, CI) run without any browser.

Why `odk_cli` and not a Python re-implementation or web-forms on the server:

- No Python XPath/XForm engine with JavaRosa's semantics exists; writing one is the expensive, brittle part.
- web-forms (and Enketo) are different engines with different edge cases (dates, `pulldata`, decimals). Fine for
  authoring, but a test judged by another engine than the phone gives false confidence.
- `odk_cli` is pinned to the mobile JavaRosa commit, and its packaging into the IASO images is already prototyped.

Considered and set aside: running the whole scenario inside `odk_cli` (a `run` command reusing
`EntityWorkflowValidator`). Better parity for the workflow logic (could share Kotlin with the app), but it puts the
test runner, the trace and the assertions in a separate Kotlin release cycle, and can't be reused for web entry nor
reach the real server code for sync steps. `EntityWorkflowValidator` stays as a handy offline tool and a source of
parity fixtures.

### 4.2 Form engine calls and the trace (sketch)

`odk_cli` calls (stdin/stdout JSON; `edit` keeps its current CLI too):

```jsonc
// odk_cli new — fill a new submission
{ "xform": "<h:html …>", "csvs": { "zscores.csv": "…" },
  "clock": "2026-10-22T08:30:00", "username": "nurse_1",
  "prefill": { "first_name": "Luke", "age_months__int__": "11", "current_ou_id": "123" },  // leaf names, `_` fallback
  "answers": { "muac": "12.0", "child[2]/age": "4" },                                       // paths
  "explain": true }
// → ok
{ "xml": "<data …>", "values": { "muac": "12.0", "program": "OTP", … },
  "prefilled": [{ "path": "_first_name", "name": "first_name" }], "irrelevant": ["oedema_grade"],
  "deps": [["program", "oedema_status"], ["program", "previous_muac__decimal__"]] }
// → refused (exit 1)
{ "refused": true, "errors": [{ "code": "REQUIRED", "path": "muac_unit", "message": "Answer is required" }] }

// odk_cli edit — same, from an existing submission (profile recompute after copy rules)
{ "xform": "…", "instance": "<data …>", "answers": { "previous_muac__decimal__": "12.0" }, "explain": true }
```

The runner assembles the trace per step, in Python:

```jsonc
{ "step": 2, "status": "ok|refused|not_offered|error",
  "offered":  [{ "followup": 7, "order": 1, "condition": {…}, "result": true, "vars": { "age_months__int__": 11 } }],
  "prefill":  [{ "path": "_first_name", "value": "Luke", "from": "profile" }, { "path": "current_ou_id", "from": "context" }],
  "errors": [], "instance": { … }, "irrelevant": [ … ],
  "changes":  [{ "source": "muac", "target": "previous_muac__decimal__", "before": null, "after": "12.0" }],
  "profile":  { … }, "profile_recomputed": [{ "path": "program", "before": "", "after": "OTP" }],
  "deps": [ … ], "engine": { "version": "1.1.0", "ms": 14 } }
```

A failing step can be exported as the exact `odk_cli` inputs, to replay outside IASO (support, bug reports, mobile
team).

### 4.3 No records saved

By construction: the compiler reads, the engine is a separate process without DB access, results are stored only in
the new tables. Two optional, explicit, later features for debugging:

- **Export as submissions**: a zip of the generated XMLs in the mobile bulk-upload format — to import into a
  sandbox project, or to open on a phone.
- **Materialise in a sandbox project**: same, done for the user, flagged so the data can be wiped.

### 4.4 Mobile parity checklist (decide each, test each)

| behaviour                                       | device                         | EntityWorkflowValidator today | proposal (Python runtime unless noted)          |
|-------------------------------------------------|--------------------------------|---------------|--------------------------------------------------------------|
| followups order                                 | list order, `order` ignored    | sorted        | mimic device by default + **warn** when the two differ; fix mobile |
| JsonLogic variable types                        | typed (suffixes, epoch ms)     | strings       | port `GetFormStructure` typing                               |
| `current_date/time/datetime`                    | injected                       | missing       | inject from the step date (resolved by the compiler)         |
| prefill by leaf name, `_` fallback, first match | yes                            | yes           | keep; warn when a leaf name is ambiguous (repeats, groups)    |
| org unit injection (exact names)                | yes                            | as answers    | dedicated `context`, exact match only                         |
| mapping copy then profile recompute             | yes                            | no recompute  | recompute                                                    |
| null source in mapping                          | DB row emptied, XML kept       | n/a           | follow XML (what gets uploaded) + warn                        |
| reference form newer version (profile migrate)  | `UpdateProfileForm`            | no            | phase 2                                                      |

Each row becomes a parity test of the Python runtime, with fixtures produced from the phone's own code.

### 4.5 Speed

Measured 2026-10-08 (POC, `odk_cli` v1.0.0 native binary, one process per form fill, WSL laptop):

| form | size | per fill |
|---|---|---|
| POC example forms (5–10 questions) | 2 KB | ~3 ms (binary start + parse + walk) |
| real nutrition forms (`odk_cli` test data) | 24 KB / 91 binds | ~15 ms |
| idem | 67–95 KB / 133–208 binds | 34–49 ms |

The whole POC suite in Docker (9 scenarios, ~30 fills, Python included) runs in ~0.5 s. The cost is the form's parse
and initialisation, repeated at every fill (a 2 KB form costs 3 ms, a 90 KB one 45 ms).

So for real configurations:

- **one scenario, synchronous: holds.** 10 steps on ~90 KB forms ≈ 10 fills ≈ 0.5 s (+ one profile recompute per
  step once added: ≤ 1 s).
- **a suite (20 scenarios × 10 steps ≈ 200 fills ≈ 10 s): not in a request.** A `Task` with progress, or parallel
  processes (4 workers ≈ 3 s). Same for gates (publish, form upload) that run several suites.
- **One short-lived process per call, on purpose (decided 2026-10-08).** A long-lived `odk_cli serve` (fills read on
  stdin, parsed forms kept in memory) would make fills after the first ~10× faster, but **not** bundled to run side by
  side in the Django/worker containers: a JVM-native process living as long as the container brings memory leaks
  (parsed forms and JavaRosa caches growing with every form version seen), a second process to supervise, restart and
  monitor next to gunicorn / the worker, no per-request isolation (one pathological form can slow or wedge every
  scenario after it), and harder resource accounting. A process per call is dead simple: memory freed at exit, a
  timeout per call, nothing to monitor.
- If speed is ever a problem, in order: memoise results by input hash; batch calls (`odk_cli step`, one process per
  step instead of several); parallel processes for suites (a `Task` with N workers); and only then a long-lived engine
  as a **separate service** (the `remote` backend, §4.1) with its own monitoring, memory limits and restarts, or
  recycled after N requests like gunicorn's `max_requests` - never a sidecar inside the web container.
- Not measured yet: forms with `pulldata` on large CSVs (the CSV lookup is a linear scan per call) - the one such form
  in the test data, with a 1,525-line z-score table, makes `odk_cli edit` fail with a NullPointerException, to fix
  first.

- Results memoised by input hash (same form version + inputs → no process).
- Block results memoised in the run: 30 scenarios starting with the same registration fill it once (key = hash of
  compiled steps prefix + form versions + workflow version).
- Interactive "run this scenario" is synchronous (≤ 1 s, measured above); "run the suite" and "run all suites" are a `Task`
  (existing `iaso/models/task.py`) with progress.
- When editing step N in the UI, re-run from the cached state of step N-1.

### 4.6 Models (new app `iaso/scenarios/` or `iaso/models/scenarios.py`)

```python
class ScenarioSuite(SoftDeletableModel):
    account = FK(Account)
    entity_type = FK(EntityType)                  # suites are about one workflow
    name, slug (unique per account), description
    projects = M2M(Project)                        # which projects it runs in (multi-project)
    definition = JSONField()                       # the Pydantic-validated document (context, blocks, scenarios)
    source = CharField(choices=MANUAL|RECORDED|GENERATED)
    is_gate = BooleanField(default=False)          # run on publish / form upload, show results in the dialog
    created_by, updated_by, created_at, updated_at
    # history via existing Modification log (log_modification) — diffs of `definition`

class ScenarioRun(models.Model):
    account, suite = FK(ScenarioSuite, null=True)  # null = "all gate suites" run
    trigger = CharField(MANUAL|WORKFLOW_PUBLISH|FORM_VERSION_UPLOAD|SCHEDULED|API)
    workflow_version = FK(WorkflowVersion)         # the version tested (can be DRAFT)
    form_version_overrides = JSONField()           # {form_id: form_version_id | "candidate:<upload id>"}
    task = FK(Task, null=True)
    status, started_at, ended_at, created_by
    engine_version = CharField()                   # odk_cli release, for reproducibility
    payload = FileField(null=True)                 # compiled payload, downloadable
    stats = JSONField()                            # {passed, failed, error, skipped, duration_ms}

class ScenarioResult(models.Model):
    run = FK(ScenarioRun, related_name="results")
    scenario_key, scenario_name
    status = CharField(PASSED|FAILED|ERROR|SKIPPED)
    failed_step = IntegerField(null=True)
    failures = JSONField()                         # [{step, expectation, expected, actual, explanation}]
    trace = JSONField()                            # engine output (or a gzipped file if large)
    duration_ms
```

Decision to make: one `definition` document per suite (recommended: simplest export/import, copy/paste, diff, AI
output, git-friendly) vs. a row per scenario/step (finer permissions and history). The UI writes the document (recorder,
check picker); the JSON file (§3, "File format") is only its export form.

Permissions: new `iaso_entity_scenarios` (read/run) and reuse `iaso_workflows` for edit, or one permission for both.

### 4.7 API

```
GET/POST/PATCH/DELETE /api/scenarios/suites/                 (+ ?entity_type_id=, ?project_id=)
POST   /api/scenarios/suites/{id}/run/                       {workflow_version_id?, scenario_keys?, overrides?}  → run (sync if small, else task)
POST   /api/scenarios/validate/                              definition → schema errors + compile errors (unknown form/question/choice)
GET    /api/scenarios/runs/?suite_id=  /runs/{id}/  /runs/{id}/payload/
POST   /api/scenarios/record/prepare/                        {suite, scenario, step} → form XML with prefill + context injected, intent groups described
POST   /api/scenarios/generate/                              (AI, §6)
GET    /api/scenarios/suites/{id}/export/  POST /import/preview/  POST /import/   JSON file, see §4.9
GET    /api/scenarios/schema/v1.json                         the JSON Schema (from the Pydantic model), for editors
```

Management command `run_scenarios --account --suite --workflow-version` for CI / OpenHEXA.

### 4.8 Gates and form version updates

- **Publishing a workflow version**: the publish dialog runs gate suites against the DRAFT and shows the results; it
  doesn't block (a warning, with an override), at least at first.
- **Uploading a new XLSForm**: the candidate is parsed (`iaso/odk/parsing.py`), converted to XML in memory and the gate
  suites run with that form overridden, *before* the `FormVersion` exists. The report groups engine errors into
  actionable items, combined with `iaso/odk/diff.py`:
  - `REQUIRED path` → "new required question `muac_unit` has no answer in 12 steps (3 suites)" — quick fix: set a value
    for all of them.
  - `UNKNOWN_QUESTION` → question removed/renamed — quick fix: rename the answer key (offer the diff's renames).
  - `UNKNOWN_CHOICE` → choice removed.
  - a mapping (`WorkflowChange`) pointing to a missing question — already partly validated, surfaced here too.

  Shown to the user as sentences with the question **labels** and one-click fixes (§5.5), never as error codes.

### 4.9 Import / export (copy to another server or account)

- **Export**: one JSON file per scenario group (or a selection of scenarios), with the shared beginnings they use
  (also from other groups) inlined as blocks. Header: source server, account, entity type, workflow version and form
  versions it last passed on, export date. No beneficiary data beyond what the scenario itself contains (already
  fake/anonymised).
- **References by natural keys**: entity type `code`; forms by `form_id` (the XLSForm id, stable across servers) with
  name as a fallback; questions by name (labels re-resolved on import); org units by `source_ref`, else name + type +
  parent names; roles/users by name. Choice values as stored values.
- **Import = a matching screen, then a dry run**:
  1. parse + schema check (Pydantic) — errors shown as sentences;
  2. each reference resolved automatically when unambiguous; ambiguous or missing ones listed for the user to map
     ("CS Kalemie (Health facility) → not found here: [pick an org unit ▾]"), remembered per source server so a second
     import doesn't ask again;
  3. questions/choices missing on the target forms are reported like a form update (§4.8);
  4. the imported group is run once immediately; the result tells the user if the target behaves the same.
- **Conflicts**: importing a group whose name exists → "replace", "keep both" or "merge scenarios by name".
- Same mechanism used for templates: a "starter pack" file shipped with a standard workflow (nutrition, CHW, …).
- Endpoints: `GET /api/scenarios/suites/{id}/export/`, `POST /api/scenarios/import/preview/` (returns the matching
  table), `POST /api/scenarios/import/` (with the user's mapping choices).

## 5. UI

Principle: **show the journey, not the configuration — but let technical people see the configuration in place.**
Everything is built by doing (filling forms, ticking checks) and read as sentences. No JSON editor in the app: JSON is
only behind *Export* / *Import* in a "⋮" menu.

**"Show technical names" switch** (every scenario screen, off by default, remembered per user): people called in to
help debug must not have to translate labels back to the form. When on, in place, next to the plain-words version:

- question **names** next to labels (`Program` `program`, `Last MUAC` `previous_muac__decimal__`), form codes next to
  form names, followup order numbers;
- the **raw JsonLogic** of each followup condition under its human-readable sentence, and the **typed values** it read
  (`followup_visits__int__: 1 (int)`) — typing is where device bugs hide;
- the XPath `calculation` / `relevant` / `constraint` behind each "why" node, and copy rules as `form.source → target`;
- the instance XML of each step and the downloadable debug file (compiled payload + engine trace, replayable with
  `odk_cli` outside the server).

The page is the same: support and the implementer look at one screen and can point at the same line.

Entry points: a **Scenarios** tab on the entity type / workflow page and a **Scenario tests** entry under Entities.
New domain `hat/assets/js/apps/Iaso/domains/scenarios/`. Clickable mock-ups: see the design canvas.

### 5.1 Scenario list (per entity type)

```
Scenarios for Child                        Test against [Workflow v13 · draft ▾]   [▶ Run all] [+ New scenario ▾] [⋮]
Last run 4 min ago — 7 passing, 1 failing                                            ├ Fill the forms myself
                                                                                      ├ Start from a real beneficiary
 Scenario                                         Journey                         Result  ├ Start from a shared beginning
 MUAC yellow child goes to TSFP, cured after…     Registration → Anthropometry → …  ✓    [⋮] Export… / Import…
 Child with oedema is referred to OTP             Registration → Anthropometry       ✗ Step 2: Program should be OTP, was TSFP
 A negative MUAC is refused                       Registration → Anthropometry       ✓
 Clinician at another facility continues…         … (as Clinician · CS Moba)         ✓
Shared beginnings: Register an 11-month-old child (used by 5) · Register a 3-year-old with oedema (used by 2)
```

### 5.2 Recording a step (replaces Enketo here)

```
New scenario: [Child with oedema is referred to OTP          ]
┌ Journey ───────────────┐┌ Filling as [Nurse ▾] in [Nutrition app ▾] at [CS Kalemie ▾] on [2 weeks after step 1 ▾] ┐┌ What IASO will do ──────────┐
│ ✓ 1 Register a child    ││ Anthropometry                                                  ││ Forms offered next          │
│     3 checks            ││ ⓘ Filled in from Child information: name, age (11 months) [see] ││  ✓ Medical visit             │
│ ● 2 Fill Anthropometry  ││ MUAC (cm)            [ 12.0 ]                                   ││  – Discharge (not offered)   │
│ + Add a step            ││ Oedema               (•) Yes  ( ) No                            ││ Child's file will change     │
│                         ││ Where is the child seen?  DRC › Kalemie › CS Kalemie [Change]  ││  Program      —  → OTP       │
└─────────────────────────┘│                              [ Save step and choose checks → ] ││  Oedema status — → Yes       │
                           └────────────────────────────────────────────────────────────────┘└─────────────────────────────┘
```

1. The scenario is replayed up to the previous step (cached); the form opens in the `odk-preview` web form with
   Child information and the org unit values already filled in, as the phone would do — and a note says what was prefilled.
2. Intent groups (`pick_ou`, `pick_entity`) become IASO pickers inside the form flow (org unit breadcrumb + tree limited
   by the intent's parameters and the user's scope; entity search) — the user never sees "intent".
3. "Filling as … in … at … on …" switches user/role, project, org unit and date for this step (multi-role,
   multi-project, multi-facility journeys). The choices are limited to what is consistent: projects of the account that
   contain the form, org units in the chosen user's or role's scope.
4. "What happens in this step" — an optional one-line description, shown in the journey, on the checks screen and on
   each step card of the results; useful when forms are long and answers alone don't tell the story.
5. The right panel is a **live preview** from the engine (debounced): forms offered next and Child information changes,
   so users see the consequences while filling.
6. On save, only what the user entered is kept as the step's answers.

A disagreement between web-forms and odk_cli shows as a failed run immediately — the engine has the last word.

### 5.3 Choosing the checks

After each step: "What should this scenario check?"

- **Forms offered next**: each offered form pre-ticked as "should be offered"; not-offered forms listed as optional
  "should *not* be offered".
- **Child information after this step**: values that changed in this step first, pre-ticked; unchanged ones collapsed
  ("22 values unchanged — show"). Each has a "how to compare" menu in words: *is exactly* (default), *is about* (decimals),
  *is any value*, *is empty*, *is N days after this step's date*, *is exactly <date>*.
- **This step should be refused**: switch for negative scenarios; shows the form's own message ("MUAC must be > 0")
  and keeps it as the check.

### 5.4 A failing scenario, explained

```
✗ Child with oedema is referred to OTP — failed at step 2 of 3

 Program should be OTP, but it was TSFP.

 Why IASO got TSFP
  [Program = TSFP]  is calculated in Child information from Oedema status and Previous MUAC
     ├─ [Previous MUAC = 12.0]  copied from MUAC in Anthropometry (step 2) ✓
     └─ [Oedema status = No]   ⚠ not updated: Anthropometry's "Oedema" (Yes) has no copy rule in workflow v13
                                (v12 had "Oedema → Oedema status")                    [Open copy rules]
 What changed since it last passed: workflow v12 → v13 · 1 copy rule removed

 Forms offered after step 2
  ✓ "always"                                       → Medical visit
  ✗ "Program is OTP"            Program was TSFP   → OTP admission
  [If TSFP is now correct: update this check]   [▸ Child information at each step]   [▸ Technical details]
```

- The "why" chain comes from the trace (`deps`, copy rules applied, prefill sources), limited to the failing value's
  ancestors, written with labels and step numbers; formulas, names and JsonLogic shown with the technical switch.
- "What changed since it last passed" compares the stored run of the last pass (workflow version, form versions) with
  this one — the most useful hint for brittle configs.
- One-click outcomes: fix the config (link), or accept the new behaviour ("update this check").

### 5.5 New form version: impact before publishing

```
New version of Anthropometry (v5) — checked against 6 scenarios: 4 unchanged, 2 need you
 ● New required question "Arm used for MUAC" has no answer in 2 scenarios   Use [Left ▾] for both  [Apply]
 ● "Height (cm)" was renamed "Length/height (cm)" — 3 answers will follow                            [Apply]
 ● Choice "Twins" was removed from "Birth order" — used in 1 scenario       Replace with [Single ▾]  [Apply]
                                                       [Apply all and re-run]   [Continue without fixing]
```

### 5.6 Import on another server

```
Import scenarios — nutrition-scenarios.json (from iaso.bluesquare.org · account "DRC Nutrition", 8 scenarios)
 In the file                         On this server
 Entity type  Child (child)          ✓ Child
 Form         Child registration     ✓ Child registration (child_reg)
 Form         Anthropometry          ✓ Anthropometry — 1 question missing here: "Arm used for MUAC" [details]
 Org unit     CS Kalemie (Health fac.)  ⚠ not found  → [Pick an org unit ▾]
 Role         Nurse                  ✓ Nurse
 Group name exists here: ( ) Replace (•) Keep both ( ) Merge by scenario name
                                                       [Cancel]  [Import and run once]
```

## 6. AI (optional, behind the account AI key like Form AI)

1. **From a real entity, deterministic first**: pick an entity → its instances ordered by `created_at` → each becomes
   a step (form, org unit, user-entered answers, date kept relative to the first visit) → run → snapshot expectations. No LLM needed. Real
   data is personal: values of text questions are replaced by fakes (names, phone numbers) unless the user opts out,
   and the source entity isn't stored in the suite.
2. **LLM on top** (`anthropic` + Pydantic structured output on the suite schema — `pydantic-ai` if we want tool use):
   - name and describe scenarios, prune snapshot expectations down to meaningful ones;
   - **coverage**: compute deterministically which followup conditions were never true / never false and which
     changes were never exercised; ask the model for answers that flip them (e.g. `muac` 11.4 vs 11.5 around a
     `< 11.5`), then validate each proposal by running it — only passing-and-useful ones are proposed;
   - after a form update, propose answers for new required questions / renamed keys (§4.8), shown as a diff to accept.
3. Never runs silently; output is always a draft suite the user reviews.

## 6b. Beyond tests: entity workflows in the web interface

Most of what is built here is what a **web (no mobile) entity workflow** needs. Design it once as an **entity
workflow runtime** (server, Python orchestration + `odk_cli`), used by both:

| runtime operation                         | scenario runner (in-memory store)        | web entry (database store)                         |
|-------------------------------------------|------------------------------------------|----------------------------------------------------|
| `next_forms(entity, context)`             | checks "forms offered next"              | buttons on the entity page                         |
| `prefill(entity, form, context)`          | prefill shown in the recorder            | form opened like the phone would open it           |
| `submit(entity, form, answers, context)`  | step result, refused/accepted            | validated + recomputed XML, saved as an `Instance` |
| `apply_changes` + profile recompute       | expected profile                         | new reference instance (`Entity.attributes`)       |

The recorder screen is the web entry screen without "save for real". Scenarios then protect the web feature for free.

Extra work for real web entry (not in this proposal's scope):

- **writes**: through the same path as mobile (`import_data`, `find_entity`, merged-entity redirection), audit,
  permissions, per-project flag (alongside `MOBILE_ENTITY_*`), duplicate search before creation
  (`fields_duplicate_search`, `prevent_add_if_duplicate_found`);
- **the saved XML comes from JavaRosa** (`odk_cli`), never from web-forms: web-forms renders, odk_cli recomputes and
  validates, its output is stored — so a web submission is byte-for-byte what a phone would produce;
- **coexistence with phones**: last-writer-wins per submission on the device `updated_at`, no field merge; phones see
  web changes at next sync (day-granular `limit_date`); older offline phone edits get overwritten on download; NFC
  cards keep the old profile until next write — each worth a sync scenario before enabling web entry;
- media/GPS/signature questions: web equivalents or refused; validation workflows on web submissions.

Order: scenarios first (runtime with zero data risk + a regression suite), web entry second (reuses runtime +
recorder).

## 7. Phasing

| phase | content                                                                                                                         |
|-------|---------------------------------------------------------------------------------------------------------------------------------|
| 0     | Packaging of `odk_cli` on develop + `iaso/odk/engine.py`; `odk_cli new` (+ `explain`: deps, irrelevant) next to the existing `edit`. Python entity workflow runtime (typed JsonLogic, device order, prefill, copy rules + profile recompute) with parity fixtures from the phone code. Pydantic schema, compiler, runner, evaluator, `run_scenarios` command. **Useful from the CLI only.** |
| 1     | Models + API, scenario list, **recorder** (web-forms + IASO pickers) and check picker, failure view in sentences, export/import with the matching screen. Run on demand, against draft versions. |
| 2     | Live preview while filling, "fork from step", shared beginnings across groups, filling as another role/org unit/date, "what changed since last pass". |
| 3     | Gates on publish and on XLSForm upload with actionable fixes; scheduled runs.                                                   |
| 4     | Generation from real entities, coverage report, AI proposals; export to submissions / sandbox materialisation.                 |
| 5     | Phones, sync and NFC cards: per-phone state, `sync` against the real server code in a rolled-back transaction, card steps via `odk_cli card-encode` / `card-decode` built on the app's card code. |

## 8. Open questions

1. ~~Engine backend~~ **Decided (2026-10-08): `local`, `odk_cli` subprocess in the Django/worker images.** `remote` stays
   possible later behind the same `ScenarioEngine` interface. One short-lived process per call, no long-lived `odk_cli serve` next to Django (§4.5).
2. Followup order: mimic the device (list order) or fix the device to sort by `order`? The test tool will surface
   the discrepancy either way.
3. One JSON document per suite (recommended) vs. normalised rows.
4. Do roles need to matter beyond org unit scope and project (e.g. validation workflow nodes with `roles_required`)?
5. **Not decided:** where the workflow logic (followup selection, typing, prefill, copy rules) runs: Python runtime (B)
   or Kotlin copied from the app into `odk_cli` as stateless commands (C) — see "Workflow logic: Python or Kotlin?" in §4.1.
6. Gate policy: warn only, or block publish when a gate suite fails?
7. Import keys: is the XLSForm `form_id` reliably the same across servers/accounts in practice, and do org units
   carry a usable `source_ref` (else name + type + parents)?
8. Who may write scenarios: anyone with `iaso_workflows`, or a separate, lighter permission for field implementers?
9. Sync/NFC simulation: OK to run the real server code (import, mobile entity queryset, storage logs) inside an
   always-rolled-back transaction on production databases, or only on staging? (Locks and sequence gaps are the cost.)
