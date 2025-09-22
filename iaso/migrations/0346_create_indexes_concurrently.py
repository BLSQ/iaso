from django.db import migrations, models


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("iaso", "0345_fuzzy_extension"),
    ]

    operations = [
        # Up the memory to improve performance
        migrations.RunSQL(
            sql="SET work_mem = '1GB';",
            reverse_sql=migrations.RunSQL.noop,
        ),
        migrations.RunSQL(
            sql=["CREATE INDEX IF NOT EXISTS iaso_instan_created_04174a_idx ON iaso_instance (created_at)"],
            reverse_sql=["DROP INDEX iaso_instan_created_04174a_idx"],
            state_operations=[
                migrations.AddIndex(
                    model_name="instance",
                    index=models.Index(fields=["created_at"], name="iaso_instan_created_04174a_idx"),
                ),
            ],
        ),
        migrations.RunSQL(
            sql=["CREATE INDEX IF NOT EXISTS iaso_instan_updated_1d2d65_idx ON iaso_instance (updated_at)"],
            reverse_sql=["DROP INDEX iaso_instan_updated_1d2d65_idx"],
            state_operations=[
                migrations.AddIndex(
                    model_name="instance",
                    index=models.Index(fields=["updated_at"], name="iaso_instan_updated_1d2d65_idx"),
                ),
            ],
        ),
        migrations.RunSQL(
            sql=["CREATE INDEX IF NOT EXISTS iaso_instan_source__8a77f6_idx ON iaso_instance (source_created_at)"],
            reverse_sql=["DROP INDEX iaso_instan_source__8a77f6_idx"],
            state_operations=[
                migrations.AddIndex(
                    model_name="instance",
                    index=models.Index(fields=["source_created_at"], name="iaso_instan_source__8a77f6_idx"),
                ),
            ],
        ),
        migrations.RunSQL(
            sql=["CREATE INDEX IF NOT EXISTS iaso_instan_source__da894d_idx ON iaso_instance (source_updated_at)"],
            reverse_sql=["DROP INDEX iaso_instan_source__da894d_idx"],
            state_operations=[
                migrations.AddIndex(
                    model_name="instance",
                    index=models.Index(fields=["source_updated_at"], name="iaso_instan_source__da894d_idx"),
                ),
            ],
        ),
        migrations.RunSQL(
            sql=["CREATE INDEX IF NOT EXISTS iaso_orguni_created_51218f_idx ON iaso_orgunit (created_at)"],
            reverse_sql=["DROP INDEX iaso_orguni_created_51218f_idx"],
            state_operations=[
                migrations.AddIndex(
                    model_name="orgunit",
                    index=models.Index(fields=["created_at"], name="iaso_orguni_created_51218f_idx"),
                ),
            ],
        ),
        migrations.RunSQL(
            sql=["CREATE INDEX IF NOT EXISTS iaso_orguni_updated_8eca3a_idx ON iaso_orgunit (updated_at)"],
            reverse_sql=["DROP INDEX iaso_orguni_updated_8eca3a_idx"],
            state_operations=[
                migrations.AddIndex(
                    model_name="orgunit",
                    index=models.Index(fields=["updated_at"], name="iaso_orguni_updated_8eca3a_idx"),
                ),
            ],
        ),
        migrations.RunSQL(
            sql=["CREATE INDEX IF NOT EXISTS iaso_orguni_source__c29c2f_idx ON iaso_orgunit (source_created_at)"],
            reverse_sql=["DROP INDEX iaso_orguni_source__c29c2f_idx"],
            state_operations=[
                migrations.AddIndex(
                    model_name="orgunit",
                    index=models.Index(fields=["source_created_at"], name="iaso_orguni_source__c29c2f_idx"),
                ),
            ],
        ),
    ]
