from django.db import migrations


def create_link_instance_reference_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get_or_create(
        code="SHOW_LINK_INSTANCE_REFERENCE", defaults={"name": "Show link the instance reference"}
    )


def reverse_link_instance_reference_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get(
        code="SHOW_LINK_INSTANCE_REFERENCE", name="Show link the instance reference"
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0143_add_microplanning_feature_flag"),
    ]

    operations = [
        migrations.RunPython(create_link_instance_reference_account_flag, reverse_link_instance_reference_flag),
    ]
