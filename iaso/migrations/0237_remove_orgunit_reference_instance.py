# Generated by Django 3.2.21 on 2023-09-19 12:17

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0236_migrate_reference_instances"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="orgunit",
            name="reference_instance",
        ),
    ]
