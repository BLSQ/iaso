# Entity scenario tests — implementation plan

Date: 2026-10-10 (updated after review the same day). Builds on the design proposal `ENTITY-SCENARIO-TESTS.md` and the POC on `poc/scenario-tester`
(commit 173fdb6aeb: `iaso/scenarios/` runtime, jsonlogic, form engine via `odk_cli`, schema, runners, report; 28 tests).

Goal of this plan: ship the POC as a **first phase you can use on staging within one PR series**: minimum backend
(one model, one viewset), minimum UI (one panel on the workflow version page), scenarios authored as JSON files. The
recorder, suites, gates and the rest of the design come later (§4).

---

## 1. Phase 1 — scope

**What the user can do**

On a workflow version's page (draft or published), a **Scenarios** panel lists the entity type's scenarios.
The user can:

1. **Import** one or more scenario files (`scenario-*.json`, the POC format, `"kind": "entity"`);
2. **Run all** (or one) against *this* workflow version → each row shows ✓ / ✗ and, for a failing one, the failing
   step and its failures as sentences (the POC's messages), plus a collapsed **Details** block (submission, prefill,
   profile, followup conditions with the values read) for technical people;
3. **Download** a scenario (the same JSON back) and **delete** one.

Decided 2026-10-10: **`iaso_workflows` only** (no feature flag, TODO below); **workflow logic stays in Python, forms
filled by `odk_cli`** (the POC, option B); **runs stay synchronous**; entity and form scenarios are expected to **merge
into one broader concept** (a production project mixes plain forms and several entity types), so phase 1 must not bake
"one scenario = one entity type" into the model or the API (§2.1).

Who writes the files in phase 1: technical implementers / support, by hand, from the `$schema`-backed editor, or with
Claude. That respects the design's rule "JSON only as an import/export file" — there is still no JSON editor in the UI.

**Explicitly out of phase 1** (each is a later phase, §4): recorder (web-forms), check picker, suites/grouping, stored
run history, background task runs, form scenarios (`"kind": "form"`) in the UI (stored and runnable through the
API, see §2.1), scenarios spanning several entity types, gates on publish/upload, candidate
XLSForm overrides, import matching screen across servers, role/org-unit/date context pickers, sync/NFC, AI.

**Why this cut**: the engine is already proven by the POC tests; what's missing to get feedback from real
implementers is *a place to keep scenarios and a button to run them against a draft*. Everything above it is UX
on top of the same endpoint.

---

## 2. Backend

### 2.0 Hardening the POC first (separate PR, no API yet)

Checklist findings in the POC code, to fix before anything is exposed over HTTP:

| # | Where | Problem (checklist item) | Fix |
|---|-------|--------------------------|-----|
| 1 | `forms.py` `FormSource.version` | `Form.objects.filter(form_id=…).first()` — **not scoped to the account** (§1), `.first()` without `order_by` (§2); two accounts can share a `form_id` | `FormSource(project)`: `project.forms.filter(form_id=…)` (the project belongs to the account, checked by the API); none → "unknown form X"; soft-deleted forms excluded by `Form.objects` (verify in a test) |
| 2 | `form_engine.py` | `os.environ.get("ODK_CLI_PATH")` (§2: settings, never `os.getenv`) | `ODK_CLI_PATH` + `ODK_CLI_TIMEOUT_SECONDS` declared in `hat/settings.py` with defaults; documented in `env_variables.en/fr.md` |
| 3 | `entities.py` `EntityScenarioRunner.__init__` | runner trusts any `WorkflowVersion`; reference form taken as is | runner gets the account; the API resolves the version within the account (§2.3); `entity_type.reference_form` None → clear error, not `AttributeError` |
| 4 | `entities.py` / `forms.py` | statuses are magic strings `"ok"`, `"not_offered"`… (§2 enums) | `class StepStatus(models.TextChoices)` (or `str, Enum`), reused by serializer and tests |
| 5 | tests + examples | Star Wars names Luke / Leia (§5 fixture names) | neutral names (e.g. "Amina", "Jules"); account "Belgium" |
| 6 | `test_report.py` | writes a file from `os.environ["SCENARIO_REPORT"]`, asserts little (§5 "writing a file without asserting doesn't count") | assert on the markdown content (failing step, condition, values read); keep the env var only as an optional dump |
| 7 | repo root | `ENTITY-SCENARIO-TESTS.md`, this file (§8 stray dev files) | move the design to `docs/pages/dev/reference/entities_in_iaso/scenario_tests.en.md` (doc without source code) or keep out of the PR |
| 8 | Dockerfiles | new binary download (§8 dependencies explained) | PR notes: BLSQ S3 bucket, pinned sha256, amd64 only, what happens on arm64 dev machines (`FormEngineError` "odk_cli isn't installed" → step error, not 500) |
| 9 | `jsonlogic_parity/` | 732-line generated JSON + Java probe | PR notes: generated, how to regenerate, not to review line by line |

Also: hoist any in-function imports (§2), `logger` not `print`, docstrings kept short (reviewers flag
"AI-looking" verbosity, §7 — trim the module docstrings while there).

### 2.1 Model (one table, generic name)

`iaso/models/scenarios.py` (exported from `iaso/models/__init__.py`). Named `Scenario`, not `EntityScenario`: entity
and form scenarios will likely merge into one concept (a project in production mixes plain forms and several entity
types in one journey), and renaming a model + endpoint later is the expensive part.

```python
class Scenario(SoftDeletableModel):
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="scenarios")  # the app it simulates
    kind = models.CharField(max_length=20, choices=ScenarioKind.choices)   # entity | form, copied from definition
    entity_type = models.ForeignKey(EntityType, null=True, blank=True, on_delete=models.CASCADE, related_name="scenarios")
    #   ^ derived from the definition (reference form of the first step) for "kind": "entity"; null otherwise.
    #     A filter/index, not the scenario's identity: a future mixed scenario touches several entity types.
    name = models.CharField(max_length=255)              # copied from definition["name"], for list/order/filter
    description = models.TextField(blank=True, default="")
    definition = models.JSONField()                      # the validated file, as imported (schema.Scenario)

    # last run only; history = phase 2 (ScenarioRun)
    last_run_at = models.DateTimeField(null=True, blank=True)
    last_run_workflow_version = models.ForeignKey(WorkflowVersion, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    last_run_status = models.CharField(max_length=20, choices=ScenarioStatus.choices, blank=True, default="")
    last_run_result = models.JSONField(null=True, blank=True)  # serialized ScenarioResult (§2.3)

    created_by / updated_by = FK(User, null=True, on_delete=SET_NULL, related_name="+")
    created_at / updated_at

    class Meta:
        constraints = [UniqueConstraint(fields=["project", "name"], condition=Q(deleted_at__isnull=True), name="…")]
```

Decisions taken for phase 1:
- **one row per scenario**, not one document per suite (design's open question 3): one file = one scenario is already
  the POC format, list and delete are plain CRUD, a suite can later be an FK/M2M on top without migrating `definition`.
- **scoped by project**, not by entity type: the project is what a phone runs, and it is the common ground of entity
  and form scenarios; forms are resolved among the project's forms (fixes §2.0 #1 at the same time).
- **both kinds stored and runnable through the API**; the phase 1 UI only shows entity scenarios of the workflow's
  entity type. Form scenarios are reachable via API / `run_scenarios`, no UI yet.
- `CharField(blank=True, default="")`, no `null=True` on chars (§4); no UUID (not created on mobile, §4).
- Soft delete via `SoftDeletableModel` (`objects` / `objects_include_deleted`), the unique constraint ignores deleted rows.
- Changes logged with `log_modification` on import/delete (audit, §2 reuse `Modification`).
- `definition` is always re-validated with `load_scenario` before running (the format may evolve: `"format"` field;
  a merged format would be `iaso-scenarios/2`, read side by side with `/1`).

TODO (format, later): a step names its form; the entity it acts on (new / an earlier step's entity / none for a plain
form) becomes explicit, so one scenario can register a household, then a child, then fill a plain form. The runner
then keeps a profile per entity instead of one. Not needed for phase 1, but `kind`, `entity_type` and the API must not
assume the opposite.

Single migration, no data migration, small new table → nothing to flag for the release.

### 2.2 Permission

Phase 1: read, import, delete and run all require **`iaso_workflows`** (`CORE_WORKFLOW_PERMISSION`), like the workflow
pages, with `IsAuthenticated` + `HasPermission(CORE_WORKFLOW_PERMISSION)` in `permissions.py`. No feature flag.

TODO (later):
- a dedicated, lighter `iaso_scenarios` permission for field implementers (design's open question 8); backward
  compatible to add. Form scenarios may then not need `iaso_workflows` at all (`iaso_forms`).
- an account feature flag if the feature must be hidden from some accounts while it matures.

### 2.3 API — one viewset

`iaso/api/scenarios/` with `views.py`, `serializers.py`, `filters.py`, `permissions.py` (★ next to views):

```
GET    /api/scenarios/?project_id=&kind=&entity_type_id=&workflow_version_id=   list (paginated, {results: [...]})
GET    /api/scenarios/{id}/                                    retrieve: metadata + definition (= download)
POST   /api/scenarios/                                         import: {project_id, definition}
DELETE /api/scenarios/{id}/                                    soft delete
POST   /api/scenarios/run/                                     {scenario_ids: [...], workflow_version_id?}
GET    /api/scenarios/schema/                                  the JSON Schema (schema.json_schema()), for editors
```

`workflow_version_id` is optional on `run`: by default each entity scenario runs against its entity type's
**published** version; given, it overrides it (testing a draft). TODO with mixed scenarios: one override per entity
type (`{entity_type_id: workflow_version_id}`), same field name pluralised, old one kept.

No PATCH in phase 1: to change a scenario, re-import it (`POST` with the same name in the project → 400 "already exists, delete it
first"; "replace" comes with the import screen). `http_method_names = ["get", "post", "delete"]`.

Implementation notes, following the checklist:
- Base class: `iaso.api.common` `ModelViewSet` restricted by `http_method_names` (as `WorkflowVersionViewSet`), or
  `GenericViewSet` + `ListModelMixin`/`RetrieveModelMixin`/`CreateModelMixin`/`DestroyModelMixin` (§2 smallest base).
- `get_queryset()`: `Scenario.objects.filter(account=request.user.iaso_profile.account)`; `select_related("project", "entity_type", "last_run_workflow_version", "created_by")`.
- Filtering in `ScenarioFilter` (django_filters): `project_id`, `kind`, `entity_type_id`, `workflow_version_id`
  (→ its workflow's entity type), `search` on name (§2 FilterSet, not `query_params`).
- Serializers (`iaso.api.common.ModelSerializer`):
  - `ScenarioListSerializer` — id, name, description, kind, project_id, entity_type_id, steps count, journey (form ids of the
    steps), `last_run_*` (status, at, workflow_version_id, failed_step, first failure). No `definition` in the list
    (heavy field opt-out, §4b); every `SerializerMethodField` has `@extend_schema_field` (§3 ★).
  - `ScenarioDetailSerializer` — + `definition`, `last_run_result`.
  - `ScenarioCreateSerializer` — `project_id` as `PrimaryKeyRelatedField(queryset=Project.objects.none())`
    restricted to the account in `__init__` (★); `validate_definition` → `load_scenario(json.dumps(value))`,
    pydantic errors turned into a `ValidationError` listing `loc: msg` per error; `validate` checks the forms named in
    the definition exist in the project (400 "unknown form X" at import, not at run) and, for an entity scenario, that
    the first step's form is the reference form of an entity type of the account (→ sets `entity_type`).
  - `ScenarioRunRequestSerializer` — `scenario_ids` (required, restricted to the account; foreign ids → 400, not
    ignored, §1), `workflow_version_id` (optional, `PrimaryKeyRelatedField`, `WorkflowVersion.objects.none()` restricted
    to `workflow__entity_type__account=account`; must match the entity scenarios' entity type → 400 otherwise). An
    entity type without published version and no override → that scenario `error` "no published workflow version".
  - `ScenarioRunResultSerializer` (plain `Serializer`, the run is not a model): per scenario `{id, name, status,
    failed_step, failures[], steps: [{index, form, description, status, failures[], next_forms[], details: {prefilled,
    submission, changes, profile, followups: [{id, order, condition, read, value, error}]}}]}`. The `details` are the
    phase 1 equivalent of "Show technical names": always returned, collapsed in the UI.
- `run` action: `@action(detail=False, methods=["post"], serializer_class=ScenarioRunRequestSerializer)` +
  `@extend_schema(request=…, responses={200: ScenarioRunResultSerializer, 400, 403})`.
  - **Synchronous** (decided), bounded: total steps ≤ `settings.SCENARIOS_SYNC_MAX_STEPS` (default 200 ≈ 10 s on real
    nutrition forms at ~50 ms/fill, §4.5 of the design), else 400 "too many steps, run fewer scenarios". TODO: a `Task`
    when real suites outgrow it.
  - One `FormSource` per project and one `EntityScenarioRunner` per workflow version per request (forms/XForms loaded once, workflow config once).
  - Saves `last_run_*` on each scenario with one `bulk_update(fields=[…])` (§4b caller saves once).
  - Engine failures (`odk_cli` missing/timeout/crash) become a step `error` with a message, never a 500 (§3).
  - A definition that no longer validates (format changed) → scenario `error` "this file needs updating", not 500.
  - Nothing is written to `Entity` / `Instance` (the runner is in-memory) — asserted in a test.
- URLs registered in `iaso/urls.py` router next to the workflow routes.

### 2.4 Settings

`hat/settings.py`: `ODK_CLI_PATH = os.environ.get("ODK_CLI_PATH", "odk_cli")`, `ODK_CLI_TIMEOUT_SECONDS`,
`SCENARIOS_SYNC_MAX_STEPS`.

---

## 3. Frontend (minimum)

New domain `hat/assets/js/apps/Iaso/domains/scenarios/` (★ layout: `messages.ts`, `types.ts`, `hooks/requests/`,
`components/`, `utils.ts`). Orval-generated types if the domain uses them (note "generated, don't review" in the PR).

Entry point: **one `WidgetPaper` "Scenarios"** on the workflow version details page
(`domains/workflows/details.tsx`, under follow-ups / changes), listing `kind=entity` scenarios of the workflow's
entity type, run against *this* version. `iaso_workflows` is already required by the page. No new route, no menu
entry. Import asks for the project when the entity type is in several (defaults to the only one).

Components (each in its own file, §6):
- `ScenariosPanel.tsx` — header buttons **Import** (file input, multiple `.json`) and **Run all**; the table.
- `ScenariosTable.tsx` — `SimpleTableWithDeepLink` / `Table` columns: name (+ description under it), journey
  (form names joined by " → "), last result (✓ / ✗ / not run, the version it ran on if different from this one, date),
  actions (Run, Download, Delete with `DeleteModal`). Empty-table message (§6 UI consistency).
- `ScenarioResultDetails.tsx` — for a failing scenario, expandable row: failed step number + form, failures as a list
  of sentences, then a collapsed **Details** (`Accordion`) with prefill / submission / profile / followups tables.
- `ImportScenariosButton.tsx` — reads files client side, `JSON.parse`, POSTs one by one, shows per-file errors from
  `useApiErrorValidation` / snackbar (a pydantic error list from §2.3).

Hooks (`hooks/requests/`): `useGetScenarios(params)`, `useImportScenario`, `useDeleteScenario`,
`useRunScenarios(workflowVersionId)` — query keys from params, API urls as constants, mutations invalidate
`['scenarios', params]`; Run button disabled while the mutation is pending (§3 concurrency).

Styles: `sx` + `const styles: SxStyles` outside components, no `makeStyles` (★). All labels in `messages.ts`
(`iaso.scenarios.label.*`), en/fr in the JSON files; no `as` casts / `@ts-ignore`.

Frontend tests (vitest + msw + `renderWithThemeAndIntlProvider`): list renders, empty state, run shows a failing
step's sentence, import error displayed. (Reminder: run vitest in Docker or restart webpack afterwards.)

---

## 4. Tests (backend) and mutation pass

Layout mirroring the API (★): `iaso/tests/api/scenarios/test_views.py`, `test_filters.py`,
`test_serializers.py`, `test_run.py`; engine tests stay in `iaso/tests/scenarios/`. `SwaggerTestCaseMixin` +
`assertResponseCompliantToSwagger` on every endpoint (★), `res = self.assertJSONResponse(r, status.HTTP_200_OK)` (★).

Setup (`setUpTestData`): two accounts **Belgium** and **France**, each with a project, the example workflow
(`fixtures.ScenarioExamplesTestCase` refactored into a helper taking an account), a soft-deleted scenario, a user
with `iaso_workflows`, a user without the permission, a user of the other account. Reuse
`create_user_with_profile`.

Cases (each asserts content, not only status):
- list: own account only (France's scenarios absent), soft-deleted absent, filter by project / kind / entity type /
  workflow version,
  `assertNumQueries(n)` with a comment listing the queries (★), no `definition` in list items.
- anonymous → 401; no `iaso_workflows` → 403.
- import: DB row (`name`, `kind`, `entity_type` derived, `definition`, `created_by`, `Modification` logged), for both
  kinds; invalid JSON shape → 400 with the pydantic location in the message (`assertHasError`); unknown form / form of
  another project → 400; France's `project_id` → 400; duplicate name in the project → 400; same name after soft
  delete → ok; same name in another project → ok.
- retrieve returns the definition identical to the imported one (download round-trip).
- delete: soft-deleted (`objects_include_deleted`), `Modification` logged, other account's id → 404.
- run: passing + failing entity scenario and a form scenario → statuses, failed step, failure sentence,
  `details.followups[].read`; `last_run_*` saved (`refresh_from_db()`); default = published version, override with a
  draft; France's workflow version → 400; version of another entity type → 400; `scenario_ids` with a France id → 400; too many steps → 400; no `Entity`/`Instance` created (`count()` before/after);
  `odk_cli` missing (patch `settings.ODK_CLI_PATH` to a nonexistent path) → 200 with a step error, not 500;
  stored definition with an old/invalid format → scenario error.
- `FormSource`: same `form_id` in Belgium and France → picks the project's form (regression test for §2.0 #1, must
  fail on the POC code).

Mutation pass (§5b), at least: drop the account filter in `get_queryset` / `FormSource` / the version queryset;
drop the soft-delete filter; flip `passed`; skip `bulk_update`; remove `log_modification`; remove a list
`select_related`; change the max-steps comparison `>`→`>=`; remove `definition` validation. Report as a table in the PR.

---

## 5. PR slicing (each reviewable alone)

| PR | Content | Size |
|----|---------|------|
| 1 | `odk_cli` packaging in Docker images + settings (`ODK_CLI_PATH`…) + `form_engine.py` with its tests | small |
| 2 | Engine: `jsonlogic.py` + parity fixtures, `device_values.py`, `runtime.py`, `schema.py`, `forms.py`, `entities.py`, `report.py` + tests, with the §2.0 fixes (account-scoped `FormSource`, enums, names) | large but pure Python, no API |
| 3 | Model + migration + API + backend tests + `run_scenarios` management command (`--account --project [--workflow-version]`, `verbosity`, read-only so idempotent) | medium |
| 4 | Frontend panel + translations + vitest | medium |
| 5 | Doc page `docs/pages/dev/reference/entities_in_iaso/scenario_tests.en/fr.md` (file format, how to write one, how to run) | small |

Each PR title `IA-XXXX: …` (ticket to create), template filled, unused boilerplate deleted, "Not in this PR" listing
§1 out-of-scope items, How to test with exact commands, e.g.:

```
docker compose run --rm iaso python manage.py test iaso.tests.scenarios iaso.tests.api.scenarios --keepdb
docker compose run --rm iaso python manage.py run_scenarios --account 1 --project 2 --workflow-version 12
```

Mobile impact: none (no mobile endpoint touched, nothing written to entities/instances).

---

## 6. After phase 1 (from the design §7, re-cut)

| Phase | Adds |
|-------|------|
| 2 | `ScenarioRun` history, PATCH/replace on import, form scenarios in the UI (form page), **merged format: one scenario across plain forms and several entity types** (`iaso-scenarios/2`), step context (org unit, role, date) in plain words; `Task` runs if the sync limit hurts |
| 3 | Recorder (web-forms `odk-preview`, prefill injected) + check picker → no more hand-written JSON; "turn a real entity into a scenario" |
| 4 | Suites, gates on workflow publish and XLSForm upload (candidate form override), actionable fixes with `iaso/odk/diff.py` |
| 5 | Export/import across servers with the matching screen; starter packs |
| 6 | Phones, sync and NFC cards; AI proposals |

## 7. Decisions

Taken 2026-10-10:
- permission `iaso_workflows` only; dedicated permission / feature flag = TODO (§2.2);
- workflow logic in Python + forms filled by `odk_cli` (POC, option B) — the design's open question 5 is closed for now;
- synchronous runs, capped by `SCENARIOS_SYNC_MAX_STEPS`; `Task` = TODO;
- entity and form scenarios kept in one generic `Scenario` model scoped by project, expected to merge (§2.1 TODO).

Still to confirm before PR 3:
1. One row per scenario (plan) vs. one document per suite.
2. Scenario scoped by **project** (plan) rather than by entity type.
3. Sync cap default 200 steps.

## 8. Status (2026-10-10): phase 1 implemented, staged, not committed

Done as planned (PRs 1–5 content, staged together on `poc/scenario-tester`), with these differences:
- Frontend hooks and types are **Orval-generated** (`hat/assets/js/apps/Iaso/api/scenarios/`, project `scenarios` in
  `orval.config.ts`), not hand-written hooks. Generated with the image's Orval 8.23 + `patches/@orval+query+8.20.0.patch`
  applied by hand: the patch no longer matches the locked version (8.23), so `npm install` doesn't apply it — without
  it the generated mutations don't compile (`onSuccess` dropped, `queryClient` undefined). Worth a separate fix.
- Result details are a dialog ("See the result", loaded on open) rather than an expandable row.
- Found in passing, not fixed: `import_workflow_real` finds workflows/versions by `uuid` server-wide — importing the
  same export in a second account moves the first account's workflow to it (test fixtures use fresh uuids).
- **Scope changed 2026-10-10 (user): scenarios are scoped by account, not project** — entity types (and forms) can be
  shared by several projects. No `project` FK; forms are looked up among the forms of the account's projects; two
  different forms with the same `form_id` in one account are refused at import and give a step error at run
  ("Several forms of the account have the form_id …"). Name unique per account. TODO: an optional project, if needed.
