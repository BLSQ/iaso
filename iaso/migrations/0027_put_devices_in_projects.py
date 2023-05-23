from django.db import migrations


def put_devices_in_projects(apps, schema_editor):
    Instance = apps.get_model("iaso", "Instance")
    instances = Instance.objects.filter(device__isnull=False)
    for instance in instances:
        instance.device.projects.add(instance.project)


class Migration(migrations.Migration):
    dependencies = [("iaso", "0023_device_projects")]
    operations = []
