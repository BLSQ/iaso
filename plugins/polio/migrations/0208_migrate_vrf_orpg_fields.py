# Generated by Django 4.2.17 on 2024-12-11 13:54

from django.db import migrations


def copy_orpg_fields_to_dg_fields(apps, schema_editor):
    VaccineRequestForm = apps.get_model("polio", "VaccineRequestForm")

    vrfs = VaccineRequestForm.objects.filter(deleted_at__isnull=True)
    for vrf in vrfs:
        if not vrf.date_rrt_orpg_approval and vrf.date_dg_approval:
            vrf.date_rrt_orpg_approval = vrf.date_dg_approval
        if not vrf.quantities_approved_by_orpg_in_doses and vrf.quantities_approved_by_dg_in_doses:
            vrf.quantities_approved_by_orpg_in_doses = vrf.quantities_approved_by_dg_in_doses
        vrf.save()


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0207_merge_20241204_1433"),
    ]

    operations = [migrations.RunPython(copy_orpg_fields_to_dg_fields, migrations.RunPython.noop, elidable=True)]
