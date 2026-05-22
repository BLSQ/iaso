from django.db import migrations


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("iaso", "0338_metrictype_metricvalue"),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                # Index for filtering entities by type and deletion status.
                # This is tightly related to the `LevenshteinAlgorithm` SQL queries.
                "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entity_type_not_deleted "
                "ON iaso_entity(entity_type_id) WHERE deleted_at IS NULL;",
            ],
            reverse_sql=[
                "DROP INDEX CONCURRENTLY IF EXISTS idx_entity_type_not_deleted;",
            ],
        ),
    ]
