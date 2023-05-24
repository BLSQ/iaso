# Generated by Django 2.0 on 2018-12-07 11:05

from django.conf import settings
import django.contrib.postgres.fields
import django.contrib.postgres.fields.citext
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="Catch",
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
                ("operation", models.TextField(null=True)),
                ("setup_date", models.DateTimeField(null=True)),
                ("collect_date", models.DateTimeField(null=True)),
                ("in_out", models.TextField(null=True)),
                ("male_count", models.IntegerField(default=0, null=True)),
                ("female_count", models.IntegerField(default=0, null=True)),
                ("unknown_count", models.IntegerField(default=0, null=True)),
                ("remarks", models.TextField(default="")),
                (
                    "distance_to_targets",
                    models.DecimalField(decimal_places=3, max_digits=10, null=True),
                ),
                ("near_intervention", models.CharField(max_length=100)),
                ("elev_change", models.IntegerField(null=True)),
                ("trap_elev", models.IntegerField(null=True)),
                ("target_elev", models.IntegerField(null=True)),
                ("elev_diff", models.IntegerField(null=True)),
                ("uuid", models.TextField(default=uuid.uuid4, unique=True)),
                (
                    "source",
                    models.TextField(
                        choices=[("excel", "Excel"), ("API", "API")],
                        default="excel",
                        null=True,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="GpsImport",
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
                ("filename", models.TextField()),
                ("file_date_time", models.DateTimeField(null=True)),
                ("creator", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="GpsWaypoint",
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
                ("name", models.TextField()),
                ("date_time", models.DateTimeField()),
                (
                    "latitude",
                    models.DecimalField(decimal_places=6, max_digits=10, null=True),
                ),
                (
                    "longitude",
                    models.DecimalField(decimal_places=6, max_digits=10, null=True),
                ),
                (
                    "elevation",
                    models.DecimalField(decimal_places=2, max_digits=7, null=True),
                ),
                (
                    "tags",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=django.contrib.postgres.fields.citext.CITextField(blank=True, max_length=255),
                        blank=True,
                        null=True,
                        size=20,
                    ),
                ),
                ("ignore", models.BooleanField(default=False)),
                (
                    "gps_import",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="vector_control.GpsImport",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Site",
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
                ("name", models.CharField(max_length=50, null=True)),
                ("zone", models.TextField(null=True)),
                (
                    "latitude",
                    models.DecimalField(decimal_places=6, max_digits=10, null=True),
                ),
                (
                    "longitude",
                    models.DecimalField(decimal_places=6, max_digits=10, null=True),
                ),
                (
                    "altitude",
                    models.DecimalField(decimal_places=2, max_digits=7, null=True),
                ),
                (
                    "accuracy",
                    models.DecimalField(decimal_places=2, max_digits=7, null=True),
                ),
                ("habitat", models.CharField(max_length=255, null=True)),
                ("description", models.CharField(max_length=255, null=True)),
                ("first_survey", models.CharField(max_length=255, null=True)),
                ("first_survey_date", models.DateTimeField(null=True)),
                ("count", models.IntegerField()),
                ("total", models.IntegerField()),
                ("uuid", models.TextField(default=uuid.uuid4, unique=True)),
                (
                    "source",
                    models.TextField(
                        choices=[("excel", "Excel"), ("API", "API")],
                        default="excel",
                        null=True,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Target",
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
                ("name", models.TextField(null=True)),
                ("deployment", models.IntegerField(null=True)),
                ("full_name", models.TextField(null=True)),
                ("gps", models.CharField(max_length=100)),
                (
                    "latitude",
                    models.DecimalField(decimal_places=6, max_digits=10, null=True),
                ),
                (
                    "longitude",
                    models.DecimalField(decimal_places=6, max_digits=10, null=True),
                ),
                (
                    "altitude",
                    models.DecimalField(decimal_places=2, max_digits=7, null=True),
                ),
                ("date_time", models.DateTimeField(null=True)),
                ("river", models.TextField(null=True)),
            ],
        ),
        migrations.AddField(
            model_name="catch",
            name="site",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="vector_control.Site"),
        ),
        migrations.AddField(
            model_name="catch",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
