from django.db import migrations


def fill_allow_creating_sub_unit_types(apps, schema_editor):
    OrgUnitType = apps.get_model("iaso", "OrgUnitType")
    # don't override
    out_without_allow_creating_sub_unit_types = OrgUnitType.objects.filter(allow_creating_sub_unit_types=None)
    for out in out_without_allow_creating_sub_unit_types:
        out.allow_creating_sub_unit_types.set(out.sub_unit_types.all())


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0216_merge_20230614_0839"),
    ]

    operations = [migrations.RunPython(fill_allow_creating_sub_unit_types, migrations.RunPython.noop)]
