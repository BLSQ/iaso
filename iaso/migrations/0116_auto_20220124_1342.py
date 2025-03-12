# Generated by Django 3.1.14 on 2022-01-24 13:42

import uuid

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0115_auto_20220124_1120"),
    ]

    operations = [
        migrations.AlterField(
            model_name="entity",
            name="attributes",
            field=models.ForeignKey(
                blank=True,
                help_text="instance",
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="iaso.instance",
            ),
        ),
        migrations.AlterField(
            model_name="entity",
            name="uuid",
            field=models.UUIDField(default=uuid.uuid4, editable=False, null=True, unique=True),
        ),
    ]
