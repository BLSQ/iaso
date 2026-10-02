# Promptness stats API: to-do list

Spec: `docs/pages/dev/reference/API/promptness_stats.en.md` - Code: `iaso/api/promptness_stats/` - Tests:
`iaso/tests/api/promptness_stats/` - Benchmark: `./manage.py benchmark_promptness_stats`.

| #  | Topic | Description | Status |
|----|-------|-------------|--------|
| 1  | Submission timestamp | `SUBMISSION_TIMESTAMP_FIELD` (`constants.py`) is `created_at`. To be decided with the client: `created_at` (reception on the server) or `source_created_at` (creation on the device). | **Open**. Blocks 7 (= 6d) |
| 2  | Timezone of the deadline | The deadline day ends at midnight in Django's active timezone (UTC). Pinned by `test_deadline_end_uses_the_current_timezone`. Alternatives: timezone of the country, of the account or of the form. | **Open** |
| 3  | Ordering of the NA rows | NA rows are ordered as 0 on the counts, and Postgres puts their `NULL` percentages first in descending order. Pinned by `test_order_descending` and `test_order_multiple_fields`. Ties are ordered by `id` (see 9). | **Open** |
| 4  | Role of `OrgUnitType.depth` | Not used: an org unit is NA when nothing is expected in its hierarchy. Types without depth are at an unknown level. | **Open** |
| 5  | "Expected" and missions | One expected submission per target org unit. Will change once missions are implemented. | Unchanged |
| 6  | Query cost | See 6a-6g. Form 1068 (202510, country): provinces > 15 min (never finished) → 188 ms, facilities sorted by `-missing` 23 s → 336 ms, summary 104 ms. Form 1196 (2026, 63,793 targets, 61,552 submitted): list 2.2-3.0 s at the root (10 to 63,793 rows, whatever the ordering), 1.3-1.5 s for a region, summary 1.1 s at the root and 0.7 s for a region. | **Mostly done** |
| 6a | Targets without the join on groups | Target ids from 2 separate subqueries (`org_unit_type__in` / `id__in` members of the form's groups) instead of an `OR` on the join with the groups: no more full scans of `iaso_orgunit` (~4.5M rows) and `iaso_group_org_units` (~22.9M rows). | **Done**, tests green |
| 6b | Statuses with `EXISTS` | `received` = a valid submission exists, `on_time` = one exists before the deadline, `late = received - on_time`, `missing = expected - received`: no more search for the earliest submission, 3 counts instead of 4. | **Done**, tests green |
| 6c | Targets computed once | Materialized CTE of the targets and their status, expanded once per org unit of their path, joined to the rows with a hash join on the id. | **Done**, tests green |
| 6d | Index on the submissions | = 7. | **On hold**, blocked by 1 |
| 6e | `.only()` on the rows | Only the columns used by the serializers (rows, and parent of the totals): width of a row 919 → 225 bytes. | **Done**, tests green |
| 6f | Validation of `org_unit_type_ids` | `OrgUnitType.objects.filter(projects__account=...)` without prefetches: 7 queries → 1. | **Done**, tests green |
| 6g | Count of the pagination | Count the rows without their counts (valid children, or valid descendants of the given types) instead of the annotated queryset: the targets CTE is computed once per list call instead of twice. Expected gain on form 1196: ~2.3 → 1.2 s at the root, ~1.3 → 0.7 s for a region. Example implementation proposed (`CountedDjangoPaginator`). | **On hold**. Biggest remaining gain, not blocked |
| 7  | Index on the submissions | Composite index `iaso_instance (form_id, period, org_unit_id, <timestamp>)`: each `EXISTS` of the targets CTE (~18 µs per target on form 1196) becomes a single index lookup. Needs a migration. | **On hold**, blocked by 1 |
| 8  | Percentages computed twice | By the database (needed by the ordering) and by the serializer (output). Both round half up, so the values match. | **Open** |
| 9  | Stable pagination | `StableOrderingFilter` always ends the ordering with `id`. Tests + spec. | **Done** |
| 10 | CSV export | `export_csv` is a stub, its format is not decided. Response documented as the params serializer, `order` not documented, commented out in `test_permissions.py`, `setUp()` / `get_csv()` helpers to remove from `test_export_csv.py`. Should it include the totals? | **To do** |
| 11 | Grace period in the form settings | `Form.promptness_grace_period_days` exists (with its migration) but is not exposed by the form serializers. | **To do** |
| 12 | OpenAPI documentation | Params and responses documented for the list and the summary (`self.get_serializer()`). Export: see 10. | **Done** |
| 13 | Filters out of scope | `team_ids`, `user_ids`, `project_ids`, `planning_id`, `org_unit_group_id` (supported by the completeness stats). | Unchanged |
| 14 | Spec clean-up | Grace period, 400 examples, list / summary split, ordering ties. The open questions will have to be updated once 1-4 are decided. | **Done** |

## Small pending questions

- `test_list.py`: `test_order_multiple_fields` and `test_order_by_org_unit_type_name` put the value before the org unit
  name in their tuples (`(1, "Amhara")`): put the name first?
- The summary accepts `org_unit_type_ids` and ignores it (documented in the spec): keep it this way?
- Statistics of the database copy are out of date (24,010 targets estimated instead of 10,459, 1 submission instead
  of ~1,091): `ANALYZE` would make the plans more reliable, but changes the state of the database.