# Generated by Django 4.2.10 on 2024-03-14 14:15

from django.db import migrations


CODE = "MOBILE_ENTITY_WARN_WHEN_FOUND"


def create_feature_flags(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.get_or_create(
        code=CODE, defaults={"name": "Mobile: Display a message when an entity is found in the duplicate search"}
    )


def destroy_feature_flags(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.filter(code=CODE).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0269_auto_20240314_1326"),
    ]

    operations = [
        migrations.RunPython(create_feature_flags, destroy_feature_flags),
    ]
