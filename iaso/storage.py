from storages.backends.s3boto3 import S3Boto3Storage  # type: ignore


class StaticStorage(S3Boto3Storage):
    location = "iasostatics"
    default_acl = "public-read"
