# Generated by Django 3.2.22 on 2023-11-20 07:45

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0243_alter_instance_planning"),
    ]

    operations = [
        migrations.AddField(
            model_name="orgunit",
            name="closed_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="orgunit",
            name="opening_date",
            field=models.DateField(blank=True, null=True),
        ),
    ]