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
    boto3.client("s3").upload_file(
        file_name,
        settings.AWS_STORAGE_BUCKET_NAME,
        object_name,
    )
