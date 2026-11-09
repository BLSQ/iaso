"""Local copies of the form files odk_cli reads - the XForm and its CSV attachments -, kept between requests: on a
server the files are in S3, and odk_cli reads them from the disk for each submission.

A copy is keyed by the file's storage name and size: the storage never overwrites a file (`AWS_S3_FILE_OVERWRITE =
False`, a new upload gets a new name), so a name stands for one content. Nothing is ever removed: a form version's
files only change when a new version is uploaded, under new names."""

import hashlib
import os
import tempfile

from django.conf import settings
from django.db.models.fields.files import FieldFile


def local_copy(file: FieldFile) -> str:
    """The path of a local copy of a form's file, read from the storage the first time only."""
    size_field_name = getattr(file.field, "size_field_name", None)
    size = getattr(file.instance, size_field_name, None) if size_field_name else None
    key = hashlib.sha256(f"{file.name}\0{size}".encode()).hexdigest()
    path = os.path.join(settings.ODK_CLI_CACHE_DIR, key + os.path.splitext(file.name)[1])
    if not os.path.exists(path):
        os.makedirs(settings.ODK_CLI_CACHE_DIR, exist_ok=True)
        file.open("rb")
        try:
            content = file.read()
        finally:
            file.close()
        # written aside, then renamed: another process never reads a copy half written
        descriptor, partial = tempfile.mkstemp(dir=settings.ODK_CLI_CACHE_DIR, suffix=".partial")
        with os.fdopen(descriptor, "wb") as copy:
            copy.write(content)
        os.replace(partial, path)
    return path
