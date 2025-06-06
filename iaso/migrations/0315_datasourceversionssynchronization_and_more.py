# Generated by Django 4.2.18 on 2025-01-15 11:00

import django.db.models.deletion

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("iaso", "0314_task_created_by_task_iaso_task_account_72f14f_idx_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="DataSourceVersionsSynchronization",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "name",
                    models.CharField(
                        help_text="Used in the UI e.g. to filter Change Requests by Data Source Synchronization operations.",
                        max_length=255,
                    ),
                ),
                (
                    "json_diff",
                    models.JSONField(blank=True, help_text="The diff used to create change requests.", null=True),
                ),
                (
                    "diff_config",
                    models.TextField(
                        blank=True, help_text="A string representation of the parameters used for the diff."
                    ),
                ),
                (
                    "count_create",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="The number of change requests that will be generated to create an org unit.",
                    ),
                ),
                (
                    "count_update",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="The number of change requests that will be generated to update an org unit.",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("account", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.account")),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_data_source_synchronizations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "source_version_to_compare_with",
                    models.ForeignKey(
                        help_text="The version of the pyramid to use as a comparison.",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="synchronized_as_source_version_to_compare_with",
                        to="iaso.sourceversion",
                    ),
                ),
                (
                    "source_version_to_update",
                    models.ForeignKey(
                        help_text="The version of the pyramid for which we want to generate change requests.",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="synchronized_as_source_version_to_update",
                        to="iaso.sourceversion",
                    ),
                ),
                (
                    "sync_task",
                    models.OneToOneField(
                        blank=True,
                        help_text="The background task that used the diff to create change requests.",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to="iaso.task",
                    ),
                ),
            ],
            options={
                "verbose_name": "Data source synchronization",
            },
        ),
        migrations.AddField(
            model_name="orgunitchangerequest",
            name="data_source_synchronization",
            field=models.ForeignKey(
                blank=True,
                help_text="The data source synchronization that generated this change request.",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="change_requests",
                to="iaso.datasourceversionssynchronization",
            ),
        ),
    ]
