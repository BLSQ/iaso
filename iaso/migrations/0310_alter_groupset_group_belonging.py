# Generated by Django 5.1.3 on 2024-12-02 15:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("iaso", "0309_alter_potentialpayment_user"),
    ]

    operations = [
        migrations.AlterField(
            model_name="groupset",
            name="group_belonging",
            field=models.TextField(
                choices=[("SINGLE", "SINGLE"), ("MULTIPLE", "MULTIPLE")], default="SINGLE", max_length=10
            ),
        ),
    ]