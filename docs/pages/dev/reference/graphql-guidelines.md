# GraphQL API: decisions and guidelines

Code: `iaso/graphql/`. Endpoint: `POST /api/graphql/`. Reference: `/api/graphql/docs/`. Playground: `GET /api/graphql/`.

## Decisions

### GraphQL is the default API

- New API work goes to GraphQL: new models, new fields, new screens, new integrations.
- Why: clients select exactly the fields they need, in one request. No `?fields=` conventions, no N endpoints per
  screen, no per-client serializers.
- REST is frozen: bug fixes and security only, no new endpoints or fields. A REST endpoint is removed once nothing
  calls it (check the access logs).
- REST stays for what isn't a JSON API:
  - file downloads and exports (CSV, XLSX, GPKG);
  - the mobile app's sync endpoints (`/api/mobile/...`), until the app moves;
  - endpoints third parties are bound to (DHIS2, FHIR, webhooks).
- Supersedes [ADR 0000](../../../decisions/0000-use-one-api-endpoint-per-operation.md) (one endpoint per
  operation). Its goal (no single point of failure) is kept by:
  - one root field per use case (`orgUnits`, `submissions`, `bulkUpdateOrgUnits`...), each with its own code;
  - per-operation limits and monitoring (below), so one heavy operation can't hide behind the shared URL.

### Business logic lives below both APIs

- Scoping (`filter_for_user`), permissions, validation, and audit logs live in models, managers, and services.
- REST views and GraphQL resolvers only call them: GraphQL never reads a REST view or serializer.
- Moving logic out of a REST view is part of exposing it in GraphQL.

### One schema, no versions

- No `/v2`: the schema evolves.
- Additive changes are free: new types, new fields, new optional arguments, new enum values.
- Removing or renaming takes two steps:
  1. add the replacement and mark the old field `@deprecated(reason: "Use ...")`;
  2. remove it once the logs show no operation still selecting it (at least one release later).
- Breaking changes are caught in review: the schema diff is in the `.graphql` files.
- Clients must accept unknown enum values.

### Library: Ariadne, schema-first

- The `.graphql` files are the contract; Python only binds resolvers. Reviewers read the API diff in SDL.
- Strawberry was tried first (POC branch `poc/strawberry-orgunits`): code-first and Python 3.9 pins made it harder
  to keep the API stable and readable.
- `ariadne==0.26.2`: the last version supporting Python 3.9.

### One package per model

- `iaso/graphql/<model>/`: `schema.graphql`, `resolvers.py`, `filters.py`, `selection.py`, `types.py`,
  `mutations.py` (only the ones needed).
- Shared: `common.graphql` (`Query`, `Mutation`, scalars, `Project`, `UserSummary`), `errors.graphql`, `common.py`.
- Each package's `schema.graphql` becomes a section of the reference, automatically.

### No cycles, no unbounded nesting

- Types under a relation are `...Summary` types without relations: `parent: OrgUnitSummary`,
  `createdBy: UserSummary`, `orgUnitTypes: [OrgUnitTypeSummary!]!`.
- No unbounded list under a list: an `OrgUnit` has no `submissions`. Use the other root field with a filter
  (`submissions(filters: {orgUnitId: ...})`).
- Counts: `totalCount` on the other list, not a count per row (`orgUnits(filters: {groupId: ...}) { totalCount }`).

### Loading: one query per page, plus one per list

- `selection.py` turns the GraphQL selection into `only()`, `select_related()`, `prefetch_related()`, annotations.
- Only the selected columns are read. A to-one relation is joined; each list is one query for the whole page.
- No query per row, ever.
- Everything a page needs is decided in one function, `load_selected(queryset, fields)`, before the query runs.
  Resolvers never decide what to load.

### `only()`: how to use it

- Always `only()`, never a bare queryset: a wide table (`iaso_instance.json`, `iaso_orgunit.geom`) is read
  only when selected.
- The selection maps to columns through a dict per type, `GraphQL field -> column` (`ORG_UNIT_COLUMNS`,
  `SUMMARY_COLUMNS`...), with `common.columns(fields, COLUMNS, prefix)`. `id` is always loaded.
- The trap: a column read but not in `only()` is a *deferred field*. Django fetches it silently, **one query per
  row**. Tests catch it, reviews don't.
- To-one relation: `select_related("parent")` and in `only()` the foreign key **and** the related columns:
  `["parent", *columns(fields["parent"], SUMMARY_COLUMNS, "parent__")]`. Without the foreign key, Django refuses
  the query.
- To-many relation: `Prefetch("groups", queryset=Group.objects.only("id", ...).order_by("id"))`. A reverse
  foreign key also needs the foreign key back to the parent in that `only()`, or each row is fetched again.
- Computed values: an annotation (`annotate(submission_count=...)`, `AsGeoJSON("geom")`), never a Python
  property that queries. Geometries come out as GeoJSON from PostgreSQL: never loaded nor parsed by GEOS.
- Nested lists with no relation to prefetch (`ancestors`): a JSON subquery annotation (`AncestorsJson`).
- Shared building blocks: a model used under several types exposes its columns (`SOURCE_VERSION_COLUMNS`,
  `DATA_SOURCE_SUMMARY_COLUMNS`) from its own package's `selection.py`.
- Counting and paging: `page()` adds the order and `limit + 1`; `totalCount` is a separate `COUNT(*)` on the
  filtered queryset, without the `only()`, joins or annotations.

### Filters: flat inputs

- `<Model>Filter`: one field per filter, all AND-ed, each used at most once. No `AND`/`OR`/`NOT`, no arbitrary lookups.
- Many-to-many filters are `EXISTS` subqueries, not joins: no duplicate rows, no `DISTINCT`.
- `...In` lists: at most 1,000 values.

### Pagination: `limit`/`offset` pages

- `<Model>Page { items, hasNextPage, totalCount }`.
- `hasNextPage` fetches one extra row; `totalCount` runs a `COUNT(*)` only when selected.
- `order: [<Model>Order!]`; `id` is always appended so that pages stay stable.

### Limits, enforced before running

| Limit | Value |
|---|---|
| Document size | 2,000 tokens |
| Root fields per operation | 10 |
| Lists of each kind per operation | 1 (`orgUnits`, `submissions`, `bulkUpdateOrgUnits`...) |
| Aliases | root fields only |
| Page size | 1,000 or 10,000 per list; lower when costly fields are selected (`FIELD_LIMITS`: geometries, counts, nested lists) |
| SQL statement | 10 s (`SET LOCAL statement_timeout`) |

### Security

- Authentication: same DRF classes as REST (session, JWT).
- Visibility: same scopes and permissions as the web app. Reuse the shared querysets and policies
  (`filter_for_user`, `ManagedUsersPolicy`...); don't rewrite them.
- An object the user can't see doesn't exist: `null`, or `NOT_FOUND` in a mutation. Never "forbidden".
- CSRF: JSON bodies only. Multipart (uploads) needs a `GraphQL-Preflight` header.
- One request is one transaction.

### Mutations: payloads with errors as data

- Each mutation returns `<Thing>Payload { <thing>, errors: [<Thing>Error!]! }`.
- `errors` lists every problem found in the input, as a form does. Nothing is saved when there is any (the
  `@payload` savepoint).
- Error types implement `InputError { message, field, question }` and add a `code` from their own enum
  (`FormVersionErrorCode`...).
- Codes are coarse: `NOT_FOUND`, `INVALID`, `INVALID_XLSFORM`, `NOT_EDITABLE`, `UNCONFIRMED_CHANGES`. The `message`
  says why; `field` and `question` say where.
- Top-level GraphQL errors are only for what isn't about the input: `UNAUTHENTICATED`, `FORBIDDEN`, `QUERY_TIMEOUT`,
  `SERVICE_UNAVAILABLE`, malformed operations.
- Changes with consequences (`createFormVersion` warnings) return `warnings`, and are refused with
  `UNCONFIRMED_CHANGES` unless `force: true`.
- Several mutations in one operation run in order, each in its own savepoint: a refused one doesn't undo the others.

### Long work: tasks

- A mutation that can't finish within a request (`bulkUpdateOrgUnits`) queues a `Task` and returns it.
- Clients follow it with `task(id)` and `taskLogs(taskId, afterId)`.
- A task's own refusals are `Task.errors`, the same `InputError` shape.
- Filters are stored as GraphQL input and applied when the task runs.

### Files: GraphQL multipart

- `Upload` scalar, multipart request spec, `GraphQL-Preflight` header.
- Only as a mutation argument.

### Submission edits: odk_cli

- Answers are edited by JavaRosa, through `odk_cli` (native binary, `ODK_CLI_PATH`): the same engine as the mobile app.
- JavaRosa is pinned to the mobile app's version.
- The binary is downloaded at image build: URL and checksum pinned in `docker/django/Dockerfile` and
  `docker/prod/Dockerfile`.

### Vocabulary

- API names follow the UI, not the models: `Submission`, not `Instance`.
- No v1/v3/REST references in descriptions: GraphQL users may never see REST.

## Guidelines

### Adding a field

- Declare it in the `.graphql` file, with a description.
- Add its column to the type's `COLUMNS` map in `selection.py`, or an annotation if computed.
- A resolver in `types.py` only if it isn't a plain attribute. Resolvers read what was loaded; they never query.
- Costly field (geometry, count, JSON, list): add it to `FIELD_LIMITS` to lower the page size cap.
- Add it to the "no query per row" test's selection, and adjust the `assertLessEqualQueryCount` bounds if it adds
  a query (a list): with a comment saying which.

### Adding a list query

- `<model>s(filters, order, limit, offset): <Model>Page!` and `<model>(id): <Model>` (`null` if not visible).
- Scope: the model's shared queryset and permissions; `FORBIDDEN` without the read permission.
- Add the root field to `ROOT_FIELD_LIMITS`.
- Use `common.page()`, `check_page()`, `ordering()`.

### Adding a mutation

- `<verb><Thing>(...): <Thing>Payload!`; a `<Thing>Error` type with its `<Thing>ErrorCode` enum.
- `@payload("<result_field_in_snake_case>")`. Collect every problem with `Errors`, then `raise_if_any()`.
- Missing permission: a top-level `FORBIDDEN`. Problems with the input: `errors`.
- Checks and audit log (`log_modification`) in a shared service, used by any REST endpoint doing the same.
- Add the mutation's module and its enum to `CODE_ENUMS` in `test_errors.py`.

### Descriptions

- Every type, field and argument visible to clients gets a description: it is the documentation.
- Say what it is, its limits, and its errors. Not how it's implemented.
- Developer notes are `#` comments: they stay out of the reference.
- Realistic examples in `iaso/graphql/docs/examples.mjs`; the build fails on an example for a missing field.

### Naming

- Types: `PascalCase` nouns. Fields and arguments: `camelCase`. Enum values: `UPPER_CASE`.
- Ids: `<thing>Id` (`orgUnitTypeId`); lists of ids: `<thing>IdIn` in filters, `<thing>Ids` in inputs.
- Filters mirror Django lookups: `nameIContains`, `createdAtGte`, `idIn`.

### Tests (`iaso/tests/graphql/`)

- Inherit `GraphQLTestCase`: `items("orgUnits", ...)`, `row("orgUnit", id, ...)`, `query`, `error(..., code=)`.
- Data: `health_account()` and health vocabulary (Ministry of Health, Kanda, North Region...). No fiction.
- For each query, test:
  - scope (another account's data is invisible);
  - permissions;
  - each filter and ordering;
  - query counts (below).
- Mutations: every error code, nothing saved on refusal, the audit log.

### Query counts in tests (`QueryProfiler`)

- Never `assertNumQueries(7)`: a bare number says nothing about which query was added, and breaks for unrelated
  reasons. Count **per table** with `QueryProfiler` (`iaso/tests/utils/query_profiler.py`).
- `self.profiled(run)` runs the request twice and profiles the second: the first loads what a request loads once
  per user (permissions, project restrictions), which depends on the tests before it.
- Two assertions per list query:

```python
def test_fields_and_relations(self):
    profiler, users = self.profiled(lambda: self.users("username projects { name } orgUnits { name }"))
    ...
    with profiler.report_on_failure():
        # `auth_user`: the users, their profile joined
        profiler.assertLessEqualQueryCount({"auth_user": 1, "iaso_project": 1, "iaso_orgunit": 1})

def test_no_query_per_user(self):
    selection = "username projects { name } orgUnits { name }"
    before, _ = self.profiled(lambda: self.users(selection))
    self.create_user_with_profile(username="data_manager", ...)  # more rows, same selection
    after, _ = self.profiled(lambda: self.users(selection))
    after.assertSameQueryCounts(before)
```

- `assertLessEqualQueryCount`: an upper bound per table, **and** fails on any table not listed. A new query
  pattern can't sneak in on a table nobody bounded. `exclude=[...]` only for known, irrelevant tables.
- `assertSameQueryCounts`: the same request on more rows runs the same queries: no N+1, wherever it hides
  (deferred field, missing prefetch, a resolver querying).
- Comment each bound with what the query is (``# `versions` (`defaultVersion` joined)``): the number alone doesn't
  explain itself.
- Select **every** field of the type in the "no query per row" test: a field left out is a field not checked.
- On failure, `report_on_failure()` prints each table's SQL and call sites (`file:line`); add
  `QueryProfiler(trace_tables=["iaso_orgunit"])` to trace where a query comes from.
- Use it for other N+1 hunts too (REST endpoints, tasks): it's not GraphQL-specific.

### Monitoring

- Every operation logs `graphql.start` and `graphql.end` (JSON, logger `iaso.graphql.operations`): operation name,
  root fields, argument names, user, account, duration, SQL count and time, error codes.
- Values are never logged.
- Name your operations (`query OrgUnitsForMap { ... }`): unnamed ones are only identified by their root fields.
- Slower than `GRAPHQL_SLOW_MS` (2 s): a `WARNING` with the query text.

### Documentation

- Build: `npm run graphql-docs` (SpectaQL, from the `.graphql` files). The prod image builds it.
- Section order and titles: `iaso/graphql/docs/theme/data/index.mjs`.

## Good practices

The items marked *(to add)* are not in place yet.

### Testing beyond unit tests

- **Fuzzing with [Schemathesis](https://schemathesis.readthedocs.io/)** *(to add)*: it generates queries and mutations
  from the schema and fails on any crash.
  - Run it in CI against `docker compose`, with a seeded health account and a token:
    `uvx schemathesis run http://localhost:8081/api/graphql/ -H "Authorization: Bearer $TOKEN"`.
  - Expected outcome: no `500`, and no error without an `extensions.code`. A refused query (limits, validation) is a
    pass.
  - Mutations: only against a throwaway database.
- **Query counts per field** (in place): every list query has an `assertSameQueryCounts` test across page sizes.
- **Real queries as tests** *(to add)*: run the frontend's operations and the examples (`examples.mjs`) against the
  schema in CI. Today the examples are only checked when the docs are built.
- **Production-sized data**: before merging a new root field or filter, run it on a copy of a large account and read
  its `EXPLAIN`. Missing index = add it in the same PR.

### Schema changes

- **Breaking-change check** *(to add)*: commit `schema.graphql` (the printed full schema) and diff it in CI with
  [graphql-inspector](https://the-guild.dev/graphql/inspector) `diff`. A removed field, argument or type, or one
  made non-null, fails without a `breaking-change` label.
- **Schema lint** *(to add)*: [graphql-eslint](https://the-guild.dev/graphql/eslint) on the `.graphql` files for
  descriptions, naming, and `@deprecated` reasons.
- **Deprecation tracking**: the operation logs list selected fields; check them before removing a deprecated one.

### Schema design

- Nullable by default for fields that can be missing or hidden; `!` only when it's guaranteed forever. A wrong
  `!` turns one bad row into a failed page.
- Lists are `[X!]!`: never `null`, never a `null` item.
- Mutation arguments: a few scalars, or an input type for a group of values (`OrgUnitBulkUpdate`). New arguments
  and input fields are optional, or it's a breaking change.
- Enums for closed sets (`ValidationStatus`), never free strings.
- Dates are `Date` or `DateTime` (ISO 8601, with an offset); geometries are GeoJSON in `JSON`. No timestamps as
  numbers, no free-form date strings.
- One way to do each thing: no two fields returning the same data.
- Same schema for every account: modules and permissions gate the data (`FORBIDDEN`, empty lists), not the types.
- No secrets in the schema (passwords, tokens, API keys), not even for admins. Personal data (email, phone) only
  behind the permission the web app requires to see it.
- Every list has a deterministic order (`id` last), and every order is backed by an index on large tables.

### Errors

- Clients branch on `code`, never on `message`: codes are the contract, messages may be reworded or translated.
- Unexpected exceptions are logged and returned as `INTERNAL_SERVER_ERROR` with a generic message: never an
  exception's text (an SQL error can quote data).
- A failed field doesn't fail the operation: the rest of `data` comes back, with an error at the field's `path`.
  Clients must check `errors` even with `data`.
- The HTTP status is `200` for every executed operation, errors included; `400` only when it can't run. Monitor
  error codes from the operation logs, not from HTTP statuses.

### Clients

- Name every operation (`query OrgUnitsForMap`): it's how logs, slow-query warnings and deprecation checks find it.
- Pass values as variables, never string interpolation: no injection, and the query text stays the same.
- Fragments per component; select only what the screen shows.
- Frontend types generated from the schema with
  [graphql-codegen](https://the-guild.dev/graphql/codegen) *(to add)*, not written by hand.
- Page through large lists; never raise `limit` to fetch everything. For "everything", use an export or a task.
- Group what a screen needs in one operation (up to 10 root fields) instead of one request per widget.
- Don't retry mutations automatically: they aren't idempotent. Retry queries and `QUERY_TIMEOUT` only after
  narrowing them.
- After a task-based mutation, poll `task(id)` with a backoff (a few seconds), not in a tight loop.

### Operations

- Introspection stays on for authenticated users: it is the documentation. Anonymous requests are refused,
  introspection included.
- Persisted queries / allow-list *(to add, when needed)*: production clients send a hash instead of the text; only
  known operations run. Third-party clients keep free queries, within the limits.
- Rate limiting per user *(to add, when needed)*: the operation logs give the cost (duration, SQL time) to base it on.
- Alerts on the operation logs: `graphql.end` with `QUERY_TIMEOUT` or `INTERNAL_SERVER_ERROR`, and the slow-query
  warnings.
- No HTTP caching: operations are `POST`s, and data depends on the user. Cache in the client (Apollo / urql cache by
  `id`), not in a proxy.
