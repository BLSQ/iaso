# Generated by Django 2.1.11 on 2020-02-19 15:57

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("iaso", "0031_auto_20200121_1327")]

    operations = [
        migrations.AlterField(
            model_name="instance",
            name="form",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name="instances",
                to="iaso.Form",
            ),
        )
    ]
