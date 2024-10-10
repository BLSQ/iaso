# Generated by Django 3.2.15 on 2023-02-21 12:28

import django.contrib.postgres.fields
import django.contrib.postgres.fields.citext
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0194_merge_20230221_0956"),
    ]

    operations = [
        migrations.AddField(
            model_name="entitytype",
            name="fields_duplicate_search",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=django.contrib.postgres.fields.citext.CITextField(blank=True, max_length=255),
                blank=True,
                null=True,
                size=100,
            ),
        ),
    ]