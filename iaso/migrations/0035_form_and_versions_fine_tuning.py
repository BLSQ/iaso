# Generated by Django 2.1.11 on 2020-03-02 11:06

import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("iaso", "0034_form_version_upload_to")]

    operations = [
        migrations.AddField(model_name="form", name="periods_after_allowed", field=models.IntegerField(default=3)),
        migrations.AddField(model_name="form", name="periods_before_allowed", field=models.IntegerField(default=3)),
        migrations.AlterField(
            model_name="form", name="name", field=models.TextField(default="Untitled"), preserve_default=False
        ),
        migrations.AlterField(model_name="form", name="single_per_period", field=models.BooleanField(default=False)),
        migrations.AlterField(
            model_name="instance",
            name="form",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="instances",
                to="iaso.Form",
            ),
        ),
    ]
