# Generated by Django 3.2.15 on 2023-05-22 14:34

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0206_add_feature_flag_LIMIT_OU_DOWNLOAD_TO_ROOTS"),
    ]

    operations = [
        migrations.AddField(
            model_name="orgunittype",
            name="allow_creating_sub_unit_types",
            field=models.ManyToManyField(blank=True, related_name="create_types", to="iaso.OrgUnitType"),
        ),
    ]