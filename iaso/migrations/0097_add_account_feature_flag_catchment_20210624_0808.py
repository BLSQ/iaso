from django.db import migrations


def create_shape_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.create(code="ALLOW_CATCHMENT_EDITION", name="Allow catchment shape edition in Iaso UI")


def reverse_create_shape_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get(
        code="ALLOW_CATCHMENT_EDITION", name="Allow catchment shape edition in Iaso UI"
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0096_add_account_feature_flag_20210621_1244"),
    ]

    operations = [
        migrations.RunPython(create_shape_account_flag, reverse_create_shape_account_flag),
    ]
