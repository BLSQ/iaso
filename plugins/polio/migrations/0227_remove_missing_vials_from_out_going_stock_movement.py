# Generated by Django 4.2.20 on 2025-04-09 13:06

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0226_move_missing_vials_from_form_A_to_incident_report"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="outgoingstockmovement",
            name="missing_vials",
        ),
    ]
