# Generated manually for ModelWithFile.md5

from django.db import migrations, models


class Migration(migrations.Migration):
    # Schema-only migration: runs in a transaction (default). The md5 backfill is
    # done in a separate, non-atomic data migration so a failure here rolls back cleanly.

    dependencies = [
        ("polio", "0254_remove_round_date_destruction_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="destructionreport",
            name="md5",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="incidentreport",
            name="md5",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="notificationimport",
            name="md5",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="outgoingstockmovement",
            name="md5",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="vaccineprealert",
            name="md5",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="vaccinerequestform",
            name="md5",
            field=models.CharField(blank=True, max_length=32),
        ),
    ]
