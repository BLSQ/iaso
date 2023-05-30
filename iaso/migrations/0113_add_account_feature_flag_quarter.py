from django.db import migrations


def create_shape_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.create(code="HIDE_PERIOD_QUARTER_NAME", name="Hide quarter name in period on Iaso UI")


def reverse_create_shape_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get(
        code="HIDE_PERIOD_QUARTER_NAME", name="Hide quarter name in period on Iaso UI"
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0112_auto_20220110_1503"),
    ]

    operations = [
        migrations.RunPython(create_shape_account_flag, reverse_create_shape_account_flag),
    ]
