"""Out-of-band index creation."""

import logging

from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.db import connection


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Create indexes that are too heavy for the regular migration process"

    def handle(self, *args, **options):
        self.stdout.write("Starting to apply indexes...")

        for index in INDEXES:
            index_name = index.name()
            self.stdout.write(f"Applying index: {index_name}...")

            old_autocommit = connection.get_autocommit()
            try:
                # Override django default behavior as CREATE INDEX CONCURRENTLY
                # cannot run inside a transaction.
                connection.set_autocommit(True)

                with connection.cursor() as cursor:
                    index.apply(cursor)

                self.stdout.write(self.style.SUCCESS(f"Successfully applied: {index_name}"))

            except Exception as e:
                error_msg = f"Error creating index {index_name}: {e}"
                self.stderr.write(self.style.ERROR(error_msg))
                logger.error(error_msg, exc_info=True)
                raise e

            finally:
                connection.set_autocommit(old_autocommit)

        self.stdout.write(self.style.SUCCESS("All indexes applied successfully."))


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


class InstanceFormIdUpdatedAtIndex:
    """
    Composite index on Instances to efficiently retrieve the latest Instance for each Form.

    refs: IA-4870
    """

    def name(self):
        return "iaso_instance_form_id_updated_at_composite"

    def apply(self, cursor):
        cursor.execute(f"CREATE INDEX CONCURRENTLY IF NOT EXISTS {self.name()} ON iaso_instance (form_id, updated_at);")

    def reverse(self, cursor):
        cursor.execute(f"DROP INDEX CONCURRENTLY IF EXISTS {self.name()};")


class EntityCreatedAtIndex:
    """Index on Entity `created_at` to enable efficient sorting on that field."""

    def name(self):
        return "iaso_entity_created_at"

    def apply(self, cursor):
        cursor.execute(f"CREATE INDEX CONCURRENTLY IF NOT EXISTS {self.name()} ON iaso_entity (created_at);")

    def reverse(self, cursor):
        cursor.execute(f"DROP INDEX CONCURRENTLY IF EXISTS {self.name()};")


INDEXES = [
    InstanceNormalUUIDIndex(),
    InstanceUniqueUUIDIndex(),
    OrgUnitUniqueUUIDIndex(),
    EntityUniqueUUIDIndex(),
    InstanceFormIdUpdatedAtIndex(),
    EntityCreatedAtIndex(),
]
