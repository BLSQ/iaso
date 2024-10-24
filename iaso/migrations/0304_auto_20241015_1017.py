from django.db import migrations


# region IA-3550
def remove_org_unit_change_request_feature_flag(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.get(code="ORG_UNIT_CHANGE_REQUEST").delete()


def re_add_org_unit_change_request_feature_flag(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.create(code="ORG_UNIT_CHANGE_REQUEST", name="Request changes to org units.")


# endregion


# region IA-3553
def merge_require_authentication_flags(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    Project = apps.get_model("iaso", "Project")
    try:
        needs_authentication = FeatureFlag.objects.get(code="NEEDS_AUTHENTICATION")
        require_authentication = FeatureFlag.objects.get(code="REQUIRE_AUTHENTICATION")
        for project in Project.objects.filter(feature_flags__code="NEEDS_AUTHENTICATION"):
            project.feature_flags.remove(needs_authentication)
            project.feature_flags.add(require_authentication)
            project.save()
        needs_authentication.delete()
    except FeatureFlag.DoesNotExist:
        pass


def re_add_authentication_flag(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    FeatureFlag.objects.create(code="NEEDS_AUTHENTICATION", name="Mobile: Enforce authentication")


# endregion


# region IA-3556
def make_change_request_require_authentication(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    ff = FeatureFlag.objects.get(code="MOBILE_ORG_UNIT_REGISTRY")
    ff.requires_authentication = True
    ff.save()


def unmake_change_request_require_authentication(apps, schema_editor):
    FeatureFlag = apps.get_model("iaso", "FeatureFlag")
    ff = FeatureFlag.objects.get(code="MOBILE_ORG_UNIT_REGISTRY")
    ff.requires_authentication = False
    ff.save()


# endregion


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0303_merge_20241003_1256"),
    ]

    operations = [
        # IA-3550
        migrations.RunPython(remove_org_unit_change_request_feature_flag, re_add_org_unit_change_request_feature_flag),
        # IA-3553
        migrations.RunPython(merge_require_authentication_flags, re_add_authentication_flag),
        # IA-3556
        migrations.RunPython(make_change_request_require_authentication, unmake_change_request_require_authentication),
    ]
