# Generated by Django 3.2.13 on 2022-05-19 12:03

import django.db.models.deletion

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("iaso", "0138_merge_0134_team_0137_merge_20220516_0832"),
    ]

    operations = [
        migrations.CreateModel(
            name="Planning",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("name", models.CharField(max_length=100)),
                ("description", models.TextField(blank=True)),
                ("start_date", models.DateTimeField(blank=True, null=True)),
                ("end_date", models.DateTimeField(blank=True, null=True)),
                ("published_at", models.DateTimeField(null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL
                    ),
                ),
                ("forms", models.ManyToManyField(related_name="teams", to="iaso.Form")),
                ("org_unit", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="iaso.orgunit")),
                ("project", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="iaso.project")),
                ("team", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="iaso.team")),
            ],
            options={
                "ordering": ("name",),
            },
        ),
    ]
