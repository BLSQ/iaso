# Generated by Django 3.1.13 on 2021-10-01 18:45

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0106_merge_20210906_1310"),
    ]

    operations = [
        migrations.AlterField(
            model_name="orgunittype",
            name="category",
            field=models.CharField(
                blank=True,
                choices=[("COUNTRY", "Country"), ("REGION", "Region"), ("DISTRICT", "District")],
                max_length=8,
                null=True,
            ),
        ),
    ]
