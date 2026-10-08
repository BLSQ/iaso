from django.db import migrations


def set_mobile_stock_requires_authentication(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.filter(code="MOBILE_STOCK").update(requires_authentication=True)


def unset_mobile_stock_requires_authentication(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.filter(code="MOBILE_STOCK").update(requires_authentication=False)


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0403_instance_file_max_length"),
    ]

    operations = [
        migrations.RunPython(set_mobile_stock_requires_authentication, unset_mobile_stock_requires_authentication),
    ]
