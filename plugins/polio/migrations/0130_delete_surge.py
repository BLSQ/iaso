# Generated by Django 3.2.15 on 2023-04-17 16:36

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("polio", "0129_remove_campaign_country_name_in_surge_spreadsheet"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Surge",
        ),
    ]
