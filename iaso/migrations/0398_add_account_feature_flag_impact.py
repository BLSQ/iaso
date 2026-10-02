from django.db import migrations


def create_account_feature_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get_or_create(
        code="IMPACT",
        defaults={"name": "Show Impact (compare and optimize) feature"},
    )


def destroy_account_feature_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get(code="IMPACT").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0397_bulkcreateuserfile_file_size_and_more"),
    ]

    operations = [
        migrations.RunPython(create_account_feature_flag, destroy_account_feature_flag),
    ]
