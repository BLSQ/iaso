# Generated by Django 4.2.20 on 2025-06-19 14:36

from django.db import migrations


def migrate_data_forward(apps, schema_editor):
    # Unfortunately, this is still too long to succeed in prod…
    # https://github.com/BLSQ/iaso/pull/2234
    pass

    # chunk_size = 500  # Keep a small chunk_size because the SELECT query is very costly.
    # Instance = apps.get_model("iaso", "Instance")
    #
    # print("-" * 80)
    # print("Start fixing `form_version_id=None` where possible.")
    #
    # instances = (
    #     Instance.objects.filter(form_version__isnull=True, json__isnull=False)
    #     .annotate(
    #         annotated_form_version_id=RawSQL(
    #             "select id from iaso_formversion where version_id = iaso_instance.json->>'_version' limit 1", ()
    #         )
    #     )
    #     .iterator(chunk_size=chunk_size)
    # )
    #
    # instance_to_update = []
    # for instance in instances:
    #     if not instance.annotated_form_version_id:
    #         continue
    #     instance.form_version_id = instance.annotated_form_version_id
    #     instance_to_update.append(instance)
    #     if len(instance_to_update) >= chunk_size:
    #         print(f"Updating {len(instance_to_update)} Instances…")
    #         Instance.objects.bulk_update(instance_to_update, ["form_version_id"])
    #         instance_to_update = []
    #
    # if len(instance_to_update) > 0:
    #     print(f"Updating {len(instance_to_update)} Instances…")
    #     Instance.objects.bulk_update(instance_to_update, ["form_version_id"])
    #
    # print("Done.")


class Migration(migrations.Migration):
    atomic = False  # Prevent the migration from running in a transaction.

    dependencies = [
        ("iaso", "0327_orgunitchangerequest_deleted_at"),
    ]

    operations = [
        migrations.RunPython(migrate_data_forward, migrations.RunPython.noop, elidable=True),
    ]
