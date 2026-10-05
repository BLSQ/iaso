# `PromptnessStats` API

> **Status: draft specification.** The list and summary endpoints are implemented, the CSV export is not.

This API returns, for **one form** and **one period**, how many of the expected submissions have been received
**on time**, **late** or are still **missing**, grouped per org unit below a parent org unit.

It is split into 2 endpoints, called with the same query parameters:

- [`GET /api/promptness_stats/`](#get-promptness-statistics): the rows of the table, one per org unit, paginated and
  ordered.
- [`GET /api/promptness_stats/summary/`](#get-promptness-summary): the period (deadline...) and the totals for the
  parent org unit. They don't depend on the ordering or the page of the rows, so they don't have to be fetched again
  when the user changes the page or the ordering of the table.

It is inspired by the Completeness statistics API (`GET /api/v2/completeness_stats/`) and follows the same
conventions (comma-separated id lists, pagination envelope, row shape, drill-down through `parent_org_unit_id`).

## Definitions

- **Target org unit**: an org unit that is expected to submit the form. Same rule as completeness: its org unit type
  is one of the form's `org_unit_types`, **or** it belongs to one of the form's `org_unit_groups`.
  Only org units with validation status `VALID` are taken into account (not configurable).
- **Expected**: the number of submissions expected from target org units in the hierarchy of a row (the row itself
  included). Currently, this is equal to the number of org units below + itself, but this will change once missions
  are implemented.
- **Period window**: `start` and `end` dates of the requested `period`, as computed by `iaso.periods.Period`.
- **Grace period**: a number of days, configured per form in the form settings (`Form.promptness_grace_period_days`,
  see [Dependencies](#dependencies-and-open-questions)). `null` when not set: the promptness can't be computed for
  such a form.
- **Deadline**: `period end + grace period days`. The deadline day is inclusive (a submission made at any time on the
  deadline day is on time).
- **Status of a target org unit**, based on its **earliest valid submission** (not deleted, with a file, for this form
  and this period):
    - `ON_TIME`: earliest submission timestamp ≤ deadline
    - `LATE`: earliest submission timestamp > deadline
    - `MISSING`: no valid submission
- **Submission timestamp**: the upload date of the submission, `created_at` (set by the server when it receives the
  submission). The creation date on the device (`source_created_at`) is not used: a submission created on time but
  uploaded after the deadline (e.g. by an offline device) is late.
- **Received**: `on_time + late`.
- **Completeness**: `received / expected`.
- **Not applicable ("NA")**: an org unit with nothing expected in its hierarchy (itself included), e.g. an org unit
  that is not a target and has no target below it, or a region without any target. It has `is_applicable: false` and
  all its counts and percentages are `null`, whatever the `status` param.

Invariants, for every applicable row and for the totals when applicable:

```
on_time + late + missing = expected
received = on_time + late
```

Percentages are floats between `0` and `100` rounded to 1 decimal, always computed against `expected`.

# Get promptness statistics

`GET /api/promptness_stats/`

The rows of the table: one row per org unit below `parent_org_unit_id`, with its counts. The period and the totals are
returned by the [summary endpoint](#get-promptness-summary).

## Permissions

- User must be authenticated
- User needs one of the permissions used by the completeness statistics:
  `iaso_completeness_stats`, `iaso_registry_read` or `iaso_registry_write`

## Query Parameters - Filters

- `form_id`: Int (**required**) - ID of the form. Must be accessible to the user, have a `period_type` and a grace
  period (`promptness_grace_period_days` not `null`, `0` is allowed).
- `period`: String (**required**) - Period in the IASO period format (e.g. `202609` for September 2026, `2026Q3`,
  `2026`...). Its period type must match the form's `period_type`.
- `parent_org_unit_id`: Int (**required**) - ID of the parent org unit. By default, the rows are its direct children
  (the totals of the summary are computed for this org unit). Must be accessible to the user.
- `org_unit_type_ids`: String (optional) - Comma-separated list of org unit type IDs (multiple select).
  When provided, the rows are the descendants of `parent_org_unit_id` having one of these types, instead of its
  direct children.
    - Example: `&org_unit_type_ids=3,4`
- `status`: String (optional) - Comma-separated list of statuses to include, among `ON_TIME`, `LATE`, `MISSING`.
  Defaults to all three. An excluded status is hidden from the rows and from the totals of the summary (its count and
  percentage are returned as `null`). `expected`, `received` and `completeness_percent` are not affected.
    - Example: `&status=LATE,MISSING`
- `order`: String (optional) - Comma-separated list of fields to order by. Prefix with `-` for descending order.
  Defaults to `name`. Allowed values: `name`, `org_unit_type__name`, `expected`, `received`, `completeness_percent`,
  `on_time`, `on_time_percent`, `late`, `late_percent`, `missing`, `missing_percent`. Unsupported fields are
  ignored. Rows with equal values are always ordered by org unit id, so that the pagination is stable.
    - Example: `&order=-missing,name`
- `page`: Int (optional) - Current page number. Defaults to `1`.
- `limit`: Int (optional) - Number of rows per page. Defaults to `20`.

### Example requests

Request matching the mock-up (Monthly facility report, September 2026, Ethiopia, all statuses, sorted by missing
descending):

```
GET /api/promptness_stats/?form_id=42&period=202609&parent_org_unit_id=1&org_unit_type_ids=3,4&status=ON_TIME,LATE,MISSING&order=-missing&page=1&limit=20
```

| Param                | Value                    |
|----------------------|--------------------------|
| `form_id`            | `42`                     |
| `period`             | `202609`                 |
| `parent_org_unit_id` | `1`                      |
| `org_unit_type_ids`  | `3,4`                    |
| `status`             | `ON_TIME,LATE,MISSING`   |
| `order`              | `-missing`               |
| `page`               | `1`                      |
| `limit`              | `20`                     |

Minimal request (required params only, defaults for everything else):

```
GET /api/promptness_stats/?form_id=42&period=202609&parent_org_unit_id=1
```

## Possible responses

### 200 - OK

Standard paginated response:

```json
{
  "count": "Long - total number of rows",
  "has_next": "Boolean",
  "has_previous": "Boolean",
  "page": "Long",
  "pages": "Long",
  "limit": "Long",
  "results": [
    {
      "id": "Int - org unit id",
      "name": "String - org unit name",
      "org_unit_type_id": "Int - org unit type id",
      "parent_org_unit": {
        "id": "Int",
        "name": "String"
      },
      "has_children": "Boolean - true if the row can be drilled down (call again with parent_org_unit_id=<id>)",
      "is_applicable": "Boolean - false if nothing is expected in the hierarchy of the row (all counts are then null)",
      "expected": "Int|null - target org units in the hierarchy of the row (itself included)",
      "received": "Int|null - on_time + late",
      "completeness_percent": "Float|null - received / expected * 100",
      "on_time": "Int|null - null if ON_TIME is excluded by the status param",
      "on_time_percent": "Float|null",
      "late": "Int|null - null if LATE is excluded by the status param",
      "late_percent": "Float|null",
      "missing": "Int|null - null if MISSING is excluded by the status param",
      "missing_percent": "Float|null"
    }
  ]
}
```

Example response to the first example request (`org_unit_type_ids=3,4`, i.e. regions and zones), made on 2026-09-28.
It is an extract: only a few of the 42 rows are shown (6 regions + 36 zones).

```json
{
  "count": 42,
  "has_next": true,
  "has_previous": false,
  "page": 1,
  "pages": 3,
  "limit": 20,
  "results": [
    {
      "id": 12,
      "name": "Oromia",
      "org_unit_type_id": 3,
      "parent_org_unit": {"id": 1, "name": "Ethiopia"},
      "has_children": true,
      "is_applicable": true,
      "expected": 320,
      "received": 178,
      "completeness_percent": 55.6,
      "on_time": 152,
      "on_time_percent": 47.5,
      "late": 26,
      "late_percent": 8.1,
      "missing": 142,
      "missing_percent": 44.4
    },
    {
      "id": 13,
      "name": "Amhara",
      "org_unit_type_id": 3,
      "parent_org_unit": {"id": 1, "name": "Ethiopia"},
      "has_children": true,
      "is_applicable": true,
      "expected": 260,
      "received": 142,
      "completeness_percent": 54.6,
      "on_time": 120,
      "on_time_percent": 46.2,
      "late": 22,
      "late_percent": 8.5,
      "missing": 118,
      "missing_percent": 45.4
    },
    {
      "id": 120,
      "name": "Jimma",
      "org_unit_type_id": 4,
      "parent_org_unit": {"id": 12, "name": "Oromia"},
      "has_children": true,
      "is_applicable": true,
      "expected": 38,
      "received": 18,
      "completeness_percent": 47.4,
      "on_time": 15,
      "on_time_percent": 39.5,
      "late": 3,
      "late_percent": 7.9,
      "missing": 20,
      "missing_percent": 52.6
    },
    {
      "id": 121,
      "name": "East Shewa",
      "org_unit_type_id": 4,
      "parent_org_unit": {"id": 12, "name": "Oromia"},
      "has_children": true,
      "is_applicable": true,
      "expected": 45,
      "received": 28,
      "completeness_percent": 62.2,
      "on_time": 24,
      "on_time_percent": 53.3,
      "late": 4,
      "late_percent": 8.9,
      "missing": 17,
      "missing_percent": 37.8
    },
    {
      "id": 130,
      "name": "North Gondar",
      "org_unit_type_id": 4,
      "parent_org_unit": {"id": 13, "name": "Amhara"},
      "has_children": true,
      "is_applicable": true,
      "expected": 30,
      "received": 15,
      "completeness_percent": 50.0,
      "on_time": 13,
      "on_time_percent": 43.3,
      "late": 2,
      "late_percent": 6.7,
      "missing": 15,
      "missing_percent": 50.0
    }
  ]
}
```

The output is **flat**: rows of every requested org unit type (here regions, type `3`, and zones, type `4`) are
returned in the same `results` list, and sorted together according to `order`. The hierarchy can be rebuilt with
`parent_org_unit`. Because a zone's figures are also included in its region's figures, the totals of the summary are
**not** the sum of the rows: they are always computed once, for `parent_org_unit_id`.

Same request with `status=LATE,MISSING`: `on_time` and `on_time_percent` are `null` in every row, all other values
are unchanged.

Notes for the front-end:

- The "Share" bar is built from `on_time_percent`, `late_percent` and `missing_percent`; its label is `on_time_percent`.
- "Open submissions" and "Form settings" are front-end links (submissions list filtered on form / period / org unit,
  and form detail page); they do not require any additional API.

### 400 - Bad request

Returned with a field-keyed body when:

- `form_id`, `period` or `parent_org_unit_id` is missing
- `form_id`, `parent_org_unit_id` or one of `org_unit_type_ids` does not exist or is not accessible to the user
- the form has no `period_type`
- the form has no grace period (`promptness_grace_period_days` is `null`)
- `period` is invalid, or its period type does not match the form's `period_type`
- `status` contains an unknown value

The errors on each param are reported together:

```json
{
  "period": ["Invalid period"],
  "status": ["\"RECEIVED\" is not a valid choice."]
}
```

The period type mismatch is only checked once all the params are valid:

```json
{
  "period": ["Period type QUARTER does not match the form period type MONTH"]
}
```

### 401 - Unauthorized

- No authentication token or an invalid one was provided

### 403 - Forbidden

- User does not have the proper permissions

# Get promptness summary

`GET /api/promptness_stats/summary/`

The period (with its deadline) and the totals for `parent_org_unit_id`, displayed above the table.

## Permissions

Same as [Get promptness statistics](#permissions).

## Query Parameters - Filters

Same as [Get promptness statistics](#query-parameters-filters), so that the front-end can send the same params to both
endpoints. Only `form_id`, `period`, `parent_org_unit_id` and `status` are used:

- `org_unit_type_ids` is validated but has no effect: the totals are always computed for the whole hierarchy of
  `parent_org_unit_id`, whatever the rows of the table.
- `order`, `page` and `limit` are ignored.

```
GET /api/promptness_stats/summary/?form_id=42&period=202609&parent_org_unit_id=1
```

## Possible responses

### 200 - OK

```json
{
  "period": {
    "value": "String - echo of the period param",
    "start": "Date - 'YYYY-MM-DD' - first day of the period",
    "end": "Date - 'YYYY-MM-DD' - last day of the period",
    "grace_period_days": "Int - grace period configured on the form",
    "deadline": "Date - 'YYYY-MM-DD' - end + grace_period_days, inclusive",
    "is_current": "Boolean - true if today is within [start, end]",
    "is_provisional": "Boolean - true if today <= deadline (figures may still change)"
  },
  "totals": {
    "is_applicable": "Boolean - false if nothing is expected in the hierarchy of parent_org_unit_id (all counts are then null)",
    "expected": "Int|null - target org units in the hierarchy of parent_org_unit_id (itself included)",
    "received": "Int|null - on_time + late",
    "completeness_percent": "Float|null - received / expected * 100",
    "on_time": "Int|null - null if ON_TIME is excluded by the status param",
    "on_time_percent": "Float|null",
    "late": "Int|null - null if LATE is excluded by the status param",
    "late_percent": "Float|null",
    "missing": "Int|null - null if MISSING is excluded by the status param",
    "missing_percent": "Float|null"
  }
}
```

Example response matching the mock-up (Ethiopia, September 2026), made on 2026-09-28:

```json
{
  "period": {
    "value": "202609",
    "start": "2026-09-01",
    "end": "2026-09-30",
    "grace_period_days": 10,
    "deadline": "2026-10-10",
    "is_current": true,
    "is_provisional": true
  },
  "totals": {
    "is_applicable": true,
    "expected": 1240,
    "received": 670,
    "completeness_percent": 54.0,
    "on_time": 563,
    "on_time_percent": 45.4,
    "late": 107,
    "late_percent": 8.6,
    "missing": 570,
    "missing_percent": 46.0
  }
}
```

Same request with `status=LATE,MISSING`: `on_time` and `on_time_percent` are `null` in `totals`, all other values are
unchanged.

### 400 / 401 / 403

Same as [Get promptness statistics](#400-bad-request).

# Export promptness statistics as CSV

`GET /api/promptness_stats/export_csv/`

Dedicated custom action that reuses the queryset and filtering of the list endpoint.

## Permissions

Same as [Get promptness statistics](#permissions).

## Query Parameters - Filters

Same as [Get promptness statistics](#query-parameters-filters), except `page` and `limit`: all rows are exported.

```
GET /api/promptness_stats/export_csv/?form_id=42&period=202609&parent_org_unit_id=1&order=-missing
```

## Possible responses

### 200 - OK

- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="promptness_<form_id>_<period>.csv"`

/!\ this is an example of formatting, the actual formatting has not been decided yet

One line per row, with these columns:

```
form_id,period,deadline,org_unit_id,org_unit_name,org_unit_type,parent_org_unit,expected,received,completeness_percent,on_time,on_time_percent,late,late_percent,missing,missing_percent
42,202609,2026-10-10,12,Oromia,Region,Ethiopia,320,178,55.6,152,47.5,26,8.1,142,44.4
42,202609,2026-10-10,13,Amhara,Region,Ethiopia,260,142,54.6,120,46.2,22,8.5,118,45.4
```

Columns of statuses excluded through the `status` param are omitted.

### 400 / 401 / 403

Same as [Get promptness statistics](#400-bad-request).

# Dependencies and open questions

- **Form setting for the grace period**: `Form.promptness_grace_period_days` (nullable), added with its migration.
  It still has to be editable from the form settings, which implies an update of the form serializers.
- **Timezone of the deadline**: the timezone used to evaluate "end of the deadline day" has to be confirmed
  (server `TIME_ZONE` by default).
- **Out of scope for now**: the additional filters supported by the completeness statistics (`team_ids`, `user_ids`,
  `project_ids`, `planning_id`, `org_unit_group_id`) could be added later.