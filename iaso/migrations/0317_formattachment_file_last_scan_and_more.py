# Generated by Django 4.2.17 on 2025-03-17 16:26

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0316_merge_20250121_1321"),
    ]

    operations = [
        migrations.AddField(
            model_name="formattachment",
            name="file_last_scan",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="formattachment",
            name="file_scan_status",
            field=models.CharField(
                choices=[
                    ("CLEAN", "Clean"),
                    ("PENDING", "Pending"),
                    ("INFECTED", "Infected"),
                    ("ERROR", "Error"),
                ],
                default="PENDING",
                max_length=10,
            ),
        ),
    ]
