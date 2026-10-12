# Scenario tests

A scenario replays what the IASO app does with an entity workflow, without a phone and without saving anything:
register an entity with some answers, check which forms the app offers next, fill one of them, check what the entity's
information becomes. A form scenario checks one form on its own: what its calculations give, or that it refuses some
answers (required questions, constraints, choices).

Workflows are configured on the server but only evaluated by the app (follow-up conditions, copy rules from a
follow-up form to the entity), so a mistake is usually found in the field. Scenarios find it before publishing.

## How it works

- Forms are filled by `odk_cli`, the IASO app's form engine (JavaRosa), installed in the Docker images (linux/amd64).
- The workflow logic (which follow-ups are offered, how answers are typed on the phone, prefill, copy rules) is
  reproduced in Python (`iaso/scenarios/`), including the phone's quirks.
- A run writes nothing but the scenario's last result: no entity, no submission.

## Writing a scenario

Scenarios are JSON files (`"format": "iaso-scenarios/1"`), validated against the JSON Schema served by
`GET /api/scenarios/schema/` (use it as `"$schema"` in an editor). Answers and expected values are always text, as in a
submission (`"11"`, `"yes"`). Examples: `iaso/tests/scenarios/examples/`.

```json
{
  "format": "iaso-scenarios/1",
  "kind": "entity",
  "name": "Oedema leads to OTP",
  "steps": [
    {"form": "child_registration", "answers": {"first_name": "Amina", "age_months": "11"},
     "expect": {"next_forms": ["anthropometry"]}},
    {"form": "anthropometry", "at": "2026-10-22T08:30:00+00:00", "answers": {"muac": "12.0", "oedema": "yes"},
     "expect": {"attributes": {"oedema_status": "yes"}, "next_forms": ["anthropometry", "otp_admission"]}}
  ]
}
```

The first step of an entity scenario fills the entity type's reference form. Forms are named by their `form_id`.

## Running scenarios

- In the web interface: the **Scenarios** panel of a workflow version (draft or published) imports files, runs them
  against that version and explains failures; the technical details (prefill, form as filled, follow-up conditions
  with the values they read) are behind "See the result".
- API: `POST /api/scenarios/run/` with `{"scenario_ids": [...], "workflow_version_id": 12}` (the version is optional:
  by default, the published one). Runs are synchronous, limited by `SCENARIOS_SYNC_MAX_STEPS`.
- Command line (CI, pipelines), read-only, exits with an error when a scenario doesn't pass:
  `docker compose run --rm iaso manage run_scenarios --account 1 [--workflow-version 12] [--report report.md]`.

Permission: `iaso_workflows`.

## Known limits

- One entity per scenario; a scenario mixing several entity types and plain forms is planned.
- No sync, no NFC cards, no role or org unit pickers yet (the step `context` sets values by question name).
- A prefilled calculation loses its value when the form is loaded (`odk_cli edit` recalculates); `odk_cli new` will fix it.
