# Generated by Django 4.2.13 on 2024-06-26 08:41

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0286_entitytype_prevent_add_if_duplicate_found"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("polio", "0181_merge_20240625_0724"),
    ]

    operations = [
        migrations.CreateModel(
            name="Chronogram",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(blank=True, default=None, null=True),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_chronograms",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "round",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to="polio.round"),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_chronograms",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Chronogram",
            },
        ),
        migrations.CreateModel(
            name="ChronogramTemplateTask",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(blank=True, default=None, null=True),
                ),
                (
                    "period",
                    models.CharField(
                        choices=[
                            ("BEFORE", "Before"),
                            ("DURING", "During"),
                            ("AFTER", "After"),
                        ],
                        default="BEFORE",
                        max_length=15,
                    ),
                ),
                ("description", models.TextField(max_length=300)),
                ("start_offset_in_days", models.IntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "account",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.account"),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_chronogram_templates",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_chronogram_templates",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Chronogram Template Task",
            },
        ),
        migrations.CreateModel(
            name="ChronogramTask",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(blank=True, default=None, null=True),
                ),
                (
                    "period",
                    models.CharField(
                        choices=[
                            ("BEFORE", "Before"),
                            ("DURING", "During"),
                            ("AFTER", "After"),
                        ],
                        default="BEFORE",
                        max_length=15,
                    ),
                ),
                ("description", models.TextField(max_length=300)),
                ("start_offset_in_days", models.IntegerField(default=0)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("PENDING", "Pending"),
                            ("IN_PROGRESS", "In progress"),
                            ("DONE", "Done"),
                            ("N/A", "N/A"),
                        ],
                        default="PENDING",
                        max_length=15,
                    ),
                ),
                ("comment", models.TextField(blank=True, max_length=300)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "chronogram",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tasks",
                        to="polio.chronogram",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_chronogram_tasks",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_chronogram_tasks",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "user_in_charge",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="chronogram_tasks",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Chronogram Task",
            },
        ),
    ]