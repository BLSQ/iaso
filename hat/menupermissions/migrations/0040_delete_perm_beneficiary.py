from django.db import migrations


class Migration(migrations.Migration):
    def remove_perm(apps, schema_editor):
        Permission = apps.get_model("auth", "Permission")
        Permission.objects.filter(codename="iaso_beneficiaries").delete()

    dependencies = [
        ("menupermissions", "0039_alter_custompermissionsupport_options"),
    ]

    operations = [
        migrations.RunPython(remove_perm, migrations.RunPython.noop),
    ]
