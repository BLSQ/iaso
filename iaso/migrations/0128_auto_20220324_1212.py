# Generated by Django 3.1.14 on 2022-03-24 12:12

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0127_merge_20220322_1012"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="profile",
            constraint=models.UniqueConstraint(fields=("dhis2_id", "account"), name="dhis2_id_constraint"),
        ),
    ]