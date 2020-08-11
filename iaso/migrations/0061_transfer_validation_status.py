from django.db import migrations

def transfer_validation_status(apps, schema_editor):
    # We can't import the Person model directly as it may be a newer
    # version than this migration expects. We use the historical version.
    org_unit_model = apps.get_model('iaso', 'OrgUnit')
    for ou in org_unit_model.objects.filter(validated=True):
        ou.validation_status = org_unit_model.VALIDATION_VALID
        person.save()

class Migration(migrations.Migration):

    dependencies = [
        ('iaso', '0060_auto_20200811_1742'),
    ]

    operations = [
        migrations.RunPython(transfer_validation_status),
    ]