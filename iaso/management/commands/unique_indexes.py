from datetime import datetime, timedelta


class OrgUnitUniqueUUIDIndex:
    def name(self):
        return "iaso_orgunit_uuid_version_idx_unicity_newer"

    def apply(self, cursor):
        """Check for uuid duplicates and create the appropriate concurrent index.

        If duplicates exist, create the index only for new rows (created_at >= tomorrow).
        Otherwise create the full unique index.
        """

        check_sql = """
        SELECT EXISTS(
        SELECT 1
        FROM iaso_orgunit a
        JOIN iaso_orgunit b
            ON a.uuid = b.uuid
        AND a.id <> b.id
        WHERE a.uuid IS NOT NULL
        LIMIT 1
        );
        """
        cursor.execute(check_sql)
        has_dup = bool(cursor.fetchone()[0])

        if has_dup:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            sql = (
                "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS iaso_orgunit_uuid_version_idx_unicity_newer "
                "ON iaso_orgunit (uuid, version_id) "
                "WHERE uuid IS NOT NULL AND version_id IS NOT NULL AND created_at >= '%s';" % tomorrow
            )
        else:
            sql = (
                "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS iaso_orgunit_uuid_version_idx_unicity_newer "
                "ON iaso_orgunit (uuid, version_id) "
                "WHERE uuid IS NOT NULL AND version_id IS NOT NULL;"
            )

        cursor.execute(sql)

    def reverse(self, cursor):
        cursor.execute("DROP INDEX CONCURRENTLY IF EXISTS iaso_orgunit_uuid_version_idx_unicity_newer;")


class InstanceUniqueUUIDIndex:
    def name(self):
        return "iaso_instance_uuidx_unicity_newer"

    def apply(self, cursor):
        """Check for uuid duplicates and create the appropriate concurrent index.

        If duplicates exist, create the index only for new rows (created_at >= tomorrow).
        Otherwise create the full unique index.
        """

        check_sql = """
        SELECT EXISTS(
        SELECT 1
        FROM iaso_instance a
        JOIN iaso_instance b
            ON a.uuid = b.uuid
        AND a.id <> b.id
        WHERE a.uuid IS NOT NULL
        LIMIT 1
        );
        """
        cursor.execute(check_sql)
        has_dup = bool(cursor.fetchone()[0])

        if has_dup:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            sql = (
                "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS iaso_instance_uuidx_unicity_newer "
                "ON iaso_instance (uuid) "
                "WHERE uuid IS NOT NULL AND created_at >= '%s';" % tomorrow
            )
        else:
            sql = (
                "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS iaso_instance_uuidx_unicity_newer "
                "ON iaso_instance (uuid) "
                "WHERE uuid IS NOT NULL;"
            )

        cursor.execute(sql)

    def reverse(self, cursor):
        cursor.execute("DROP INDEX CONCURRENTLY IF EXISTS iaso_instance_uuidx_unicity_newer;")


class InstanceNormalUUIDIndex:
    def name(self):
        return "iaso_instance_uuid__idx"

    def apply(self, cursor):
        cursor.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS iaso_instance_uuid__idx ON iaso_instance (uuid);")

    def reverse(self, cursor):
        cursor.execute("DROP INDEX CONCURRENTLY IF EXISTS iaso_instance_uuid__idx;")


class EntityUniqueUUIDIndex:
    def name(self):
        return "iaso_entity_uuidx_unicity_newer"

    def apply(self, cursor):
        check_sql = """
        SELECT EXISTS(
            SELECT 1
            FROM iaso_entity a
            JOIN iaso_entity b
              ON a.uuid = b.uuid
             AND a.id <> b.id
            WHERE a.uuid IS NOT NULL
            LIMIT 1
        );
        """
        cursor.execute(check_sql)
        has_dup = bool(cursor.fetchone()[0])

        if has_dup:
            tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
            sql = (
                "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS iaso_entity_uuidx_unicity_newer "
                "ON iaso_entity (uuid) "
                "WHERE uuid IS NOT NULL "
                "AND created_at >= '%s';" % tomorrow
            )
        else:
            sql = (
                "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS iaso_entity_uuidx_unicity_newer "
                "ON iaso_entity (uuid) "
                "WHERE uuid IS NOT NULL "
            )

        cursor.execute(sql)

    def reverse(self, cursor):
        cursor.execute("DROP INDEX CONCURRENTLY IF EXISTS iaso_entity_uuidx_unicity_newer;")


INDEXES = [
    InstanceNormalUUIDIndex(),
    InstanceUniqueUUIDIndex(),
    OrgUnitUniqueUUIDIndex(),
    EntityUniqueUUIDIndex(),
]
