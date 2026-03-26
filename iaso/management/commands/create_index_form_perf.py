"""
Management command to create an index outside of the regular deployment/migration process.

Once it has been created, this file can be deleted and moved to a standard django migration.

refs: IA-4870
"""

import time

from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = "Create a composite index on iaso_instance for form_id and updated_at."

    def handle(self, *args, **options):
        name = "iaso_instance_form_id_updated_at_composite"
        sql = f"""
            CREATE INDEX CONCURRENTLY IF NOT EXISTS {name}
            ON iaso_instance (form_id, updated_at);
        """

        self.stdout.write(f"Starting concurrent index creation for: {name}")

        start_time = time.time()

        try:
            with connection.cursor() as cursor:
                cursor.execute(sql)

            elapsed = time.time() - start_time
            self.stdout.write(self.style.SUCCESS(f"Successfully created index in {elapsed:.2f} seconds."))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to create index: {str(e)}"))
