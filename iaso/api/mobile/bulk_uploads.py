import datetime
import logging
import os
import zipfile

from botocore.exceptions import ClientError
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import serializers, status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from iaso.api.query_params import APP_ID
from iaso.api.serializers import AppIdSerializer
from iaso.models import Project
from iaso.tasks.process_mobile_bulk_upload import process_mobile_bulk_upload
from iaso.utils.s3_client import upload_file_to_s3

logger = logging.getLogger(__name__)


class ZipFileSerializer(serializers.Serializer):
    zip_file = serializers.FileField()

    def validateZipFile(self):
        if self.is_valid():
            return self.validated_data["zip_file"]
        raise ValueError("Zip file not valid")


class MobileBulkUploadsViewSet(ViewSet):
    app_id_param = openapi.Parameter(
        name=APP_ID,
        in_=openapi.IN_QUERY,
        required=True,
        description="Application id",
        type=openapi.TYPE_STRING,
    )
    zip_file_param = openapi.Parameter(
        name="zip_file",
        in_=openapi.IN_FORM,
        required=True,
        description="file to import",
        type=openapi.TYPE_FILE,
    )

    @swagger_auto_schema(
        responses={
            204: "Import was successful",
            400: f"parameters '{APP_ID}' was not provided or post didn't contain an zip",
            404: "project for given app id doesn't exist",
        },
        manual_parameters=[app_id_param, zip_file_param],
    )
    def create(self, request):
        current_user = self.request.user
        user = self.request.user
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=True)
        project = get_object_or_404(Project, app_id=app_id)
        serializer = ZipFileSerializer(data=request.data)

        try:
            zip_file = serializer.validateZipFile()

            timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H:%M:%S.%f")
            object_name = "/".join(
                [
                    "mobilebulkuploads",
                    app_id,
                    str(user.id),
                    f"mobilebulkupload-{timestamp}.zip",
                ]
            )

            print("object_name ", object_name)

            upload_file_to_s3(
                file_name=zip_file.temporary_file_path(),
                object_name=object_name,
            )

            _task = process_mobile_bulk_upload(
                user_id=user.id,
                project_id=project.id,
                zip_file_object_name=object_name,
                user=current_user,
            )

            return Response(status=status.HTTP_204_NO_CONTENT)
            # except Exception as e:
            #     # Handle any errors that occur during processing
            #     return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # TODO: this eats everything?
        except ValueError:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ClientError as exc:
            logger.exception(f"Upload to S3 failed: {str(exc)}")
            return Response(serializer.errors, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
