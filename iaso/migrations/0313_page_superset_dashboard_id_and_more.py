# Generated by Django 4.2.16 on 2024-12-06 13:26

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0312_merge_20241206_1243"),
    ]

    operations = [
        migrations.AddField(
            model_name="page",
            name="superset_dashboard_id",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="page",
            name="superset_dashboard_ui_config",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
