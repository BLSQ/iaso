# Generated by Django 4.2.14 on 2024-09-10 19:49

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0296_alter_account_modules"),
    ]

    operations = [
        migrations.AddField(
            model_name="entity",
            name="merged_to",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.entity"
            ),
        ),
    ]
