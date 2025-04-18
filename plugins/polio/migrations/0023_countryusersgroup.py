# Generated by Django 3.1.12 on 2021-08-27 11:16

import django.db.models.deletion

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0102_page_type"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("polio", "0022_auto_20210813_1319"),
    ]

    operations = [
        migrations.CreateModel(
            name="CountryUsersGroup",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("country", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to="iaso.orgunit")),
                ("users", models.ManyToManyField(blank=True, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
