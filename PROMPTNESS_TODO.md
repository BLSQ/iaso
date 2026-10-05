# Promptness stats API: to-do list

Spec: `docs/pages/dev/reference/API/promptness_stats.en.md` - Code: `iaso/api/promptness_stats/` - Tests:
`iaso/tests/api/promptness_stats/` - Benchmark: `./manage.py benchmark_promptness_stats`.

| #  | Topic | Description | Status |
|----|-------|-------------|--------|
| 1  | Submission timestamp | Decided: the upload date, `created_at`. `source_created_at` (creation on the device) is not used: a submission created on time but uploaded after the deadline is late. Used directly in `queries.py` (the `SUBMISSION_TIMESTAMP_FIELD` constant is removed), covered by `test_upload_date_is_used`, documented in the spec. | **Done** |
| 2  | Timezone of the deadline | The deadline day ends at midnight in Django's active timezone (UTC). Pinned by `test_deadline_end_uses_the_current_timezone`. Alternatives: timezone of the country, of the account or of the form. | **Open** |
| 3  | Ordering of the NA rows | NA rows are ordered as 0 on the counts, and Postgres puts their `NULL` percentages first in descending order. Pinned by `test_order_descending` and `test_order_multiple_fields`. Ties are ordered by `id` (see 9). | **Open** |
| 4  | Role of `OrgUnitType.depth` | Not used: an org unit is NA when nothing is expected in its hierarchy. Types without depth are at an unknown level. | **Open** |
| 5  | "Expected" and missions | One expected submission per target org unit. Will change once missions are implemented. | Unchanged |
| 6  | Query cost | See 6a-6h. Form 1068 (202510, country): provinces > 15 min (never finished) → 119 ms, facilities sorted by `-missing` 23 s → 216 ms, summary 96 ms. Form 1196 (2026, 63,793 targets, 61,552 submitted): list 0.72-1.43 s at the root (10 to 63,793 rows, whatever the ordering), 0.22-0.37 s for a region, summary ~0.7 s at the root and ~0.2-0.3 s for a region. | **Mostly done** |
| 6a | Targets without the join on groups | Target ids from 2 separate subqueries (`org_unit_type__in` / `id__in` members of the form's groups) instead of an `OR` on the join with the groups: no more full scans of `iaso_orgunit` (~4.5M rows) and `iaso_group_org_units` (~22.9M rows). | **Done**, tests green |
| 6b | Statuses with `EXISTS` | `received` = a valid submission exists, `on_time` = one exists before the deadline, `late = received - on_time`, `missing = expected - received`: no more search for the earliest submission, 3 counts instead of 4. | **Done**, tests green |
| 6c | Targets computed once | Materialized CTE of the targets and their status, expanded once per org unit of their path, joined to the rows with a hash join on the id. | **Done**, tests green |
| 6d | Index on the submissions | = 7. | **Done** |
| 6e | `.only()` on the rows | Only the columns used by the serializers (rows, and parent of the totals): width of a row 919 → 225 bytes. | **Done**, tests green |
| 6f | Validation of `org_unit_type_ids` | `OrgUnitType.objects.filter(projects__account=...)` without prefetches: 7 queries → 1. | **Done**, tests green |
| 6g | Count of the pagination | The rows are counted before being annotated (`get_rows()` / `annotate_rows()` in `queries.py`), and the count is given to `PromptnessStatsPagination.paginate_queryset(count=...)` (`CountedDjangoPaginator`): the targets CTE is computed once per list call instead of twice. Count query on form 1196: 612 → 9 ms (regions), 850 → 173 ms (points of interest). Benchmark: form 1196 -26 to -49% at the root (lists 0.72-1.43 s), -25 to -50% for a region (0.22-0.37 s), `page=2` beyond the last page 665 → 68 ms, form 1068 -13 to -26%. Tests: `test_pagination.py`, `test_pagination_count_does_not_compute_the_counts`. | **Done** |
| 6h | Summary without the paths expansion | The summary only needs the counts of the parent: count directly from the `promptness_targets` CTE instead of expanding the paths (445,206 rows → 63,793 kept on form 1196 at the root, ~225 ms). | **Suggestion** |
| 7  | Index on the submissions | Partial index `iaso_instance_promptness_idx` on `iaso_instance (form_id, period, org_unit_id, created_at) WHERE NOT deleted AND file IS NOT NULL AND file <> ''` (`Instance.Meta`, migration `0404`, 358 MB on the copy). Its condition must stay the same as `get_valid_submissions()`. Index-only scan instead of 2 `BitmapAnd` + table reads: each submissions lookup 209-226 ms → 21-24 ms on form 1196. Benchmark: form 1196 -31 to -46% at the root, -53 to -71% for a region, form 1068 -7 to -21%. For production: create it with `AddIndexConcurrently` (no write lock on a ~10 GB table). | **Done** |
| 8  | Percentages computed in a single place | The database computes the counts and the percentages (`percentage_of_expected()` in `queries.py`: `numeric`, rounded half up to 1 decimal), used both to order the rows and as returned values. The serializers don't compute anything anymore: they return the `Decimal` values as is (`DecimalField(coerce_to_string=False)` in the schema, rendered as JSON numbers). Tests: `test_values_are_not_recomputed`, `test_percentages_are_rounded_half_up`, `test_percentages_are_json_numbers`. | **Done** |
| 9  | Stable pagination | `StableOrderingFilter` always ends the ordering with `id`. Tests + spec. | **Done** |
| 10 | CSV export | `export_csv` is a stub, its format is not decided. Response documented as the params serializer, `order` not documented, commented out in `test_permissions.py`, `setUp()` / `get_csv()` helpers to remove from `test_export_csv.py`. Should it include the totals? | **To do** |
| 11 | Grace period in the form settings | `Form.promptness_grace_period_days` exists (with its migration) but is not exposed by the form serializers. | **Done** |
| 12 | OpenAPI documentation | Params and responses documented for the list and the summary (`self.get_serializer()`). Export: see 10. | **Done** |
| 13 | Filters out of scope | `team_ids`, `user_ids`, `project_ids`, `planning_id`, `org_unit_group_id` (supported by the completeness stats). | Unchanged |
| 14 | Spec clean-up | Grace period, 400 examples, list / summary split, ordering ties. The open questions will have to be updated once 1-4 are decided. | **Done** |

## Small pending questions

- The summary accepts `org_unit_type_ids` and ignores it (documented in the spec): keep it this way?
- The database copy has never been vacuumed nor analyzed since its restore (statistics counters at 0, 79% of the
  pages of `iaso_instance` all-visible): `VACUUM (ANALYZE)` would make the plans more reliable (24,010 targets
  estimated instead of 10,459) and remove most of the 4,844 heap fetches of the index-only scans, but changes the
  state of the database.