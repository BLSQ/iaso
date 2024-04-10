import os
import boto3

from django.conf import settings


def upload_file_to_s3(file_name, object_name=None):
    """Upload a file to our S3 bucket
    :param file_name: File to upload
    :param object_name: S3 object name. If not specified then file_name is used
    :return: nothing
    """

    # If S3 object_name was not specified, use file_name
    if object_name is None:
        object_name = os.path.basename(file_name)

    # Upload the file
    boto3.client("s3", region_name=settings.AWS_S3_REGION_NAME).upload_file(
        file_name,
        settings.AWS_STORAGE_BUCKET_NAME,
        object_name,
    )


def generate_presigned_url_from_s3(object_name, expires_in=3600):
    """Generate a signed URL for a file on our S3 bucket
    :param object_name: S3 object name.
    :param expires_in: URL expiration time in seconds, 1 hour by default.
    :return: string with the S3 URL
    """

    return boto3.client("s3", region_name=settings.AWS_S3_REGION_NAME).generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": object_name},
        ExpiresIn=expires_in,
    )


def download_file(object_name):
    file_name = object_name.split("/")[-1]
    destination_file_name = "/tmp/" + file_name

    boto3.client("s3", region_name=settings.AWS_S3_REGION_NAME).download_file(
        settings.AWS_STORAGE_BUCKET_NAME,
        object_name,
        destination_file_name,
    )

    return destination_file_name
