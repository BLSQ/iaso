# Generated by Django 3.2.13 on 2022-05-23 12:37

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0138_bulkcreateusercsvfile"),
    ]

    operations = [
        migrations.AddField(
            model_name="bulkcreateusercsvfile",
            name="account",
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.account"),
        ),
    ]
