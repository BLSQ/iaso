# Generated by Django 2.1.11 on 2020-01-02 07:29

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("iaso", "0021_auto_20191203_1302")]

    operations = [
        migrations.AlterField(
            model_name="sourceversion",
            name="data_source",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, related_name="versions", to="iaso.DataSource"
            ),
        )
    ]
