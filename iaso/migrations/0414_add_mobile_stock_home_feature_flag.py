from django.db import migrations


CODE = "MOBILE_STOCK_HOME"


def create_mobile_stock_home_feature_flag(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.update_or_create(
        code=CODE,
        defaults={
            "name": "Mobile: Stock mode on home screen",
            "category": "STM",
            "order": 2,
        },
    )


def destroy_mobile_stock_home_feature_flag(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.filter(code=CODE).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0413_remove_mobile_change_requests_tab_test_schema"),
    ]

    operations = [
        migrations.RunPython(create_mobile_stock_home_feature_flag, destroy_mobile_stock_home_feature_flag),
    ]
