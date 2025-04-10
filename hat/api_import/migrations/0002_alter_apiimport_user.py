# Generated by Django 3.2.21 on 2023-10-02 09:59

import django.db.models.deletion

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("api_import", "0001_squashed_0032_auto_20210611_0951"),
    ]

    operations = [
        migrations.AlterField(
            model_name="apiimport",
            name="user",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="apiimports",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
