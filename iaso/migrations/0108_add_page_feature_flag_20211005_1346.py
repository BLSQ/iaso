from django.db import migrations


def create_page_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get_or_create(code="SHOW_PAGES", defaults={"name": "Show page menu"})


def reverse_create_page_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get(code="SHOW_PAGES", name="Show page menu").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0107_auto_20211001_1845"),
    ]

    operations = [
        migrations.RunPython(create_page_account_flag, reverse_create_page_account_flag),
    ]
