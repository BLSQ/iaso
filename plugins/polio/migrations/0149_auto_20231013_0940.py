# Generated by Django 3.2.21 on 2023-10-13 09:40

import django.core.validators
import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0235_merge_20231006_0940"),
        ("polio", "0148_merge_20231013_0907"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReasonForDelay",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("name_fr", models.CharField(blank=True, max_length=200, verbose_name="name")),
                ("name_en", models.CharField(max_length=200, verbose_name="name")),
                (
                    "key_name",
                    models.CharField(
                        blank=True, max_length=200, validators=[django.core.validators.RegexValidator("^[A-Z_]+$")]
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "account",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="reasons_for_delay", to="iaso.account"
                    ),
                ),
            ],
            options={
                "unique_together": {("key_name", "account")},
            },
        ),
        migrations.AddField(
            model_name="rounddatehistoryentry",
            name="reason_for_delay",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="round_history_entries",
                to="polio.reasonfordelay",
            ),
        ),
    ]
