# Generated by Django 4.2.11 on 2024-05-21 08:39

import django.db.models.deletion

from django.db import migrations, models

import plugins.polio.models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0279_merge_20240417_1319"),
        ("polio", "0177_migrate_budget_data"),
    ]

    operations = [
        migrations.CreateModel(
            name="SubActivity",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=255)),
                (
                    "age_unit",
                    models.CharField(blank=True, choices=[("m", "Months"), ("y", "Years")], max_length=3, null=True),
                ),
                ("age_min", models.IntegerField(blank=True, null=True)),
                ("age_max", models.IntegerField(blank=True, null=True)),
                ("start_date", models.DateField(blank=True, null=True)),
                ("end_date", models.DateField(blank=True, null=True)),
                (
                    "round",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="sub_activities", to="polio.round"
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "subactivities",
            },
        ),
        migrations.CreateModel(
            name="SubActivityScope",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "vaccine",
                    models.CharField(
                        blank=True, choices=[("mOPV2", "mOPV2"), ("nOPV2", "nOPV2"), ("bOPV", "bOPV")], max_length=5
                    ),
                ),
                (
                    "group",
                    models.OneToOneField(
                        default=plugins.polio.models.make_group_subactivity_scope,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="subactivityScope",
                        to="iaso.group",
                    ),
                ),
                (
                    "subactivity",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="scopes", to="polio.subactivity"
                    ),
                ),
            ],
        ),
    ]
