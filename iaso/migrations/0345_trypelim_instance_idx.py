"""Trypelim-specific indexes on the Instance model."""

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0344_merge_20250922_1243"),
    ]

    operations = [
        # Partial Btree index on the json field 'serie_id' attribute.
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS iaso_instance_json_serie_id_idx
                ON iaso_instance ((json->>'serie_id'))
                WHERE NOT ((json -> 'serie_id') IS NULL);
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS iaso_instance_json_serie_id_idx;
            """,
        ),
        # Btree index on the `file_name` field.
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS iaso_instance_file_name_idx
                ON iaso_instance (file_name);
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS iaso_instance_file_name_idx;
            """,
        ),
        # Btree index with UNIQUE constraint on the 'uuid' field.
        migrations.RunSQL(
            sql="""
                CREATE UNIQUE INDEX IF NOT EXISTS iaso_instance_uuid_uniq
                ON iaso_instance (uuid);
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS iaso_instance_uuid_uniq;
            """,
        ),
    ]
