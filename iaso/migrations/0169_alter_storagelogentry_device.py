# Generated by Django 3.2.15 on 2022-10-12 09:51

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0168_storagedevice_storagelogentry"),
    ]

    operations = [
        migrations.AlterField(
            model_name="storagelogentry",
            name="device",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, related_name="log_entries", to="iaso.storagedevice"
            ),
        ),
    ]
