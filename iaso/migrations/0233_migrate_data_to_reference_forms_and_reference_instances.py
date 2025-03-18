# Generated by Django 3.2.21 on 2023-09-15 08:05
"""
Migrate data between fields.
"""

from django.db import migrations


def migrate_data_forward(apps, schema_editor):
    OrgUnitType = apps.get_model("iaso", "OrgUnitType")
    OrgUnit = apps.get_model("iaso", "OrgUnit")
    OrgUnitReferenceInstance = apps.get_model("iaso", "OrgUnitReferenceInstance")

    # Migrate data: `OrgUnitType.reference_form` -> `OrgUnitType.reference_forms`.
    for org_unit_type in OrgUnitType.objects.filter(reference_form__isnull=False):
        org_unit_type.reference_forms.add(org_unit_type.reference_form)
        org_unit_type.save()

    # Migrate data: `OrgUnit.reference_instance` -> `OrgUnit.reference_instances`.
    for org_unit in OrgUnit.objects.filter(reference_instance__isnull=False).select_related("reference_instance__form"):
        OrgUnitReferenceInstance.objects.create(
            org_unit=org_unit, form=org_unit.reference_instance.form, instance=org_unit.reference_instance
        )


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0232_add_reference_forms_and_reference_instances"),
    ]

    operations = [migrations.RunPython(migrate_data_forward, migrations.RunPython.noop, elidable=True)]
