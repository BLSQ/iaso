from django.db import migrations


def create_shape_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.create(code="ALLOW_SHAPE_EDITION", name="Allow shape edition in Iaso UI")


def reverse_create_shape_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get(code="ALLOW_SHAPE_EDITION", name="Allow shape edition in Iaso UI").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0095_auto_20210621_1131"),
    ]

    operations = [
        migrations.RunPython(create_shape_account_flag, reverse_create_shape_account_flag),
    ]
