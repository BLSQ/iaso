from django.db import migrations, models
import uuid


def create_uuid(apps, schema_editor):
    Form = apps.get_model("iaso", "Form")
    for form in Form.objects.all():
        form.uuid = uuid.uuid4()
        form.save()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0062_transfer_validation_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="form",
            name="uuid",
            field=models.UUIDField(blank=True, null=True),
        ),
        migrations.RunPython(create_uuid),
        migrations.AlterField(model_name="form", name="uuid", field=models.UUIDField(unique=True)),
    ]
