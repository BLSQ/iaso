# Generated by Django 3.1.14 on 2022-01-26 18:44

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0120_auto_20220126_1826"),
    ]

    operations = [
        migrations.AddField(
            model_name="entity",
            name="account",
            field=models.OneToOneField(default=1, on_delete=django.db.models.deletion.PROTECT, to="iaso.account"),
            preserve_default=False,
        ),
    ]
