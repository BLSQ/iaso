# Generated by Django 4.2.11 on 2024-05-17 08:24

from django.db import migrations, models
import django.db.models.deletion
import plugins.polio.models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0279_merge_20240417_1319"),
        ("polio", "0178_subactivity"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="subactivity",
            name="org_units",
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
                        default=plugins.polio.models.make_group_round_scope,
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
