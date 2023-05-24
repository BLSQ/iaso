from django.db import migrations


def create_feature_flags(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    x = FeatureFlag.objects.create(
        code="LIMIT_OU_DOWNLOAD_TO_ROOTS",
        name="Mobile: Limit download of orgunit to what the user has access to",
    )


def destroy_feature_flags(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.filter(code="LIMIT_OU_DOWNLOAD_TO_ROOTS").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0205_merge_20230504_1352"),
    ]

    operations = [
        migrations.RunPython(create_feature_flags, destroy_feature_flags),
    ]
