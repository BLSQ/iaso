# Generated by Django 3.2.15 on 2022-10-05 14:17

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0088_alter_budgetstep_comment"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="budgetstep",
            name="links",
        ),
    ]