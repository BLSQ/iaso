import re

from django.core.management import call_command
from django.db import connection
from django.test.utils import CaptureQueriesContext

import iaso.management.commands.unique_indexes as indexes

from iaso.tests.utils_parquet import BaseAPITransactionTestCase


def normalize_sql(sql: str) -> str:
    return re.sub(r"\s+", " ", sql.replace("\n", " ").replace("\r", " ")).strip()


def index_exists_pg(index_full_name: str) -> bool:
    # index_full_name: "schema.index_name" (e.g. "public.iaso_instance_uuid__idx")
    with connection.cursor() as c:
        c.execute("SELECT to_regclass(%s);", [index_full_name])
        return c.fetchone()[0] is not None


class IndexesAPITestCase(BaseAPITransactionTestCase):
    def test_unique_indexes_command_runs(self):
        """unique_indexes command runs without error"""
        with CaptureQueriesContext(connection) as ctx:
            call_command("unique_indexes")
        expected_queries = [
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS iaso_instance_uuid__idx ON iaso_instance (uuid);",
            "SELECT EXISTS( SELECT 1 FROM iaso_orgunit a JOIN iaso_orgunit b ON a.uuid = b.uuid AND a.id <> b.id WHERE a.uuid IS NOT NULL LIMIT 1 );",
            "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS iaso_orgunit_uuid_version_idx_unicity_newer ON iaso_orgunit (uuid, version_id) WHERE uuid IS NOT NULL AND version_id IS NOT NULL;",
            "SELECT EXISTS( SELECT 1 FROM iaso_instance a JOIN iaso_instance b ON a.uuid = b.uuid AND a.id <> b.id WHERE a.uuid IS NOT NULL LIMIT 1 );",
            "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS iaso_instance_uuidx_unicity_newer ON iaso_instance (uuid) WHERE uuid IS NOT NULL;",
            "SELECT EXISTS( SELECT 1 FROM iaso_entity a JOIN iaso_entity b ON a.uuid = b.uuid AND a.id <> b.id WHERE a.uuid IS NOT NULL LIMIT 1 );",
            "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS iaso_entity_uuidx_unicity_newer ON iaso_entity (uuid) WHERE uuid IS NOT NULL",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS iaso_instance_form_id_updated_at_composite ON iaso_instance (form_id, updated_at);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS iaso_entity_created_at ON iaso_entity (created_at);",
        ]

        self.assert_queries(ctx.captured_queries, expected_queries)
        for index in indexes.INDEXES:
            assert index_exists_pg("public." + index.name())

        # idempotency check
        with CaptureQueriesContext(connection) as ctx_second_run:
            call_command("unique_indexes")

        self.assert_queries(ctx_second_run.captured_queries, expected_queries)

        def clean_up_indexes():
            with connection.cursor() as cursor:
                for index in indexes.INDEXES:
                    index.reverse(cursor)

        self.addCleanup(clean_up_indexes)  # necessary to avoid contaminating the test suite

    def assert_queries(self, captured_queries, expected_queries):
        for q in captured_queries:
            normalized_sql = normalize_sql(q["sql"])

            self.assertTrue(
                normalized_sql in expected_queries,
                "Error\n"
                + normalized_sql
                + "\n not in expected queries, expected: \n"
                + str("\n".join(expected_queries)),
            )
