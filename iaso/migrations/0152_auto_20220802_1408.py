# Generated by Django 3.2.13 on 2022-08-02 14:08

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0151_auto_20220718_1013"),
    ]

    operations = [
        migrations.AddField(
            model_name="entity",
            name="instances",
            field=models.ManyToManyField(blank=True, to="iaso.Instance"),
        ),
        migrations.AlterField(
            model_name="entity",
            name="attributes",
            field=models.OneToOneField(
                help_text="instance",
                on_delete=django.db.models.deletion.PROTECT,
                related_name="attributes",
                to="iaso.instance",
            ),
        ),
    ]
