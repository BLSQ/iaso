# Generated by Django 3.2.15 on 2023-04-19 12:27

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0199_data_migration_form_version_possible_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="JsonDataStore",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(unique=True)),
                ("content", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "account",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.account"
                    ),
                ),
            ],
            options={
                "unique_together": {("slug", "account")},
            },
        ),
    ]
