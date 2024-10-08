# Generated by Django 4.2.13 on 2024-08-23 13:02

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0192_incidentreport_comment_incidentreport_title_and_more"),
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
                    ("physical_inventory", "Physical Inventory"),
                    ("broken", "Broken"),
                    ("unreadable_label", "Unreadable label"),
                ],
                default="vvm_reached_discard_point",
                max_length=50,
            ),
        ),
    ]
