# Generated by Django 3.1.12 on 2021-07-12 09:25

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0016_config"),
    ]

    operations = [
        migrations.AddField(
            model_name="campaign",
            name="gpei_email",
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
    ]