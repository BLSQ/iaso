# Generated by Django 4.2.11 on 2024-06-24 10:36

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0178_subactivity_subactivityscope"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="outgoingstockmovement",
            name="usable_vials_used",
        ),
    ]
