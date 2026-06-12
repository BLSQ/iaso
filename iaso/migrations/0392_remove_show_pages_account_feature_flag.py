from django.db import migrations


def delete_show_pages_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.filter(code="SHOW_PAGES").delete()


def restore_show_pages_flag(apps, schema_editor):
    AccountFeatureFlag = apps.get_model("iaso", "AccountFeatureFlag")
    AccountFeatureFlag.objects.get_or_create(code="SHOW_PAGES", defaults={"name": "Show page menu"})


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0391_alter_formattachment_file"),
    ]

    operations = [
        migrations.RunPython(delete_show_pages_flag, restore_show_pages_flag),
    ]
