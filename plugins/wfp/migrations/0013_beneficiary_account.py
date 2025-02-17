# Generated by Django 4.2.16 on 2024-11-02 08:14

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0307_merge_20241024_1145"),
        ("wfp", "0012_rename_weight_difference_journey_initial_weight_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="beneficiary",
            name="account",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to="iaso.account"
            ),
        ),
    ]
