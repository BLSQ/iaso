from django.db import connection
from django.test.utils import CaptureQueriesContext

from iaso.tests.api.v3.org_units.base import BASE_URL, OrgUnitV3TestCase


class OrgUnitV3QueryCountTestCase(OrgUnitV3TestCase):
    """Regression guards against N+1s. The counts are measured, not guessed, and don't depend on how many org
    units are returned - see `optimize_queryset` in `iaso/api/v3/common/dynamic_fields.py` for what each query
    is. Every request below starts with the account/hierarchy scoping query
    (`iaso_profile.org_units.exists()`)."""

    def assert_num_queries(self, expected, params=None, url=BASE_URL, streaming=False):
        with self.assertNumQueries(expected):
            response = self.client.get(url, params or {})
            if streaming:
                b"".join(response.streaming_content)  # the export queries run while streaming
        self.assertEqual(response.status_code, 200)

    def page_query(self, params):
        """The SQL of the page fetch itself - the only query ending in `LIMIT <page_size + 1>` (the `+ 1` tells
        `has_next` without a COUNT; the scoping `exists()` is a `LIMIT 1`)."""
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(BASE_URL, params)
        self.assertEqual(response.status_code, 200)
        page_queries = [q["sql"] for q in ctx.captured_queries if q["sql"].endswith(" LIMIT 101")]
        self.assertEqual(len(page_queries), 1, page_queries)
        return page_queries[0]

    # -- JSON --

    def test_list_default_fields(self):
        # scoping + page + `groups` prefetch
        self.assert_num_queries(3)

    def test_list_with_count(self):
        # + the COUNT(*)
        self.assert_num_queries(4, {"with_count": "true"})

    def test_list_with_ancestors(self):
        # scoping + page + one query for every ancestor (their ids come from each row's `path`)
        self.assert_num_queries(3, {"fields": "id,name,ancestors(id,name)"})

    def test_list_with_joined_relations(self):
        # scoping + page, with `org_unit_type`/`parent`/`creator`/`version(data_source)` joined into it
        self.assert_num_queries(2, {"fields": "id,org_unit_type,parent,creator,version(data_source)"})

    def test_retrieve(self):
        # scoping + the org unit + `groups` prefetch
        self.assert_num_queries(3, url=f"{BASE_URL}{self.region.id}/")

    def test_no_join_unless_a_relation_is_requested(self):
        # the account-scoping subquery (`filter_for_account`) uses `INNER JOIN`s in its own nested SELECT, fine
        self.assertNotIn("LEFT OUTER JOIN", self.page_query({}))
        self.assertNotIn("LEFT OUTER JOIN", self.page_query({"fields": "id,name,depth,org_unit_type_id"}))

    def test_requested_relation_is_joined_with_only_its_columns(self):
        page_query = self.page_query({"fields": "id,org_unit_type"})
        self.assertIn('LEFT OUTER JOIN "iaso_orgunittype"', page_query)
        self.assertIn('"iaso_orgunittype"."short_name"', page_query)
        self.assertNotIn('"iaso_orgunittype"."created_at"', page_query)
        self.assertNotIn('"iaso_orgunit"."name"', page_query)

    def test_only_requested_columns_are_loaded(self):
        page_query = self.page_query({"fields": "id,name"})
        for column in ("path", "location", "geom", "extra_fields"):
            with self.subTest(column=column):
                self.assertNotIn(f'"iaso_orgunit"."{column}"', page_query)

    # -- exports --

    def test_csv_default_fields(self):
        # scoping + distinct groups (one `group-<id>.*` column set each) + the streamed rows + the `groups`
        # prefetch - once per export chunk, never per row
        self.assert_num_queries(4, {"format": "csv"}, streaming=True)

    def test_csv_with_ancestors(self):
        # scoping + max depth (to size the `ancestors[i].*` columns) + the streamed rows + ancestors per chunk
        self.assert_num_queries(4, {"format": "csv", "fields": "id,name,ancestors(id,name)"}, streaming=True)

    def test_csv_only_loads_requested_columns(self):
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get(BASE_URL, {"format": "csv", "fields": "id,name"})
            b"".join(response.streaming_content)
        self.assertEqual(response.status_code, 200)
        # streamed through a server-side cursor: `DECLARE ... CURSOR ... FOR SELECT ...`
        (row_query,) = [q["sql"] for q in ctx.captured_queries if "CURSOR" in q["sql"]]
        for column in ("path", "location", "geom", "extra_fields"):
            with self.subTest(column=column):
                self.assertNotIn(f'"iaso_orgunit"."{column}"', row_query)
