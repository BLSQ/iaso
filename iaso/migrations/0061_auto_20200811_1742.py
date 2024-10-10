# Generated by Django 3.0.3 on 2020-08-11 17:42

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("iaso", "0060_auto_20200811_1740")]

    operations = [
        migrations.AlterField(
            model_name="orgunit",
            name="validation_status",
            field=models.CharField(
                choices=[("NEW", "new"), ("VALID", "valid"), ("REJECTED", "rejected")], default="NEW", max_length=25
            ),
        )
    ]