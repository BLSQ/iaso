# Generated by Django 3.1 on 2022-04-15 13:02

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0050_alter_campaigngroup_campaigns"),
    ]

    operations = [
        migrations.AddField(
            model_name="round",
            name="campaign",
            field=models.ForeignKey(
                null=True, on_delete=django.db.models.deletion.PROTECT, related_name="groups", to="polio.campaign"
            ),
        ),
        migrations.AddField(
            model_name="round",
            name="number",
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
