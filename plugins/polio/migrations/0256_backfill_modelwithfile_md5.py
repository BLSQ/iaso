# Generated manually to backfill ModelWithFile.md5

from django.db import migrations

from iaso.utils.encryption import calculate_md5


MODEL_NAMES = [
    "VaccineRequestForm",
    "VaccinePreAlert",
    "OutgoingStockMovement",
    "DestructionReport",
    "IncidentReport",
    "NotificationImport",
]

CHUNK_SIZE = 100


def _backfill_model(Model, model_name):
    """Idempotent, chunked backfill of md5 for rows that don't have one yet.

    Only rows with a file and an empty md5 are considered, so the migration
    can safely be re-run (e.g. after a partial failure) without recomputing
    hashes that were already stored.
    """

    to_update = []
    # `only` keeps the SELECT narrow so we don't pull unused columns on large tables.
    queryset = (
        Model.objects.filter(md5="")
        .exclude(file="")
        .exclude(file__isnull=True)
        .only("pk", "file", "md5")
        .iterator(chunk_size=CHUNK_SIZE)
    )

    for instance in queryset:
        # Storage.exists() is implemented consistently across backends (local filesystem,
        # S3, Azure), unlike the exception a missing file raises on read: Azure's blob
        # download raises azure.core.exceptions.ResourceNotFoundError, which isn't an
        # OSError, so it wasn't caught below and crashed the whole migration.
        if not instance.file.storage.exists(instance.file.name):
            print(f"skipping {model_name} pk={instance.pk}: file {instance.file.name!r} not found in storage")
            continue

        try:
            md5 = calculate_md5(instance.file)
        except (FileNotFoundError, OSError) as e:
            print(f"there was an error while calculating file md5 - {str(e)}")
            continue

        if md5:
            instance.md5 = md5
            to_update.append(instance)

            if len(to_update) >= CHUNK_SIZE:
                print(f"Updating {len(to_update)} {model_name}…")
                Model.objects.bulk_update(to_update, ["md5"])
                to_update = []

    if to_update:
        print(f"Updating {len(to_update)} {model_name}…")
        Model.objects.bulk_update(to_update, ["md5"])


def migrate_data_forward(apps, schema_editor):
    for model_name in MODEL_NAMES:
        Model = apps.get_model("polio", model_name)
        _backfill_model(Model, model_name)


class Migration(migrations.Migration):
    # Non-atomic on purpose: the backfill commits per chunk so we don't hold a
    # single long transaction/lock on large tables, and progress survives a late
    # failure. It contains no schema (DDL) changes, so a mid-run failure leaves
    # only already-committed md5 values, and re-running resumes where it stopped.
    atomic = False

    dependencies = [
        ("polio", "0255_modelwithfile_md5"),
    ]

    operations = [
        migrations.RunPython(migrate_data_forward, migrations.RunPython.noop, elidable=True),
    ]
