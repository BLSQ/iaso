from storages.backends.azure_storage import AzureStorage  # type: ignore
from storages.backends.s3boto3 import S3Boto3Storage  # type: ignore


class StaticStorage(S3Boto3Storage):
    location = "iasostatics"
    default_acl = "public-read"


class AzureStaticStorage(AzureStorage):
    azure_container = "iaso"
    location = "static"
    expiration_secs = None
    default_acl = "public-read"


class AzureMediaStorage(AzureStorage):
    azure_container = "iaso"
    location = "media"
    expiration_secs = None
