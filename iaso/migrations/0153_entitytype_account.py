# Generated by Django 3.2.14 on 2022-08-04 12:09

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0152_auto_20220802_1408"),
    ]

    operations = [
        migrations.AddField(
            model_name="entitytype",
            name="account",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.account"
            ),
        ),
    ]
