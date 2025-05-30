# Generated by Django 3.2.21 on 2023-12-07 14:23

import django.contrib.postgres.fields
import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0249_merge_20231205_1120"),
        ("polio", "0160_merge_20231205_1038"),
    ]

    operations = [
        migrations.CreateModel(
            name="VaccineStock",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "vaccine",
                    models.CharField(choices=[("mOPV2", "mOPV2"), ("nOPV2", "nOPV2"), ("bOPV", "bOPV")], max_length=5),
                ),
                (
                    "account",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="vaccine_stocks", to="iaso.account"
                    ),
                ),
                (
                    "country",
                    models.ForeignKey(
                        blank=True,
                        help_text="Unique (Country, Vaccine) pair",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="vaccine_stocks",
                        to="iaso.orgunit",
                    ),
                ),
            ],
            options={
                "unique_together": {("country", "vaccine")},
            },
        ),
        migrations.CreateModel(
            name="OutgoingStockMovement",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("report_date", models.DateField()),
                ("form_a_reception_date", models.DateField()),
                ("usable_vials_used", models.PositiveIntegerField()),
                ("unusable_vials", models.PositiveIntegerField()),
                (
                    "lot_numbers",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(blank=True, max_length=200), default=list, size=None
                    ),
                ),
                ("missing_vials", models.PositiveIntegerField(default=0)),
                ("campaign", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="polio.campaign")),
                (
                    "vaccine_stock",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="polio.vaccinestock"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="IncidentReport",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "stock_correction",
                    models.CharField(
                        choices=[
                            ("vvm_reached_discard_point", "VVM reached the discard point"),
                            ("vaccine_expired", "Vaccine expired"),
                            ("losses", "Losses"),
                            ("return", "Return"),
                            ("stealing", "Stealing"),
                            ("physical_inventory", "Physical Inventory"),
                        ],
                        default="vvm_reached_discard_point",
                        max_length=50,
                    ),
                ),
                ("date_of_incident_report", models.DateField()),
                ("incident_report_received_by_rrt", models.DateField()),
                ("unusable_vials", models.PositiveIntegerField()),
                ("usable_vials", models.PositiveIntegerField()),
                (
                    "vaccine_stock",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="polio.vaccinestock"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="DestructionReport",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.TextField()),
                ("rrt_destruction_report_reception_date", models.DateField()),
                ("destruction_report_date", models.DateField()),
                ("unusable_vials_destroyed", models.PositiveIntegerField()),
                ("lot_number", models.CharField(max_length=200)),
                (
                    "vaccine_stock",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="polio.vaccinestock"),
                ),
            ],
        ),
    ]
