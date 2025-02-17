# Generated by Django 4.2.17 on 2025-02-03 13:46

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0219_rename_physical_inventory"),
    ]

    operations = [
        migrations.AlterField(
            model_name="incidentreport",
            name="stock_correction",
            field=models.CharField(
                choices=[
                    ("vvm_reached_discard_point", "VVM reached the discard point"),
                    ("vaccine_expired", "Vaccine expired"),
                    ("losses", "Losses"),
                    ("return", "Return"),
                    ("stealing", "Stealing"),
                    ("physical_inventory_add", "Add to Physical Inventory"),
                    ("physical_inventory_remove", "remove from Physical Inventory"),
                    ("broken", "Broken"),
                    ("unreadable_label", "Unreadable label"),
                ],
                default="vvm_reached_discard_point",
                max_length=50,
            ),
        ),
    ]
