# Generated by Django 4.2.20 on 2025-04-01 13:01

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0318_add_data_validation_module_to_accounts"),
        ("audit", "0005_alter_modification_user"),
    ]

    operations = [
        migrations.AddField(
            model_name="modification",
            name="org_unit_change_request",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.orgunitchangerequest"
            ),
        ),
    ]
