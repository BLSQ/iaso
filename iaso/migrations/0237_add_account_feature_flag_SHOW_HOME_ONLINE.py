from django.db import migrations


def create_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get_or_create(
        code="SHOW_HOME_ONLINE", defaults={"name": "Display plugin online home page"}
    )


def reverse_create_account_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get(code="SHOW_HOME_ONLINE", name="Display plugin online home page").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0236_auto_20231012_0955"),
    ]

    operations = [
        migrations.RunPython(create_account_flag, reverse_create_account_flag),
    ]
