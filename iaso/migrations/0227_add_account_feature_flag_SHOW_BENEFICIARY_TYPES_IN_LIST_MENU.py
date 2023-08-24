from django.db import migrations


def create_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get_or_create(
        code="SHOW_BENEFICIARY_TYPES_IN_LIST_MENU", defaults={"name": "Display beneficiaries by types in side menu"}
    )


def reverse_create_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get(
        code="SHOW_BENEFICIARY_TYPES_IN_LIST_MENU", name="Display beneficiaries by types in side menu"
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0226_merge_20230724_1245"),
    ]

    operations = [
        migrations.RunPython(create_account_flag, reverse_create_account_flag),
    ]
