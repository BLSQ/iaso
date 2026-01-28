import re

from django.db import connection
from django.test.utils import CaptureQueriesContext

import iaso.management.commands.unique_indexes as unique_indexes

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
            with connection.cursor() as cursor:
                for index in unique_indexes.INDEXES:
                    index.apply(cursor)

        expected_queries = [
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS iaso_instance_uuid__idx ON iaso_instance (uuid);",
            "SELECT EXISTS( SELECT 1 FROM iaso_orgunit a JOIN iaso_orgunit b ON a.uuid = b.uuid AND a.id <> b.id WHERE a.uuid IS NOT NULL LIMIT 1 );",
            "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS iaso_orgunit_uuid_version_idx_unicity_newer ON iaso_orgunit (uuid, version_id) WHERE uuid IS NOT NULL AND version_id IS NOT NULL;",
            "SELECT EXISTS( SELECT 1 FROM iaso_instance a JOIN iaso_instance b ON a.uuid = b.uuid AND a.id <> b.id WHERE a.uuid IS NOT NULL LIMIT 1 );",
            "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS iaso_instance_uuidx_unicity_newer ON iaso_instance (uuid) WHERE uuid IS NOT NULL;",
            "SELECT EXISTS( SELECT 1 FROM iaso_entity a JOIN iaso_entity b ON a.uuid = b.uuid AND a.id <> b.id WHERE a.uuid IS NOT NULL LIMIT 1 );",
            "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS iaso_entity_uuidx_unicity_newer ON iaso_entity (uuid) WHERE uuid IS NOT NULL",
        ]

        self.assert_queries(connection, expected_queries)
        connection.queries.clear()

        for index in unique_indexes.INDEXES:
            assert index_exists_pg("public." + index.name())

        with CaptureQueriesContext(connection) as ctx:
            with connection.cursor() as cursor:
                for index in unique_indexes.INDEXES:
                    index.apply(cursor)

        self.assert_queries(connection, expected_queries)

    def assert_queries(self, connection, expected_queries):
        for q in connection.queries:
            normalized_sql = normalize_sql(q["sql"])

            self.assertTrue(
                normalized_sql in expected_queries,
                "Error\n"
                + normalized_sql
                + "\n not in expected queries, epxected: \n"
                + str("\n".join(expected_queries)),
            )
