# Generated by Django 3.2.15 on 2023-02-13 12:39

from django.db import migrations


def create_feature_flags(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.create(
        code="FORM_VERSIONS_NO_READ_ONLY",
        name="Mobile: Form versions are not accessible in read-only without authentication",
    )


def destroy_feature_flags(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.filter(code="FORM_VERSIONS_NO_READ_ONLY").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("iaso", "0193_merge_0192_instance_planning_0192_merge_20230131_1353"),
    ]

    operations = [
        migrations.RunPython(create_feature_flags, destroy_feature_flags),
    ]
