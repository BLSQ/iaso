from django.db import migrations


def create_mobile_stock_home_feature_flag(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    # The flag was already created by hand on some servers: align it instead of failing on the unique code
    FeatureFlag.objects.update_or_create(
        code="MOBILE_STOCK_HOME",
        defaults={
            "name": "Mobile: Stock mode on home screen",
            "category": "STM",
            "order": 2,
        },
    )


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0413_remove_mobile_change_requests_tab_test_schema"),
    ]

    operations = [
        # Reverse is a no-op: the flag predates this migration on some servers and may be in use by projects
        migrations.RunPython(create_mobile_stock_home_feature_flag, migrations.RunPython.noop),
    ]
