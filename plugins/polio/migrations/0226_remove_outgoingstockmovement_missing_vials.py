# Generated by Django 4.2.20 on 2025-04-02 15:33

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("polio", "0225_campaign_on_hold"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="outgoingstockmovement",
            name="missing_vials",
        ),
    ]
