# Generated by Django 3.2.14 on 2022-08-17 12:23

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0157_auto_20220817_1136"),
    ]

    operations = [
        migrations.AlterField(
            model_name="instance",
            name="entity",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="instances",
                to="iaso.entity",
            ),
        ),
    ]
