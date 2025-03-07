# Generated by Django 3.2.15 on 2023-03-17 11:01

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0196_storagepassword"),
    ]

    operations = [
        migrations.CreateModel(
            name="FormPredefinedFilter",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.TextField()),
                ("short_name", models.CharField(max_length=25)),
                ("json_logic", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "form",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="predefined_filters", to="iaso.form"
                    ),
                ),
            ],
        ),
    ]
