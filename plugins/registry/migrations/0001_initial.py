# Generated by Django 4.2.11 on 2024-07-18 12:02

import django.db.models.deletion

from django.db import migrations, models

import plugins.registry.models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("iaso", "0293_datasource_public"),
    ]

    operations = [
        migrations.CreateModel(
            name="PublicRegistryConfig",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("host", models.URLField(unique=True)),
                ("slug", models.SlugField(unique=True)),
                ("whitelist", models.JSONField(default=plugins.registry.models.get_default_whitelist)),
                ("app_id", models.CharField(blank=True, max_length=255, null=True)),
                ("account", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.account")),
                (
                    "data_source",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.datasource"
                    ),
                ),
                (
                    "root_orgunit",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.orgunit"
                    ),
                ),
                (
                    "source_version",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.sourceversion"
                    ),
                ),
            ],
        ),
    ]
