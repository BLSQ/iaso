import os

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from storages.backends.s3boto3 import S3Boto3Storage  # type: ignore


class StaticStorage(S3Boto3Storage):
    location = "iasostatics"
    default_acl = "public-read"


class OverwriteStorage(FileSystemStorage):
    def get_available_name(self, name: str, max_length: int = None):
        # If the filename already exists, remove it as if it was a true file system
        new_name = name[0:max_length] if max_length else name
        if self.exists(new_name):
            os.remove(os.path.join(settings.MEDIA_ROOT, new_name))
        return new_name
