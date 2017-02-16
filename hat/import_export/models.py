from django.db import models

SOURCE_CHOICES = (
    ('backup_import', 'Mobile backup'),
    ('csv_import', 'Testing'),  # probably do not save these ones
    ('historic_import', 'Historic'),
    ('import_error', 'Error'),  # probably do not save these ones
    ('locations_areas_import', 'Health areas'),
    ('locations_import', 'Locations'),
    ('merge_import', 'Merge duplicates'),   # keep track of merging steps here too
    ('pv_import', 'Pharmacovigilance'),
    ('reconciled_import', 'Reconciled data'),
    ('sync_import', 'Synced device'),
)


class ImportLog(models.Model):
    source = models.TextField(choices=SOURCE_CHOICES, null=True)
    stamp = models.DateTimeField(auto_now_add=True)

    # import stats
    num_total = models.PositiveIntegerField(default=0)
    num_created = models.PositiveIntegerField(default=0)
    num_updated = models.PositiveIntegerField(default=0)
    num_deleted = models.PositiveIntegerField(default=0)
    extra_stats = models.TextField(null=True)

    # if we are importing a file those are the needed fields
    filename = models.TextField(null=True)
    file_hash = models.TextField(unique=True, null=True)
    content = models.BinaryField(null=True)
    mimetype = models.TextField(null=True)
    # and no more

    # if we are not importing a file those are the needed fields
    documents = models.TextField(null=True)
    device_id = models.TextField(null=True)
    # and no more
