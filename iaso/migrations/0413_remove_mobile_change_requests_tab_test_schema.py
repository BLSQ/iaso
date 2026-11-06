from django.db import migrations


# Typed by hand while testing configurable feature flags, then captured in 0001_squashed_0343.
# It disables the project dialog Save button when the flag is enabled without a saved configuration.
TEST_CONFIGURATION_SCHEMA = {
    "test": {"type": "string", "default": "Hit me baby one more time", "description": "Whatever you want"}
}


def remove_test_configuration_schema(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    # Only the test schema is removed: a missing flag or another schema is left as is
    FeatureFlag.objects.filter(
        code="MOBILE_CHANGE_REQUESTS_TAB", configuration_schema=TEST_CONFIGURATION_SCHEMA
    ).update(configuration_schema=None)


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0412_team_updated_by_alter_team_created_by"),
    ]

    operations = [
        migrations.RunPython(remove_test_configuration_schema, migrations.RunPython.noop, elidable=True),
    ]
